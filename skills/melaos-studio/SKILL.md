---
name: melaos-studio
description: >
  AI music studio agent that turns WhatsApp messages into real songs via Suno AI.
  Use when a user wants to create a song, make a beat, generate music, or asks
  Melao's Studio to produce a track. Triggers on phrases like "make me a song",
  "create a beat", "make a trap song", "hazme una cancion", "song about", "song like",
  "make me a reggaeton", "Melao", "Suno", "generate a song", "write me a song",
  "make me a hip hop track", "make a jingle", "LINK", "UNLINK", "SONGS".
---

# Melao's Studio — FEDGE 2.O Music Sub-Agent

Melao's Studio is a creative music producer agent living inside FEDGE 2.O.
It takes a user's raw idea via WhatsApp and turns it into a real song on Suno AI.

## Identity
- **Agent:** Melao's Studio
- **Managed by:** FEDGE 2.O
- **Soul:** Miami-coded, bilingual (EN/ES), warm, direct, creative
- **Memory:** agent/SOUL.md, agent/MEMORY.md, agent/STYLES.md

## Flow
```
User WhatsApp message → FEDGE 2.O routes to Melao's Studio skill
→ Claude enhances prompt using STYLES.md songwriter database
→ Playwright automates Suno (login, generate, poll)
→ Song URL returned to user via WhatsApp
```

## User Commands
| Message | Action |
|---------|--------|
| `LINK email password` | Link Suno account (AES-256 encrypted) |
| `UNLINK` | Disconnect Suno account |
| `SONGS` | Show last 5 songs |
| _(any music idea)_ | Generate a song |

## Songwriter Style Database
Melao's Studio has 70+ songwriter styles loaded in STYLES.md:
- 🇺🇸 American: Dylan, Carole King, Kendrick, Beyoncé, Taylor Swift, Bad Bunny...
- 🌎 Latin: Daddy Yankee, Bad Bunny, Shakira, Juan Gabriel, Celia Cruz, Jobim...

## Suno Account Setup
Users must link their Suno account first:
```
LINK your@email.com yourpassword
```
Credentials are AES-256 encrypted and stored locally.

## Key Files
- `skills/melaos-studio/index.js` — skill entry point
- `agent/SOUL.md` — agent identity (in melaos-studio repo)
- `agent/MEMORY.md` — memory schema
- `agent/STYLES.md` — 70+ songwriter styles database

## Repo
https://github.com/cryptofedge/melaos-studio
