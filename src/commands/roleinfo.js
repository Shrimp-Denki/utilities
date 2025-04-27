const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Xem thông tin của một role')
    .addRoleOption(o =>
      o.setName('role')
       .setDescription('Role cần xem')
       .setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const embed = new EmbedBuilder()
      .setTitle(`Role: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Thành viên', value: `${role.members.size}`, inline: true },
        { name: 'Tạo ngày', value: `<t:${Math.floor(role.createdTimestamp/1000)}:D>`, inline: true },
      )
      .setColor(role.color || 0x95a5a6);
    await interaction.reply({ embeds: [embed] });
  },
};
