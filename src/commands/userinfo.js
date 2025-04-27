const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Xem thông tin của một thành viên')
    .addUserOption(o =>
      o.setName('target')
       .setDescription('Thành viên cần xem')
       .setRequired(false)
    ),
  async execute(interaction) {
    const member = interaction.options.getMember('target') || interaction.member;
    const embed = new EmbedBuilder()
      .setTitle(`${member.user.tag}`)
      .setThumbnail(member.displayAvatarURL())
      .addFields(
        { name: 'ID', value: member.id, inline: true },
        { name: 'Tham gia server', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true },
        { name: 'Tạo tài khoản', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`, inline: true },
      )
      .setColor(0x3498db);
    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
