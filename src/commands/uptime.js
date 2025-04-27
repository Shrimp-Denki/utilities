const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Bot đã online bao lâu?'),
  async execute(interaction) {
    const ms = process.uptime() * 1000;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    await interaction.reply(`⏱ **Uptime:** ${d}d ${h}h ${m}m ${s}s`);
  },
};
