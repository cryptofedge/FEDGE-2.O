/**
 * melaos-studio.skill.js
 * Full skill implementation for Melao's Studio — FEDGE 2.O
 * Managed by: Fellito Rodriguez | @cryptofedge
 * Artist: Milciades Holguin (Melao) | Melao'S Studios / Song-Writer & Music-Producer
 * Repo: https://github.com/cryptofedge/melaos-studio
 *
 * Flow: WhatsApp msg → parse intent → Gemini writes the music prompt
 *       → Lyria generates real MP3 audio → sent back as a WhatsApp track
 *       (falls back to a pre-filled Suno link if Lyria is unavailable)
 */

'use strict';

const { cleanLyrics } = require('../services/lyria');

// ─── Genre Intelligence ────────────────────────────────────────────────────────
const GENRE_MAP = {
  'trap':        'trap, 808 bass, hi-hats, dark energy',
  'reggaeton':   'reggaeton, dembow rhythm, perreo, Latin heat',
  'hip hop':     'hip hop, boom bap, rap, lyrical flow',
  'hip-hop':     'hip hop, boom bap, rap, lyrical flow',
  'drill':       'Brooklyn drill, dark trap, sliding 808s',
  'afrobeat':    'afrobeats, dancehall fusion, groovy',
  'bachata':     'bachata, romantic guitar, Dominican rhythm',
  'salsa':       'salsa, tropical brass, energetic Latin',
  'pop':         'pop, catchy hook, modern production, upbeat',
  'rnb':         'R&B, smooth vocals, neo-soul, emotional',
  'r&b':         'R&B, smooth vocals, neo-soul, emotional',
  'jazz':        'jazz, live instruments, sophisticated, smoky',
  'gospel':      'gospel, choir, powerful, inspirational',
  'cumbia':      'cumbia, Colombian folk, accordion, festive',
  'merengue':    'merengue, fast tempo, brass, Caribbean',
  'corrido':     'corrido tumbado, narco corrido, guitar, bass',
  'dembow':      'dembow, reggaeton urbano, hard-hitting',
  'lo-fi':       'lo-fi hip hop, chill, dusty samples, relaxed',
  'dancehall':   'dancehall, Caribbean, riddim, patois vibes',
  'latin':       'Latin urban, bilingual, Spanish and English',
};

// ─── Gemini Prompt Generator ──────────────────────────────────────────────────
// `ai` is injected by the bot (services/gemini.js askGemini). No Anthropic path.
async function generateSunoPrompt(userMessage, ai) {
  if (typeof ai !== 'function') return buildFallbackPrompt(userMessage);

  const system =
    'You are Melao Studio AI — a music production assistant for FEDGE 2.O. ' +
    'You generate precise Suno AI prompts. Respond ONLY with raw JSON. ' +
    'No markdown, no backticks, no commentary, no lyrics.';

  const ask = `Generate a Suno AI music prompt from this request: "${userMessage}"

Return only this JSON:
{
  "prompt": "2-sentence Suno prompt with: genre, mood, instruments, vocal style, language, theme. Max 220 chars.",
  "title": "catchy song title (3-5 words)",
  "genre": "primary genre (1-2 words)",
  "language": "English | Spanish | Bilingual"
}`;

  try {
    const raw = await ai(ask, system);
    return parseJsonReply(raw) || buildFallbackPrompt(userMessage);
  } catch {
    return buildFallbackPrompt(userMessage);
  }
}

// Gemini often wraps JSON in ```json fences despite being told not to.
function parseJsonReply(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const o = JSON.parse(cleaned.slice(start, end + 1));
    if (!o.prompt) return null;
    return {
      prompt: String(o.prompt),
      title: o.title || 'FEDGE Track',
      genre: o.genre || 'urban',
      language: o.language || 'English'
    };
  } catch {
    return null;
  }
}

// ─── Fallback Prompt Builder ──────────────────────────────────────────────────
function buildFallbackPrompt(message) {
  const lower = message.toLowerCase();
  let genre = 'hip hop, trap beats, modern urban';

  for (const [key, val] of Object.entries(GENRE_MAP)) {
    if (lower.includes(key)) { genre = val; break; }
  }

  const aboutMatch = message.match(/about (.+)/i);
  const theme = aboutMatch ? aboutMatch[1].slice(0, 60) : 'hustle, success, generational wealth';

  const isSpanish = /hazme|cancion|música|reggaeton|latin|español/i.test(message);
  const lang = isSpanish ? 'Spanish and English bilingual vocals' : 'powerful male vocals';

  return {
    prompt: `${genre}, ${lang}, theme: ${theme}, energetic production, radio-ready quality`,
    title: 'FEDGE Track',
    genre: genre.split(',')[0].trim(),
    language: isSpanish ? 'Bilingual' : 'English'
  };
}

