/**
 * FEDGE 2.O — Skills Registry Loader
 * Run: node load-skills-registry.js
 * Copies skills-registry.json into the FEDGE-2.O bot so it's accessible at runtime.
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'skills-registry.json');
const FEDGE_ROOT = path.join(__dirname); // run from FEDGE-2.O root
const OUTPUT_PATH = path.join(FEDGE_ROOT, 'agent', 'SKILLS.json');

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

// ── Write to agent/ folder ──────────────────────────────────────────────────
fs.mkdirSync(path.join(FEDGE_ROOT, 'agent'), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(registry, null, 2));

console.log(`✅ FEDGE 2.O Skills Registry loaded`);
console.log(`   Total skills : ${registry.totalSkills}`);
console.log(`   Output       : ${OUTPUT_PATH}`);
console.log('');
console.log('📦 Skills by source:');

const bySource = registry.skills.reduce((acc, s) => {
  acc[s.source] = (acc[s.source] || 0) + 1;
  return acc;
}, {});

Object.entries(bySource).sort((a,b) => b[1]-a[1]).forEach(([src, count]) => {
  console.log(`   ${src.padEnd(16)} ${count} skills`);
});

console.log('');
console.log('🔍 Skill index:');
registry.skills.forEach((s, i) => {
  console.log(`   ${String(i+1).padStart(3)}. ${s.emoji} ${s.slug}`);
});

// ── Optionally write a flat trigger map for fast lookup ─────────────────────
const triggerMap = {};
registry.skills.forEach(skill => {
  (skill.triggers || []).forEach(trigger => {
    if (!triggerMap[trigger]) triggerMap[trigger] = [];
    triggerMap[trigger].push(skill.slug);
  });
});

const TRIGGER_PATH = path.join(FEDGE_ROOT, 'agent', 'SKILL_TRIGGERS.json');
fs.writeFileSync(TRIGGER_PATH, JSON.stringify(triggerMap, null, 2));
console.log(`\n✅ Trigger map written: ${Object.keys(triggerMap).length} triggers → ${TRIGGER_PATH}`);
