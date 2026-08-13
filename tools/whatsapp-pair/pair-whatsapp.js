// Link a WhatsApp account to OpenClaw using a phone-number pairing code
// instead of a QR. Writes Baileys multi-file auth state straight into the
// folder the @openclaw/whatsapp plugin reads.
//
// usage: node pair-whatsapp.js <digits-only-phone> [creds-dir]

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('baileys');

const phone = (process.argv[2] || '').replace(/[^0-9]/g, '');
const credsDir = process.argv[3] || 'C:\\Users\\Fellito Rodriguez\\.openclaw\\credentials\\whatsapp\\default';

if (!phone) {
  console.error('need a phone number in international format, digits only (e.g. 19177278063)');
  process.exit(1);
}

let attempt = 0;

async function main() {
  attempt += 1;
  const { state, saveCreds } = await useMultiFileAuthState(credsDir);
  const { version } = await fetchLatestBaileysVersion();
  console.log(`[pair] creds dir: ${credsDir}`);
  console.log(`[pair] attempt ${attempt} — WA version: ${version.join('.')}  registered: ${!!state.creds.registered}`);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'), // pairing-code path requires a desktop browser fingerprint
    connectTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) console.log('[pair] (QR offered and ignored — waiting on pairing code)');
    if (connection === 'open') {
      console.log('[pair] PAIRED — session written to disk. You can close this.');
      setTimeout(() => process.exit(0), 3000);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const name = Object.keys(DisconnectReason).find((k) => DisconnectReason[k] === code) || 'unknown';
      console.log(`[pair] connection closed (status ${code}: ${name})`);
      if (code === DisconnectReason.loggedOut) {
        console.log('[pair] logged out — the pairing was rejected. Start over with a fresh code.');
        process.exit(1);
      }
      if (attempt >= 6) {
        console.log('[pair] giving up after 6 attempts');
        process.exit(1);
      }
      // restartRequired (515) is the normal post-pairing drop: reconnect to finish.
      console.log('[pair] reconnecting to complete the handshake...');
      setTimeout(() => main().catch((e) => { console.error('[pair] failed:', e.message); process.exit(1); }), 2000);
    }
  });

  if (!state.creds.registered) {
    // Baileys needs the socket to settle before the server will issue a code.
    await new Promise((r) => setTimeout(r, 4000));
    const code = await sock.requestPairingCode(phone);
    console.log(`[pair] ================================`);
    console.log(`[pair] PAIRING CODE: ${code}`);
    console.log(`[pair] ================================`);
    console.log('[pair] Phone: WhatsApp > Linked devices > Link a device > Link with phone number instead');
  }
}

main().catch((e) => {
  console.error('[pair] failed:', e && e.message ? e.message : e);
  process.exit(1);
});