// ─── Build Suno Deep Link ─────────────────────────────────────────────────────
function buildSunoUrl(prompt) {
  return `https://suno.com/create?prompt=${encodeURIComponent(prompt)}`;
}

// ─── Command Parser ───────────────────────────────────────────────────────────
function parseCommand(msg) {
  const u = msg.toUpperCase().trim();
  if (u === 'SONGS' || u.startsWith('SONGS ')) return 'SONGS';
  if (u.startsWith('LINK '))                     return 'LINK';
  if (u === 'UNLINK')                             return 'UNLINK';
  if (u.includes('MELAO') && u.includes('STATUS')) return 'STATUS';
  return null;
}

// ─── Main Run ─────────────────────────────────────────────────────────────────
module.exports = {
  run: async (ctx) => {
    const { message, reply, ai, music, sendAudio } = ctx;

    const cmd = parseCommand(message);

    if (cmd === 'SONGS') {
      await reply(
        "🎵 *Melao'S Studios — Song Library*\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "Browse songs created through Melao's Studio:\n" +
        "🔗 https://suno.com/library\n\n" +
        "_All tracks are saved to your Suno account automatically._\n" +
        "_By Milciades Holguin (Melao) 🎤_"
      );
      return;
    }

    if (cmd === 'STATUS') {
      await reply(
        "🎵 *Melao'S Studios*\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "✅ Status: Online & Ready\n" +
        "🤖 Powered by: FEDGE 2.O + Gemini Pro + Suno\n" +
        "🎤 Artist: Milciades Holguin (Melao)\n" +
        "🎸 Role: Song-Writer & Music-Producer\n" +
        "📦 Repo: github.com/cryptofedge/melaos-studio\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "Send any music request to start creating! 🎶"
      );
      return;
    }

    if (cmd === 'LINK') {
      const topic = message.replace(/^LINK /i, '').trim();
      await reply(
        "🔗 *Melao'S Studios — Suno Link*\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🔗 https://suno.com/create\n" +
        `📌 Topic: ${topic || 'Open'}`
      );
      return;
    }

    if (cmd === 'UNLINK') {
      await reply("✅ *Melao'S Studios* — Session cleared.\n_Send a new music request anytime!_ 🎵");
      return;
    }

    // ── Music Generation ──
    // "clip"/"short"/"30 sec" asks for the fast 30s version instead of a full track.
    const wantsClip = /\b(clip|short|30 ?sec|corto)\b/i.test(message);

    await reply("🎵 *Melao'S Studios* is cooking...\n\n_Writing the track..._ ⏳");

    const result = await generateSunoPrompt(message, ai);

    // Try to produce real audio first.
    if (typeof music === 'function') {
      try {
        await reply(
          `🎼 *"${result.title}"* — ${result.genre}\n` +
          `_Recording${wantsClip ? ' a 30s clip' : ' the full track'}, give me a minute..._ 🎧`
        );

        const song = await music(result.prompt, { full: !wantsClip });

        await sendAudio(song.audio, { title: result.title, mimetype: song.mimetype });

        const lyrics = cleanLyrics(song.lyrics);
        await reply(
          "🎵 *Melao'S Studios*\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          `🎤 *"${result.title}"*\n` +
          `🎸 Genre: ${result.genre}\n` +
          `🌐 Language: ${result.language}\n` +
          (lyrics ? `\n📝 *Lyrics:*\n${lyrics}\n` : '') +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "_Powered by FEDGE 2.O × Lyria_\n" +
          "_By Milciades Holguin (Melao) 🎤_"
        );
        return;
      } catch (err) {
        console.error('[melaos-studio] Lyria failed: ' + err.message);
        // fall through to the Suno link below
      }
    }

    // Fallback: hand back a pre-filled Suno link.
    await reply(
      "🎵 *Melao'S Studios*\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      `🎤 *"${result.title}"*\n` +
      `🎸 Genre: ${result.genre}\n` +
      `🌐 Language: ${result.language}\n\n` +
      "📝 *Suno Prompt:*\n" +
      `_${result.prompt}_\n\n` +
      "🔗 *Create your song now:*\n" +
      `${buildSunoUrl(result.prompt)}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "_Tap the link → your prompt is pre-filled → hit Generate_ 🚀\n" +
      "_By Milciades Holguin (Melao) 🎤_"
    );
  }
};
