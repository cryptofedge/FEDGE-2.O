/**
 * Melao's Studio — FEDGE 2.O Skill
 * Managed by: FEDGE 2.O | @cryptofedge
 * Repo: https://github.com/cryptofedge/melaos-studio
 *
 * This skill is loaded by FEDGE 2.O's OpenClaw runtime.
 * Full implementation lives in the melaos-studio repo.
 * Drop melaos-studio.skill.js into agent/skills/ to activate.
 */

const path = require('path')
const skillPath = path.join(__dirname, '..', 'melaos-studio.skill')

let skill
try {
  skill = require(skillPath)
} catch (e) {
  skill = null
}

module.exports = {
  manifest: {
    id: 'melaos-studio',
    name: "Melao's Studio",
    version: '1.0.0',
    description: 'Turns WhatsApp messages into songs via Suno AI',
    triggers: [
      'make me a song', 'create a song', 'make a beat', 'make a track',
      'hazme una cancion', 'create music', 'generate a song', 'write me a song',
      'song about', 'song like', 'make me a trap', 'make me a reggaeton',
      'make me a hip hop', 'melao', 'LINK ', 'UNLINK', 'SONGS'
    ],
    repo: 'https://github.com/cryptofedge/melaos-studio',
    managed_by: 'FEDGE 2.O'
  },

  /**
   * Called by FEDGE 2.O when a WhatsApp message matches music intent
   * @param {object} ctx
   * @param {string} ctx.waId    - WhatsApp sender JID
   * @param {string} ctx.message - Raw user message
   * @param {function} ctx.reply - async (text) => void
   */
  run: async (ctx) => {
    if (skill && typeof skill.run === 'function') {
      return skill.run(ctx)
    }
    // Fallback if full skill not installed
    await ctx.reply(
      "🎵 *Melao's Studio*\n\nSkill file not loaded. Ask FEDGE 2.O to install:\n`melaos-studio.skill.js` → `agent/skills/`\n\nRepo: https://github.com/cryptofedge/melaos-studio"
    )
  }
}
