const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Hiển thị avatar của người dùng')
    .addUserOption(opt =>
      opt.setName('target')
         .setDescription('Thành viên cần xem')
         .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${user.tag}` })
      .setImage(user.displayAvatarURL({ size: 512 }))
      .setColor(0x2ecc71);
    await interaction.reply({ embeds: [embed] });
  },
};
