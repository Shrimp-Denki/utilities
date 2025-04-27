const { SlashCommandBuilder } = require('discord.js');
const translate = require('translate-google');      // npm i translate-google

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Dịch văn bản')
    .addStringOption(o =>
      o.setName('text')
       .setDescription('Nội dung cần dịch')
       .setRequired(true))
    .addStringOption(o =>
      o.setName('to')
       .setDescription('Ngôn ngữ đích (en, vi, ja…)')
       .setRequired(true))
    .addStringOption(o =>
      o.setName('from')
       .setDescription('Ngôn ngữ nguồn (auto nếu bỏ trống)')
       .setRequired(false)),
  async execute(interaction) {
    const text = interaction.options.getString('text');
    const to   = interaction.options.getString('to');
    const from = interaction.options.getString('from') || 'auto';

    try {
      const res = await translate(text, { from, to });
      await interaction.reply(`🔤 **${from} → ${to}:**\n${res}`);
    } catch (err) {
      await interaction.reply({ content: '❌ Dịch thất bại – mã ngôn ngữ không hợp lệ?', ephemeral: true });
    }
  },
};
