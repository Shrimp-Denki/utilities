const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timer')
    .setDescription('Đếm ngược rồi nhắc bạn')
    .addIntegerOption(o =>
      o.setName('seconds')
       .setDescription('Thời gian (5–3600 giây)')
       .setMinValue(5)
       .setMaxValue(3600)
       .setRequired(true)
    ),
  async execute(interaction) {
    const sec = interaction.options.getInteger('seconds');
    await interaction.reply(`⏳ Hẹn giờ **${sec}** giây…`);
    setTimeout(() => interaction.followUp(`<@${interaction.user.id}> ⏰ Hết giờ!`), sec * 1000);
  },
};
