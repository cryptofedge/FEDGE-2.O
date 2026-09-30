#!/usr/bin/env node
/**
 * FEDGE 2.O Studio — record short gameplay clips of each live game for the promos.
 *
 *   node studio/capture_gameplay.js              # all 6 games (from their live links)
 *   node studio/capture_gameplay.js lockin       # one game
 *
 * Opens each game in a phone-sized browser, gets past the beta password lock,
 * taps through the start screens, and records ~12 seconds. Clips are saved as
 * studio/footage/<game>/gameplay.mp4 and render_promo.py puts them behind the promo text.
 * Needs FFmpeg (installed by setup-studio.ps1) and FEDGE's Playwright (npm install).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const STUDIO = __dirname;
const REPO = path.dirname(STUDIO);
const FOOTAGE = path.join(STUDIO, 'footage');
const GAMES = JSON.parse(fs.readFileSync(path.join(REPO, 'games.json'), 'utf8').replace(/^﻿/, '')).live;
const BRAND = JSON.parse(fs.readFileSync(path.join(STUDIO, 'brand.json'), 'utf8').replace(/^﻿/, ''));

// Optional overrides for offline testing: FEDGE_CAPTURE_SOURCES='{"lockin":"file:///.../index.html"}'
// and FEDGE_CAPTURE_LIBS='{"https://cdn...phaser.min.js":"/local/phaser.min.js"}'
const SOURCES = JSON.parse(process.env.FEDGE_CAPTURE_SOURCES || '{}');
const LIBS = JSON.parse(process.env.FEDGE_CAPTURE_LIBS || '{}');
const RECORD_SECONDS = Number(process.env.FEDGE_CAPTURE_SECONDS || 12);

// Buttons worth tapping to get from a title screen into real gameplay.
const TAP = /^(\s*[▶►🎮🚀⚡]?\s*)(start|play|begin|let'?s go|continue|next|enter|new game|start game|play now|lock in|go|tap to start|tap to play|get started|accept|choose|pick|trade|buy|invest|sign|create|ok|got it|connect|select|authorize|allow|link|skip|demo|paper|launch|open)\b/i;

function findPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try { return require(require.resolve(name, { paths: [REPO, process.cwd()] })); } catch (_) {}
  }
  console.error('Playwright not found. Run "npm install" in the FEDGE folder first.');
  process.exit(1);
}

async function tapThrough(page, seconds) {
  const end = Date.now() + seconds * 1000;
  let taps = 0;
  while (Date.now() < end) {
    // Prefer an obvious "start/next" button; otherwise tap the first visible choice/card.
    const clicked = await page.evaluate((tapSrc) => {
      const tap = new RegExp(tapSrc.source, tapSrc.flags);
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 20 && r.height > 16 && r.top >= 0 && r.bottom <= innerHeight + 4 && s.visibility !== 'hidden' && s.display !== 'none' && s.pointerEvents !== 'none'; };
      const els = [...document.querySelectorAll('button, [role=button], a.btn, .btn, [onclick], input[type=button], input[type=submit]')].filter((el) => vis(el) && !el.disabled);
      const named = els.find((el) => tap.test((el.innerText || el.value || '').trim()));
      const choices = els.filter((el) => /choice|option|card|answer|select|pick/i.test(el.className || ''));
      const choice = choices[Math.floor(Math.random() * choices.length)]; // vary answers so the clip shows different outcomes
      const target = named || choice;
      if (!target) {
        // "Tap to continue" screens: tap the middle of the screen.
        const hint = [...document.querySelectorAll('body *')].find((el) => el.children.length === 0 && /tap (anywhere|to continue)|click to continue/i.test(el.textContent || '') && vis(el));
        const at = hint || document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        if (!at) return null;
        at.click();
        return 'tap screen';
      }
      target.scrollIntoView({ block: 'center' });
      target.click();
      return (target.innerText || target.value || target.className || '').trim().slice(0, 40);
    }, { source: TAP.source, flags: TAP.flags }).catch(() => null);
    if (clicked) { taps++; console.log(`   tap: ${clicked}`); }
    // Fill any name box so character-creation screens can continue.
    await page.evaluate(() => { for (const i of document.querySelectorAll('input[type=text]:not([value]), input:not([type])')) { if (!i.value) { i.value = 'Fellito'; i.dispatchEvent(new Event('input', { bubbles: true })); } } }).catch(() => {});
    await page.mouse.wheel(0, 120).catch(() => {});
    await page.waitForTimeout(clicked ? 1400 : 900);
  }
  return taps;
}

async function capture(browser, game) {
  const url = SOURCES[game.id] || game.play;
  const dir = path.join(FOOTAGE, game.id);
  fs.mkdirSync(dir, { recursive: true });
  const raw = path.join(dir, '_raw');
  fs.rmSync(raw, { recursive: true, force: true });
  const ctx = await browser.newContext({
    // Video is recorded at the page's own size (a bigger size just adds gray padding).
    viewport: { width: 432, height: 768 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
    recordVideo: { dir: raw, size: { width: 432, height: 768 } },
  });
  // Skip the beta password screen (the game only checks this browser flag).
  await ctx.addInitScript((hash) => { try { localStorage.setItem('fedge_pass', hash); } catch (_) {} }, BRAND.gate_hash);
  for (const [from, file] of Object.entries(LIBS)) {
    await ctx.route(from, (r) => r.fulfill({ path: file, contentType: 'application/javascript' }));
  }
  const page = await ctx.newPage();
  const t0 = Date.now();
  console.log(`🎮 ${game.name}: ${url}`);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('   load warning: ' + e.message));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(dir, 'title.png') });
  const taps = await tapThrough(page, RECORD_SECONDS);
  await page.screenshot({ path: path.join(dir, 'gameplay.png') });
  const skip = Math.max(0, (Date.now() - t0) / 1000 - RECORD_SECONDS - 1.5); // drop the blank page-load start
  await ctx.close();
  const webm = fs.readdirSync(raw).find((f) => f.endsWith('.webm'));
  const out = path.join(dir, 'gameplay.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', skip.toFixed(2), '-i', path.join(raw, webm),
    '-vf', 'scale=720:1280:flags=lanczos,fps=30', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', out]);
  fs.rmSync(raw, { recursive: true, force: true });
  console.log(`   saved ${path.relative(REPO, out)} (${taps} taps)`);
}

(async () => {
  const want = process.argv[2];
  const list = want ? GAMES.filter((g) => g.id === want) : GAMES;
  if (!list.length) { console.error(`Unknown game "${want}". Try: ${GAMES.map((g) => g.id).join(', ')}`); process.exit(1); }
  const { chromium } = findPlaywright();
  const launch = process.env.FEDGE_CAPTURE_BROWSER ? { executablePath: process.env.FEDGE_CAPTURE_BROWSER } : {};
  let browser;
  try { browser = await chromium.launch(launch); }
  catch (e) {
    try { browser = await chromium.launch({ ...launch, channel: 'msedge' }); } // Windows always has Edge
    catch (_) { console.error('No browser for recording. Run: npx playwright install chromium'); process.exit(1); }
  }
  for (const g of list) {
    try { await capture(browser, g); } catch (e) { console.log(`   ⚠️ ${g.name} failed: ${e.message}`); }
  }
  await browser.close();
})();
