---
name: melaos-studio
description: >
  AI music studio agent that turns WhatsApp messages into real songs. Generates
  actual MP3 audio via Google Lyria and sends it back as a WhatsApp track.
  Use when a user wants to create a song, make a beat, generate music, or asks
  Melao's Studio to produce a track. Triggers on phrases like "make me a song",
  "create a beat", "make a trap song", "hazme una cancion", "song about", "song like",
  "make me a reggaeton", "Melao", "generate a song", "write me a song",
  "make me a hip hop track", "make a jingle", "SONGS".
---

# Melao's Studio — FEDGE 2.O Music Sub-Agent

Melao's Studio is a creative music producer agent living inside FEDGE 2.O.
It takes a user's raw idea via WhatsApp and returns a finished MP3.

## Identity
- **Agent:** Melao's Studio
- **Managed by:** FEDGE 2.O
- **Artist:** Milciades Holguin (Melao) — Song-Writer & Music-Producer
- **Soul:** Miami-coded, bilingual (EN/ES), warm, direct, creative

## Flow
```
User WhatsApp message
→ fedge-bot.js matches a trigger and calls the skill's run()
→ Gemini writes a structured music prompt (genre, mood, instruments, vocals)
→ Lyria generates real audio + lyrics
→ MP3 sent back to the user as a WhatsApp audio message
```

This is an **executable** skill: `index.js` exports `run()`, so the bot runs its
code instead of pasting markdown into the model's prompt. Skills without a
`run()` export are still loaded as prompt context only.

## User Commands
| Message | Action |
|---------|--------|
| _(any music idea)_ | Generate a full ~3 min track |
| _(idea) + "clip" / "corto"_ | Generate a ~30s clip instead |
| `SONGS` | Link to the Suno library (legacy) |
| `melao status` | Show studio status |

No account linking is required. The old `LINK email password` flow is obsolete —
Lyria runs on the FEDGE `GEMINI_API_KEY`, so users never send credentials.

## Music Generation
Handled by `services/lyria.js`:

| Model | Output | Time |
|-------|--------|------|
| `lyria-3-pro-preview` | ~3 min song, ~4.3 MB | 31–46s |
| `lyria-3-clip-preview` | ~30s clip, ~744 KB | faster |

Both return two parts: timestamped lyrics as text, and `audio/mpeg` as base64
`inlineData`. `cleanLyrics()` strips the timestamps for display.

If Lyria fails, the skill falls back to replying with a pre-filled
`suno.com/create` link so the user still gets something actionable.

## Skill Context
The bot injects these into `run(ctx)`:
- `ctx.message` — raw user text
- `ctx.waId` — sender JID
- `ctx.reply(text)` — send a text message
- `ctx.sendAudio(buffer, { title, mimetype })` — send an audio track
- `ctx.ai(prompt, systemInstruction)` — Gemini
- `ctx.music(prompt, { full })` — Lyria

## Key Files
- `skills/melaos-studio/index.js` — skill entry point + manifest/triggers
- `skills/melaos-studio.skill.js` — implementation
- `services/lyria.js` — music generation
- `services/gemini.js` — text generation

## Repo
https://github.com/cryptofedge/melaos-studio

> Note: that repo still contains `src/suno/client.ts`, a Playwright automation
> for driving suno.com. It is no longer needed — Lyria replaced it.
