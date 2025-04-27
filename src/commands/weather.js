const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Thời tiết nhanh cho một thành phố')
    .addStringOption(o =>
      o.setName('city')
       .setDescription('Tên thành phố, ví dụ: Hanoi')
       .setRequired(true)
    ),
  async execute(interaction) {
    const city = interaction.options.getString('city');
    const url  = `https://wttr.in/${encodeURIComponent(city)}?format=3`;
    const txt  = await fetch(url).then(r => r.text());
    await interaction.reply(`🌤  ${txt}`);
  },
};
