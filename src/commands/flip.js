const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flip')
    .setDescription('Tung đồng xu'),
  async execute(interaction) {
    const side = Math.random() < 0.5 ? '🇭 Heads' : '🇹 Tails';
    await interaction.reply(`🪙 **${side}**`);
  },
};
