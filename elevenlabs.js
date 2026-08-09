const fs = require('fs');
const path = require('path');
const os = require('os');

// Resolved lazily: fedge-bot.js requires this module before it calls dotenv.config().
const voiceId = () => process.env.ELEVEN_VOICE_ID || 'OhcAdN25ThAFnC904VSS';

async function textToSpeech(text) {
  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) throw new Error('ELEVEN_API_KEY is not set — add it to .env');

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId()}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function saveTempAudio(buffer) {
  const tmpPath = path.join(os.tmpdir(), `fedge_voice_${Date.now()}.mp3`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

function cleanupTempAudio(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) {}
}

module.exports = { textToSpeech, saveTempAudio, cleanupTempAudio };
