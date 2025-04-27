const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Bot chọn ngẫu nhiên một option')
    .addStringOption(o =>
      o.setName('options')
       .setDescription('Các lựa chọn, cách nhau bởi dấu phẩy')
       .setRequired(true)
    ),
  async execute(interaction) {
    const opts = interaction.options.getString('options').split(',').map(e => e.trim()).filter(Boolean);
    if (opts.length < 2) return interaction.reply('❌ Cần ≥2 lựa chọn!');
    const pick = opts[Math.floor(Math.random() * opts.length)];
    await interaction.reply(`🎲 Tôi chọn: **${pick}**`);
  },
};
