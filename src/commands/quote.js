const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Lấy 1 câu quote ngẫu nhiên'),
  async execute(interaction) {
    const res  = await fetch('https://type.fit/api/quotes');
    const list = await res.json();
    const pick = list[Math.floor(Math.random() * list.length)];
    const embed = new EmbedBuilder()
      .setDescription(`“${pick.text}”\n— **${pick.author || 'Unknown'}**`)
      .setColor(0xf1c40f);
    await interaction.reply({ embeds: [embed] });
  },
};
