const { textToSpeech, saveTempAudio, cleanupTempAudio } = require('./elevenlabs');
const { askGemini } = require('./services/gemini');
const { generateSong } = require('./services/lyria');

async function sendVoiceReply(sock, jid, text) {
  await sock.sendMessage(jid, { text });
  let tmpPath;
  try {
    const buf = await textToSpeech(text);
    const fs = require('fs'), os = require('os'), path = require('path');
    tmpPath = path.join(os.tmpdir(), `fedge_voice_${Date.now()}.mp3`);
    fs.writeFileSync(tmpPath, buf);
    await sock.sendMessage(jid, { audio: { url: tmpPath }, mimetype: 'audio/mpeg', ptt: true });
    console.log('[FEDGE VOICE] Voice note sent');
  } catch (e) { console.error('[FEDGE VOICE] TTS failed:', e.message); }
  finally { if (tmpPath) try { require('fs').unlinkSync(tmpPath); } catch(_) {} }
}

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require("baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { execSync } = require("child_process");
const { Boom } = require("@hapi/boom");

const path = require('path');
const skills = [];
const skillsDir = './skills';
for (const folder of fs.readdirSync(skillsDir)) {
  try {
    const metaPath = fs.existsSync(path.join(skillsDir, folder, 'skill.json'))
      ? path.join(skillsDir, folder, 'skill.json')
      : path.join(skillsDir, folder, '_meta.json');
    const contentPath = fs.existsSync(path.join(skillsDir, folder, 'SKILL.md')) 
      ? path.join(skillsDir, folder, 'SKILL.md') 
      : path.join(skillsDir, folder, 'skill.md');
    if (fs.existsSync(contentPath)) {
      const content = fs.readFileSync(contentPath, 'utf8');
      let name = folder;
      let triggers = [];
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          name = meta.name || folder;
          triggers = meta.triggers || [];
        } catch(e) {}
      }
      skills.push({ name, triggers, content });
    }
  } catch (e) {}
}
console.log('✅ Loaded ' + skills.length + ' skills into FEDGE 2.O brain');

// ── Executable skills: folders whose index.js exports a run() function ────────
// These run real code instead of just being pasted into Gemini's system prompt.
const execSkills = [];
for (const folder of fs.readdirSync(skillsDir)) {
  const entry = path.join(skillsDir, folder, 'index.js');
  if (!fs.existsSync(entry)) continue;
  try {
    const mod = require(path.resolve(entry));
    if (typeof mod.run !== 'function') continue;
    const manifest = mod.manifest || {};
    execSkills.push({
      id: manifest.id || folder,
      name: manifest.name || folder,
      triggers: manifest.triggers || [],
      run: mod.run
    });
  } catch (e) {
    console.error('⚠️  Executable skill "' + folder + '" failed to load: ' + e.message);
  }
}
console.log('⚡ Loaded ' + execSkills.length + ' executable skill(s): ' + execSkills.map(s => s.id).join(', '));

function matchSkill(text) {
  const lower = text.toLowerCase();
  for (const skill of skills) {
    if (skill.triggers.some(t => lower.includes(t.toLowerCase()))) {
      return skill;
    }
  }
  return null;
}

// ALL-CAPS triggers (LINK, UNLINK, SONGS) are commands and must start the message,
// otherwise "check this link" or "I love those songs" would fire the skill.
function triggerHits(trigger, lowerText) {
  const t = trigger.trim();
  if (t === t.toUpperCase() && /^[A-Z ]+$/.test(t)) {
    return lowerText.startsWith(t.toLowerCase());
  }
  return lowerText.includes(t.toLowerCase());
}

function matchExecutableSkill(text) {
  const lower = text.toLowerCase().trim();
  for (const skill of execSkills) {
    if (skill.triggers.some(t => triggerHits(t, lower))) return skill;
  }
  return null;
}


const FEDGE_SOUL = fs.readFileSync('./SOUL.md', 'utf8');
const FEDGE_MEMORY = fs.existsSync('./MEMORY.md') ? fs.readFileSync('./MEMORY.md', 'utf8') : '';
const FEDGE_USER = fs.existsSync('./USER.md') ? fs.readFileSync('./USER.md', 'utf8') : '';

const MASTER_PROMPT = `${FEDGE_SOUL}

---
## LONG-TERM MEMORY
${FEDGE_MEMORY}

---
## USER CONTEXT (FELLITO)
${FEDGE_USER}
`;

const MELAO_SOUL = fs.existsSync('./skills/suno-ai/skill.md') ? fs.readFileSync('./skills/suno-ai/skill.md', 'utf8') : 'You are FEDGE 2.O in Melao Studio mode.';

async function generateVoice(text) {
  const mp3Path = "C:\\Users\\Fellito Rodriguez\\test_output.mp3";
  const safe = text.replace(/"/g, "'");
  execSync(`edge-tts --text "${safe}" --voice "en-US-ChristopherNeural" --write-media "${mp3Path}"`);
  return fs.readFileSync(mp3Path);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.windows("Chrome"),
    connectTimeoutMs: 60000,
  });
  sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
    if (qr) { console.log("Scan QR:"); qrcode.generate(qr, { small: true }); }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) startBot();
    }
    if (connection === "open") {
      console.log("✅ FEDGE 2.O is LIVE!");
      // No proactive outreach on connect. This previously messaged a hardcoded
      // number on every connection — including each auto-reconnect above.
    }
  });
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;
    console.log(`[${from}]: ${text}`);

    // Executable skills run real code and own the whole reply — check before Gemini.
    const execSkill = matchExecutableSkill(text);
    if (execSkill) {
      console.log('⚡ Executing skill: ' + execSkill.id);
      try {
        await execSkill.run({
          waId: from,
          message: text,
          ai: askGemini,
          music: generateSong,
          reply: async (t) => { await sock.sendMessage(from, { text: t }); },
          sendAudio: async (buffer, meta = {}) => {
            await sock.sendMessage(from, {
              audio: buffer,
              mimetype: meta.mimetype || 'audio/mpeg',
              fileName: (meta.title || 'track').replace(/[^\w\s-]/g, '').trim() + '.mp3',
              ptt: false
            });
          }
        });
      } catch (err) {
        console.error(`[SKILL ${execSkill.id}] ${err.message}`);
        await sock.sendMessage(from, { text: `⚠️ ${execSkill.name} hit an error: ${err.message}` });
      }
      return;
    }

    try {
      const lowerText = text.toLowerCase();
    const isStudioTrigger = lowerText.includes("melao") || lowerText.includes("studio") || lowerText.includes("!studio") || lowerText.includes("suno");
    const matched = matchSkill(text);
    const systemPrompt = isStudioTrigger 
      ? MELAO_SOUL 
      : matched 
        ? MASTER_PROMPT + '\n\n---\n## ACTIVE SKILL: ' + matched.name.toUpperCase() + '\n' + matched.content
        : MASTER_PROMPT;
    if (matched) console.log('🎯 Skill matched: ' + matched.name);

      // Use Gemini Pro for all reasoning (1.5 Pro)
      const reply = await askGemini(text, systemPrompt);

      console.log(`FEDGE (Gemini): ${reply}`);
      await sendVoiceReply(sock, from, reply);
    } catch (err) {
      console.log("Error:", err.message);
    }
  });
  sock.ev.on("creds.update", saveCreds);
}
startBot();
