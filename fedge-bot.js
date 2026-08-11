const { textToSpeech, saveTempAudio, cleanupTempAudio } = require('./elevenlabs');

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

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

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

function matchSkill(text) {
  const lower = text.toLowerCase();
  for (const skill of skills) {
    if (skill.triggers.some(t => lower.includes(t.toLowerCase()))) {
      return skill;
    }
  }
  return null;
}


const FEDGE_SOUL = fs.readFileSync('./SOUL.md', 'utf8');
const MELAO_SOUL = fs.existsSync('./skills/suno-ai/skill.md') ? fs.readFileSync('./skills/suno-ai/skill.md', 'utf8') : 'You are FEDGE 2.O in Melao Studio mode.';

async function generateVoice(text) {
  const mp3Path = "C:\\Users\\Fellito Rodriguez\\test_output.mp3";
  const safe = text.replace(/"/g, "'");
  execSync(`edge-tts --text "${safe}" --voice "en-US-ChristopherNeural" --write-media "${mp3Path}"`);
  return fs.readFileSync(mp3Path);
}

async function askFEDGE(userMessage, systemPrompt = FEDGE_SOUL) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });
    const data = await response.json();
    if (!data.content || !data.content[0]) {
      console.log("API error:", JSON.stringify(data));
      return "FEDGE 2.O is processing... try again in a moment.";
    }
    return data.content[0].text;
  } catch (err) {
    console.log("askFEDGE error:", err.message);
    return "FEDGE 2.O hit a snag. Try again!";
  }
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

      // Proactive Outreach: Richard Fashion
      const richardJid = "13476346499@s.whatsapp.net";
      console.log("🚀 Initializing contact with Richard Fashion...");
      const introMessage = await askFEDGE("Richard is our brother Melao's friend. Introduce yourself to him as FEDGE 2.O, mention you were built by Fellito, and that you're hyped to help him co-produce La Mesa del Reino. Keep it NYC, keep it Kingdom. 'Donde la fe se sienta a conversar con la vida.'", FEDGE_SOUL + '\n\n---\n## ACTIVE SKILL: LA-MESA-DEL-REINO\n' + fs.readFileSync('./skills/la-mesa-del-reino/SKILL.md', 'utf8'));
      await sendVoiceReply(sock, richardJid, introMessage);
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
    try {
      const lowerText = text.toLowerCase();
    const isStudioTrigger = lowerText.includes("melao") || lowerText.includes("studio") || lowerText.includes("!studio") || lowerText.includes("suno");
    const matched = matchSkill(text);
    const systemPrompt = isStudioTrigger 
      ? MELAO_SOUL 
      : matched 
        ? FEDGE_SOUL + '\n\n---\n## ACTIVE SKILL: ' + matched.name.toUpperCase() + '\n' + matched.content
        : FEDGE_SOUL;
    if (matched) console.log('🎯 Skill matched: ' + matched.name);
      const reply = await askFEDGE(text, systemPrompt);
      console.log(`FEDGE: ${reply}`);
      await sendVoiceReply(sock, from, reply);
    } catch (err) {
      console.log("Error:", err.message);
    }
  });
  sock.ev.on("creds.update", saveCreds);
}
startBot();
