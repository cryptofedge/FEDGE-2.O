/**
 * melaos-studio.skill.js
 * Full skill implementation for Melao's Studio — FEDGE 2.O
 * Managed by: Fellito Rodriguez | @cryptofedge
 * Artist: Milciades Holguin (Melao) | Melao'S Studios / Song-Writer & Music-Producer
 * Repo: https://github.com/cryptofedge/melaos-studio
 *
 * Flow: WhatsApp msg → parse intent → Claude generates Suno prompt → reply with link
 */

'use strict';

const https = require('https');

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

// ─── Claude Prompt Generator ──────────────────────────────────────────────────
async function generateSunoPrompt(userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildFallbackPrompt(userMessage);

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: 'You are Melao Studio AI — a music production assistant for FEDGE 2.O. You generate precise Suno AI prompts. Respond ONLY with raw JSON, no markdown, no backticks.',
      messages: [{
        role: 'user',
        content: `Generate a Suno AI music prompt from this request: "${userMessage}"

Return only this JSON:
{
  "prompt": "2-sentence Suno prompt with: genre, mood, instruments, vocal style, language, theme. Max 220 chars.",
  "title": "catchy song title (3-5 words)",
  "genre": "primary genre (1-2 words)",
  "language": "English | Spanish | Bilingual"
}`
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const text = (response.content?.[0]?.text || '').trim();
          const parsed = JSON.parse(text);
          resolve(parsed);
        } catch {
          resolve(buildFallbackPrompt(userMessage));
        }
      });
    });
    req.on('error', () => resolve(buildFallbackPrompt(userMessage)));
    req.write(body);
    req.end();
  });
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
    const { message, reply } = ctx;

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
        "🤖 Powered by: FEDGE 2.O + Claude AI + Suno\n" +
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
    await reply("🎵 *Melao'S Studios* is cooking...\n\n_Claude is crafting your Suno prompt..._ ⏳");

    try {
      const result = await generateSunoPrompt(message);
      const sunoUrl = buildSunoUrl(result.prompt);

      await reply(
        "🎵 *Melao'S Studios*\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        `🎤 *"${result.title}"*\n` +
        `🎸 Genre: ${result.genre}\n` +
        `🌐 Language: ${result.language}\n\n` +
        "📝 *Suno Prompt:*\n" +
        `_${result.prompt}_\n\n` +
        "🔗 *Create your song now:*\n" +
        `${sunoUrl}\n\n` +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "_Tap the link → your prompt is pre-filled → hit Generate_ 🚀\n" +
        "_Powered by FEDGE 2.O × Suno AI_\n" +
        "_By Milciades Holguin (Melao) 🎤_"
      );
    } catch (err) {
      await reply(
        "🎵 *Melao'S Studios*\n\n" +
        "⚠️ Couldn't generate your track right now.\n" +
        "Try again or visit: https://suno.com\n\n" +
        `_Error: ${err.message}_`
      );
    }
  }
};
