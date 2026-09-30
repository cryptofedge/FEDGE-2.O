# FEDGE 2.O Studio — powered by OpenMontage

Makes vertical 1080×1920 promo videos (TikTok, Reels, Shorts) for the 6 live FEDGE games, in FEDGE colors, with voiceover, captions and an optional music bed.

[OpenMontage](https://github.com/calesthio/OpenMontage) does the video work. It's installed **next to** FEDGE (in your home folder), not copied into this repo. FEDGE only sends it a script and gets the MP4 back. That matters because OpenMontage is AGPL-3.0: copying its code into FEDGE-2.O would require FEDGE-2.O to be released under AGPL too.

## One-time setup (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\FEDGE-2.O-push\studio\setup-studio.ps1"
```

This installs Git, Node.js, Python and FFmpeg if they're missing, downloads OpenMontage to `%USERPROFILE%\OpenMontage`, installs its renderer and the free Piper voice, adds `OPENMONTAGE_DIR` to `.env`, records gameplay clips of all 6 games, and renders a test TradeStreet promo.

## Make videos

```powershell
cd "$HOME\FEDGE-2.O-push"
python studio\render_promo.py tradestreet     # one game
python studio\render_promo.py all             # all 6
python studio\render_promo.py --list          # game ids
python studio\render_promo.py credit --voice none   # captions only, no voiceover
python studio\render_promo.py credit --preview      # quick check: one picture per scene
```

Videos land in `studio\renders\<game>.mp4`. Each takes about 2–5 minutes.

**Voice:** it uses FEDGE's ElevenLabs voice when `ELEVEN_API_KEY` is in `.env` (with `ELEVEN_VOICE_ID` if you set one). Otherwise it falls back to the free Piper voice, and if that isn't installed either, captions only.

**Music:** every promo gets FEDGE's own beat (`studio\assets\fedge-beat.mp3`, an original track made for FEDGE, so there are no licensing issues). To use your own, drop an `.mp3` into `studio\music\` and every promo will use it. You can also give one promo its own track by adding `"music": "yourtrack.mp3"` to its JSON.

**Opening:** every promo starts on the FEDGE character (`studio\assets\intro.png`) with "FEDGE 2.O presents...". To turn it off for one promo, add `"intro": false` to its JSON.

**Gameplay:** real footage of each game plays behind the text, and each promo has one full-screen gameplay moment (`"type": "gameplay"`). To record fresh clips from the live games (for example after a game update):

```powershell
node studio\capture_gameplay.js            # all 6
node studio\capture_gameplay.js worldstage # one game
```

Clips are saved to `studio\footage\<game>\gameplay.mp4`. The recorder gets past the beta password by itself and taps through the start screens. If a game has no clip, its promo just uses the plain FEDGE background.

## From WhatsApp

1. In `.env`, set `FEDGE_ADMINS` to the WhatsApp numbers allowed to make videos, digits only, separated by commas (for example `FEDGE_ADMINS=19175551234`). If a number is refused, the bot window prints the exact ID to add.
2. Restart the bot (`npm start`).
3. Text the bot:
   - `VIDEO` lists the games.
   - `VIDEO tradestreet` renders that promo and sends the MP4 back in the chat.

The PC has to stay on while it renders, and only one video renders at a time.

## Edit a promo

Each game has a script in `studio\promos\<game>.json`. Every scene is one screen:

```json
{ "type": "stat_card", "stat": "35%", "subtitle": "of your FICO score is payment history",
  "say": "Thirty five percent of your FICO score is one thing. Paying on time." }
```

- `say` is the voiceover. The screen stays up as long as the line takes to say.
- Scene types you can use: `gameplay` (full-screen game footage), `text_card`, `hero_title`, `stat_card`, `callout`, `comparison`. Skip `kpi_grid` (breaks in vertical video), `progress_bar` (ignores FEDGE colors) and charts (too small to read on a phone). The full list is in `OpenMontage\remotion-composer\SCENE_TYPES.md`.
- Keep `hero_title` to one or two short words, and `comparison` values to about 5 characters, so nothing gets cut off on a phone screen.
- `{cta_url}` becomes `fedge2o.com`.
- Colors, voice and size are set in `studio\brand.json`.

## Bigger productions

For trailers with AI-generated footage, real stock footage or lesson explainers, open the OpenMontage folder in Claude Code and use the prompts in [`PROMPTS.md`](PROMPTS.md). Those go through OpenMontage's full agent pipeline: research, script, your approval, AI assets and rendering.
