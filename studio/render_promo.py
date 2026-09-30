#!/usr/bin/env python3
"""FEDGE 2.O Studio — render a vertical promo video for a game with OpenMontage.

Usage (from the FEDGE-2.O folder):
    python studio/render_promo.py tradestreet            # one game
    python studio/render_promo.py all                    # all 6 live games
    python studio/render_promo.py credit --voice none    # captions only, no voiceover
    python studio/render_promo.py --list

Voice: ElevenLabs (FEDGE's voice, uses ELEVEN_API_KEY / ELEVEN_VOICE_ID from .env) when a key
is set, otherwise the free Piper voice that OpenMontage installs. Output: studio/renders/<game>.mp4

OpenMontage (AGPL-3.0) is used as a separate program — this script only feeds it JSON props and
calls its Remotion renderer. None of its code is copied into FEDGE-2.O.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

STUDIO = Path(__file__).resolve().parent
REPO = STUDIO.parent
PROMOS = STUDIO / "promos"
RENDERS = STUDIO / "renders"
MUSIC = STUDIO / "music"
LOCK = RENDERS / ".render.lock"
IS_WIN = os.name == "nt"


# ── helpers ───────────────────────────────────────────────────────────────────
def log(msg: str) -> None:
    print(f"[studio] {msg}", flush=True)


def fail(msg: str) -> "None":
    result({"ok": False, "error": msg})
    sys.exit(1)


def result(payload: dict) -> None:
    # One machine-readable line so fedge-bot.js can read the outcome.
    print("FEDGE_RESULT " + json.dumps(payload), flush=True)


def load_env() -> None:
    env = REPO / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def which(*names: str) -> str | None:
    for n in names:
        p = shutil.which(n)
        if p:
            return p
    return None


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, **kw)


def pid_alive(pid: str) -> bool:
    """True if the process that wrote the lock is still running (a crashed render must not block forever)."""
    if not pid.isdigit():
        return False
    if IS_WIN:  # os.kill would terminate the process on Windows, so ask tasklist instead
        out = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True).stdout
        return pid in out
    try:
        os.kill(int(pid), 0)
        return True
    except OSError:
        return False


def find_openmontage() -> Path:
    candidates = [os.environ.get("OPENMONTAGE_DIR"), REPO.parent / "OpenMontage", Path.home() / "OpenMontage"]
    for c in candidates:
        if c and (Path(c) / "remotion-composer" / "src" / "index.tsx").exists():
            return Path(c).resolve()
    fail("OpenMontage not found. Run studio/setup-studio.ps1 first, or set OPENMONTAGE_DIR in .env.")


def audio_seconds(path: Path) -> float:
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


# ── voice ─────────────────────────────────────────────────────────────────────
def words_evenly(text: str, start: float, dur: float) -> list[dict]:
    """Estimate word timings by length when the voice engine gives no timestamps."""
    words = text.split()
    if not words:
        return []
    weights = [len(w) + 1 for w in words]
    total = sum(weights)
    t, out = start, []
    for w, wt in zip(words, weights):
        d = dur * wt / total
        out.append({"word": w, "start": t, "end": t + d})
        t += d
    return out


def tts_elevenlabs(text: str, dest: Path, brand: dict) -> list[dict]:
    key = os.environ["ELEVEN_API_KEY"]
    voice = os.environ.get("ELEVEN_VOICE_ID", "OhcAdN25ThAFnC904VSS")
    body = json.dumps({
        "text": text,
        "model_id": brand["voice"].get("elevenlabs_model", "eleven_multilingual_v2"),
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.3, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    dest.write_bytes(base64.b64decode(data["audio_base64"]))
    al = data.get("alignment") or {}
    chars = al.get("characters") or []
    starts = al.get("character_start_times_seconds") or []
    ends = al.get("character_end_times_seconds") or []
    words, cur, ws, we = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"word": cur, "start": ws, "end": we})
            cur, ws = "", None
            continue
        if ws is None:
            ws = s
        cur += ch
        we = e
    if cur:
        words.append({"word": cur, "start": ws, "end": we})
    return words


def piper_python(om: Path) -> str | None:
    venv = om / ".venv" / ("Scripts/python.exe" if IS_WIN else "bin/python")
    for py in [str(venv), sys.executable]:
        if py and Path(py).exists():
            ok = subprocess.run([py, "-c", "import piper"], capture_output=True).returncode == 0
            if ok:
                return py
    return None


def tts_piper(text: str, dest: Path, brand: dict, om: Path) -> list[dict]:
    py = piper_python(om)
    if not py:
        raise RuntimeError("Piper is not installed (run studio/setup-studio.ps1)")
    voice = brand["voice"].get("piper_voice", "en_US-ryan-high")
    vdir = om / ".piper-voices"
    vdir.mkdir(exist_ok=True)
    if not (vdir / f"{voice}.onnx").exists():
        log(f"downloading free Piper voice {voice} (one time)...")
        run([py, "-m", "piper.download_voices", "--download-dir", str(vdir), voice], capture_output=True)
    run([py, "-m", "piper", "-m", voice, "--data-dir", str(vdir), "-f", str(dest)],
        input=text.encode("utf-8"), capture_output=True)
    return words_evenly(text, 0.0, audio_seconds(dest))


def merge_caption_words(words: list[dict], replacements: dict) -> list[dict]:
    """Show 'fedge2o.com' in captions while the voice says 'FEDGE two O dot com'."""
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    rules = [([norm(x) for x in k.split()], v) for k, v in replacements.items()]
    out, i = [], 0
    while i < len(words):
        for phrase, show in rules:
            n = len(phrase)
            if [norm(w["word"]) for w in words[i:i + n]] == phrase:
                tail = re.sub(r"^.*?([^\w]*)$", r"\1", words[i + n - 1]["word"])  # keep trailing punctuation
                out.append({"word": show + tail, "start": words[i]["start"], "end": words[i + n - 1]["end"]})
                i += n
                break
        else:
            out.append(words[i])
            i += 1
    return out


# ── build ─────────────────────────────────────────────────────────────────────
def build(game_id: str, voice_mode: str, om: Path, brand: dict, games: dict, preview: bool = False) -> Path:
    promo_path = PROMOS / f"{game_id}.json"
    if not promo_path.exists():
        fail(f"No promo script for '{game_id}'. Available: {', '.join(p.stem for p in sorted(PROMOS.glob('*.json')))}")
    promo = json.loads(promo_path.read_text(encoding="utf-8-sig"))
    game = games.get(game_id, {})
    rcfg = brand["render"]

    if voice_mode == "auto":
        if os.environ.get("ELEVEN_API_KEY"):
            voice_mode = "elevenlabs"
        elif piper_python(om):
            voice_mode = "piper"
        else:
            voice_mode = "none"
    log(f"{promo['title']}: voice = {voice_mode}")

    composer = om / "remotion-composer"
    job = f"{game_id}-{int(time.time())}"
    public_rel = f"fedge-studio/{job}"
    public_dir = composer / "public" / "fedge-studio" / job
    public_dir.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="fedge-studio-"))

    # Gameplay clip (from capture_gameplay.js) plays behind the scenes; the FEDGE character opens the video.
    footage = STUDIO / "footage" / game_id / "gameplay.mp4"
    foot_len = 0.0
    if footage.exists():
        shutil.copyfile(footage, public_dir / "gameplay.mp4")
        foot_len = audio_seconds(footage)
        log(f"gameplay footage: {foot_len:.1f}s")
    else:
        log("no gameplay footage yet (run: node studio/capture_gameplay.js) — using plain backgrounds")
    scenes = [dict(s) for s in promo["scenes"] if s.get("type") != "gameplay" or foot_len]
    intro = brand.get("intro") or {}
    if intro.get("image") and promo.get("intro", True) and (STUDIO / intro["image"]).exists():
        shutil.copyfile(STUDIO / intro["image"], public_dir / "intro.png")
        scenes.insert(0, {"type": "intro", "say": intro.get("say", "")})
    overlay = (brand.get("footage") or {}).get("overlay", 0.68)
    foot_pos = 0.0

    cuts, captions, segs = [], [], []
    t = 0.0
    try:
        for i, sc in enumerate(scenes):
            say = sc.get("say", "").strip().replace("{title}", promo["title"])
            seg = work / f"s{i:02d}"
            words, spoken = [], 0.0
            if say and voice_mode != "none":
                try:
                    if voice_mode == "elevenlabs":
                        words = tts_elevenlabs(say, seg.with_suffix(".mp3"), brand)
                        src = seg.with_suffix(".mp3")
                    else:
                        words = tts_piper(say, seg.with_suffix(".wav"), brand, om)
                        src = seg.with_suffix(".wav")
                    spoken = audio_seconds(src)
                except Exception as exc:  # fall back to captions-only for this line
                    log(f"voice failed on scene {i + 1} ({exc}); using captions only")
                    words, spoken, src = [], 0.0, None
            else:
                src = None
            if not words and say:
                read = len(say.split()) / rcfg["reading_words_per_second"]
                words = words_evenly(say, 0.15, read)
                spoken = max(spoken, read + 0.15)
            dur = max(rcfg["min_scene_seconds"], spoken + rcfg["scene_padding_seconds"])
            words = merge_caption_words(words, brand.get("caption_replacements", {}))

            # Per-scene audio padded to the scene length, so everything stays in sync.
            padded = work / f"p{i:02d}.wav"
            if src:
                run([FFMPEG, "-y", "-loglevel", "error", "-i", str(src), "-af", f"apad=whole_dur={dur:.3f}",
                     "-t", f"{dur:.3f}", "-ar", "44100", "-ac", "1", str(padded)])
            else:
                run([FFMPEG, "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                     "-t", f"{dur:.3f}", str(padded)])
            segs.append(padded)

            for j, w in enumerate(words):
                captions.append({
                    # Trailing non-breaking space keeps words apart (the composer trims normal spaces).
                    "word": w["word"] + " ",
                    "startMs": int((t + w["start"]) * 1000),
                    "endMs": int((t + w["end"]) * 1000),
                    **({"pageBreakAfter": True} if j == len(words) - 1 else {}),
                })

            cut = {k: v for k, v in sc.items() if k != "say"}
            for k, v in list(cut.items()):
                if isinstance(v, str):
                    cut[k] = v.replace("{cta_url}", brand["cta_url"]).replace("{title}", promo["title"])
            cut.update({"id": f"{game_id}-{i + 1}", "source": "", "in_seconds": round(t, 3), "out_seconds": round(t + dur, 3)})
            # Where in the gameplay clip this scene starts (keeps moving forward, wraps before the end).
            span = max(0.0, foot_len - dur - 0.2)
            start = round(foot_pos % span, 2) if span > 0 else 0.0
            if cut["type"] == "intro":
                cut.pop("type")
                cut.update({"source": f"{public_rel}/intro.png", "animation": intro.get("animation", "zoom-in")})
            elif cut["type"] == "gameplay":
                cut.pop("type")
                cut.update({"source": f"{public_rel}/gameplay.mp4", "source_in_seconds": round(min(foot_len * 0.35, span), 2)})
            elif foot_len and "backgroundVideo" not in cut and "backgroundImage" not in cut:
                cut.update({"backgroundVideo": f"{public_rel}/gameplay.mp4", "backgroundVideoStart": start,
                            "backgroundOverlay": overlay})
            foot_pos += dur
            cuts.append(cut)
            t += dur

        total = t
        narration = public_dir / "narration.wav"
        listfile = work / "list.txt"
        listfile.write_text("".join(f"file '{p.as_posix()}'\n" for p in segs), encoding="utf-8")
        run([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(listfile), "-c", "copy", str(narration)])

        audio = {}
        if voice_mode != "none":
            audio["narration"] = {"src": f"{public_rel}/narration.wav", "volume": 1.0}
        # Music: the promo's own track, else any .mp3 you drop in studio/music/, else the FEDGE beat.
        track = None
        if promo.get("music"):
            track = Path(promo["music"]) if Path(promo["music"]).is_absolute() else MUSIC / Path(promo["music"]).name
        elif MUSIC.exists() and sorted(MUSIC.glob("*.mp3")):
            track = sorted(MUSIC.glob("*.mp3"))[0]
        elif brand.get("music_default"):
            track = STUDIO / brand["music_default"]
        if track:
            if Path(track).exists():
                shutil.copyfile(track, public_dir / "music.mp3")
                # Quiet bed under a voiceover; louder when the video is captions only.
                vol = rcfg["music_volume"] if "narration" in audio else rcfg.get("music_volume_no_voice", 0.45)
                audio["music"] = {"src": f"{public_rel}/music.mp3", "volume": vol,
                                  "loop": True, "fadeInSeconds": 0.5, "fadeOutSeconds": 1.5}

        # Top-left label: game title during the video, then the disclaimer on the final screen
        # (kept at the top so it never collides with the captions at the bottom).
        last_in = cuts[-1]["in_seconds"]
        label = {"type": "section_title", "text": brand["label"], "accentColor": brand["themeConfig"]["primaryColor"],
                 "position": "top-left"}
        overlays = [
            {**label, "in_seconds": 0.2, "out_seconds": last_in, "subtitle": promo["title"]},
            {**label, "in_seconds": last_in, "out_seconds": round(total, 3), "subtitle": brand["disclaimer"]},
        ]
        props = {"themeConfig": brand["themeConfig"], "cuts": cuts, "overlays": overlays,
                 "captions": captions, "audio": audio,
                 "fedge": {"game": game_id, "play": game.get("play", ""), "voice": voice_mode}}
        props_file = public_dir / "props.json"
        props_file.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

        RENDERS.mkdir(parents=True, exist_ok=True)
        out = RENDERS / f"{game_id}.mp4"
        npx = which("npx.cmd", "npx") if IS_WIN else which("npx")
        if not npx:
            fail("Node.js (npx) not found. Install Node.js 18+ from nodejs.org.")
        if not (composer / "node_modules").exists():
            log("installing OpenMontage renderer (one time)...")
            run([which("npm.cmd", "npm") or "npm", "install", "--no-audit", "--no-fund"], cwd=composer)
        size = ["--width", str(rcfg["width"]), "--height", str(rcfg["height"]), "--scale", str(rcfg["scale"])]
        browser = ["--browser-executable", os.environ["REMOTION_BROWSER_EXECUTABLE"]] if os.environ.get("REMOTION_BROWSER_EXECUTABLE") else []
        if preview:
            # One still per scene (70% through it, after the entrance animation) — fast way to check a script edit.
            pdir = RENDERS / f"{game_id}-preview"
            shutil.rmtree(pdir, ignore_errors=True)
            pdir.mkdir(parents=True)
            frames = ",".join(str(int((c["in_seconds"] + 0.7 * (c["out_seconds"] - c["in_seconds"])) * 30)) for c in cuts)
            log(f"rendering {len(cuts)} preview stills...")
            for n, fr in enumerate(frames.split(","), 1):
                run([npx, "remotion", "still", "src/index.tsx", "Explainer", str(pdir / f"scene{n}.png"),
                     "--props", str(props_file), "--frame", fr] + size + browser, cwd=composer, capture_output=True)
            return pdir
        tmp_out = RENDERS / f"{game_id}.rendering.mp4"  # renamed to <game>.mp4 only once it's complete
        tmp_out.unlink(missing_ok=True)
        cmd = [npx, "remotion", "render", "src/index.tsx", "Explainer", str(tmp_out), "--props", str(props_file),
               "--codec", "h264", "--crf", str(rcfg["crf"])] + size + browser + [
            # Gentler on home PCs: fewer frames at once, capped video memory, more patience.
            "--concurrency", str(rcfg.get("concurrency", 1)),
            "--offthreadvideo-cache-size-in-bytes", str(rcfg.get("video_cache_mb", 512) * 1024 * 1024),
            "--timeout", str(rcfg.get("timeout_ms", 120000))]
        log(f"rendering {total:.1f}s video with OpenMontage...")
        run(cmd, cwd=composer)
        os.replace(tmp_out, out)
        return out
    finally:
        shutil.rmtree(work, ignore_errors=True)
        if not os.environ.get("FEDGE_STUDIO_KEEP"):
            shutil.rmtree(public_dir, ignore_errors=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="Render FEDGE 2.O promo videos with OpenMontage.")
    ap.add_argument("game", nargs="?", help="game id from games.json, or 'all'")
    ap.add_argument("--voice", choices=["auto", "elevenlabs", "piper", "none"], default="auto")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--preview", action="store_true", help="one still image per scene instead of the video (fast)")
    ap.add_argument("--force", action="store_true", help="with 'all': re-render games that are already done")
    args = ap.parse_args()

    load_env()
    if args.preview and args.voice == "auto":
        args.voice = "none"  # previews don't need a voice — saves ElevenLabs credits
    brand = json.loads((STUDIO / "brand.json").read_text(encoding="utf-8-sig"))
    games = {g["id"]: g for g in json.loads((REPO / "games.json").read_text(encoding="utf-8-sig"))["live"]}
    if args.list or not args.game:
        for p in sorted(PROMOS.glob("*.json")):
            print(f"  {p.stem:12} {json.loads(p.read_text(encoding='utf-8-sig'))['title']}")
        return 0

    global FFMPEG, FFPROBE
    FFMPEG, FFPROBE = which("ffmpeg"), which("ffprobe")
    if not FFMPEG or not FFPROBE:
        fail("FFmpeg not found. Run studio/setup-studio.ps1 (it installs FFmpeg).")
    om = find_openmontage()

    RENDERS.mkdir(parents=True, exist_ok=True)
    if LOCK.exists() and time.time() - LOCK.stat().st_mtime < 1800 and pid_alive(LOCK.read_text().strip()):
        fail("Another video is already rendering. Try again in a few minutes.")
    LOCK.write_text(str(os.getpid()))
    try:
        ids = [p.stem for p in sorted(PROMOS.glob("*.json"))] if args.game == "all" else [args.game.lower()]
        outs = []
        failed = []
        for gid in ids:
            done = RENDERS / f"{gid}.mp4"
            src = [PROMOS / f"{gid}.json", STUDIO / "brand.json", STUDIO / "footage" / gid / "gameplay.mp4"]
            newest = max((p.stat().st_mtime for p in src if p.exists()), default=0)
            if len(ids) > 1 and not args.force and not args.preview and done.exists() and done.stat().st_mtime > newest:
                log(f"skip {gid}: already rendered (use --force to redo)")
                outs.append({"game": gid, "file": str(done), "mb": round(done.stat().st_size / 1_048_576, 1)})
                continue
            for attempt in (1, 2):  # one automatic retry if the render browser crashes
                try:
                    out = build(gid, args.voice, om, brand, games, preview=args.preview)
                    break
                except subprocess.CalledProcessError as exc:
                    log(f"{gid}: render failed (attempt {attempt}/2, exit {exc.returncode})")
                    out = None
            if out is None:
                failed.append(gid)
                continue
            if args.preview:
                log(f"preview stills: {out}")
                outs.append({"game": gid, "preview": str(out)})
                continue
            mb = out.stat().st_size / 1_048_576
            log(f"done: {out} ({mb:.1f} MB)")
            outs.append({"game": gid, "file": str(out), "mb": round(mb, 1)})
        if failed:
            log(f"finished {len(outs)}, failed: {', '.join(failed)} — run those again on their own")
            if not outs:
                fail(f"Render failed for {', '.join(failed)}. Close other apps and try again.")
        result({"ok": True, "videos": outs, **({"failed": failed} if failed else {})})
        return 0
    except subprocess.CalledProcessError as exc:
        fail(f"Render step failed: {' '.join(map(str, exc.cmd[:3]))}... (exit {exc.returncode})")
    finally:
        LOCK.unlink(missing_ok=True)


FFMPEG = FFPROBE = ""
if __name__ == "__main__":
    sys.exit(main())
