const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require("baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { Boom } = require("@hapi/boom");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.windows("Chrome"),
    connectTimeoutMs: 60000,
  });

  sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      console.log("Scan QR:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log("Closed. Code:", code, "Reconnect:", shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === "open") {
      console.log("WhatsApp connected!");

      const mp3Path = "C:\\Users\\Fellito Rodriguez\\test_output.mp3";

      if (!fs.existsSync(mp3Path)) {
        console.log("MP3 not found at:", mp3Path);
        return;
      }

      const audio = fs.readFileSync(mp3Path);
      const jid = "19177278063@s.whatsapp.net";

      await sock.sendMessage(jid, {
        audio: audio,
        mimetype: "audio/mpeg",
        ptt: true
      });

      console.log("Audio sent!");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
