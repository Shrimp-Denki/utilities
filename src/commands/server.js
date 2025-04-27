const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Hiển thị thông tin server hiện tại'),
  async execute(interaction) {
    const { guild } = interaction;
    const embed = new EmbedBuilder()
      .setTitle(`${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: 'ID', value: guild.id, inline: true },
        { name: 'Thành viên', value: `${guild.memberCount}`, inline: true },
        { name: 'Tạo ngày', value: `<t:${Math.floor(guild.createdTimestamp/1000)}:D>`, inline: true },
      )
      .setColor(0xe67e22);
    await interaction.reply({ embeds: [embed] });
  },
};
