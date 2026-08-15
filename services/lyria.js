/**
 * Lyria — Google's music generation model, on the same GEMINI_API_KEY.
 *
 * Returns real MP3 audio, not a link. Two models:
 *   lyria-3-clip-preview  ~30s clip   (fast)
 *   lyria-3-pro-preview   ~3min song  (~30s to generate)
 *
 * The response has two parts: a text part holding timestamped lyrics,
 * and an inlineData part holding audio/mpeg as base64.
 */

'use strict';

require('dotenv').config();
const https = require('https');

const CLIP_MODEL = 'lyria-3-clip-preview';
const PRO_MODEL = 'lyria-3-pro-preview';
const TIMEOUT_MS = 180000;

function callLyria(model, prompt) {
  return new Promise((resolve, reject) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return reject(new Error('GEMINI_API_KEY not set'));

    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Lyria HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        try {
          const parts = JSON.parse(data).candidates?.[0]?.content?.parts || [];
          const audioPart = parts.find(p => p.inlineData?.data);
          if (!audioPart) return reject(new Error('Lyria returned no audio'));
          resolve({
            audio: Buffer.from(audioPart.inlineData.data, 'base64'),
            mimetype: audioPart.inlineData.mimeType || 'audio/mpeg',
            lyrics: (parts.find(p => p.text)?.text || '').trim(),
            model
          });
        } catch (e) {
          reject(new Error('Lyria parse failed: ' + e.message));
        }
      });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`Lyria timed out after ${TIMEOUT_MS / 1000}s`));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * @param {string} prompt  - musical description (genre, mood, instruments, vocals)
 * @param {object} [opts]
 * @param {boolean} [opts.full=true]  - true for a ~3min song, false for a ~30s clip
 * @param {number}  [opts.attempts=2] - retries; Lyria occasionally returns lyrics with no audio
 */
async function generateSong(prompt, opts = {}) {
  const model = opts.full === false ? CLIP_MODEL : PRO_MODEL;
  const attempts = opts.attempts || 2;

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await callLyria(model, prompt);
    } catch (err) {
      lastErr = err;
      console.error(`[lyria] attempt ${i}/${attempts} failed: ${err.message}`);
    }
  }
  throw lastErr;
}

// Lyria returns lyrics with timestamp prefixes ("[0.0:2.5]", "[0.0:]", "[:]") and
// section codes on their own line ("[[C2]]"). Strip the timestamps; turn section
// codes into blank lines so verses stay visually separated.
function cleanLyrics(lyrics) {
  return String(lyrics || '')
    .split('\n')
    .map(l => l.replace(/^\s*\[[\d.]*:[\d.]*\]\s*/, '').trim())
    .map(l => (/^\[\[[^\]]*\]\]$/.test(l) ? '' : l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { generateSong, cleanLyrics, CLIP_MODEL, PRO_MODEL };
