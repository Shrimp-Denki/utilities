const { SlashCommandBuilder } = require('discord.js');
const ms = require('ms');                           // npm i ms

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Nhắc bạn sau một khoảng thời gian')
    .addStringOption(o =>
      o.setName('time')
       .setDescription('Ví dụ: 10m, 2h, 3d')
       .setRequired(true))
    .addStringOption(o =>
      o.setName('message')
       .setDescription('Nội dung nhắc')
       .setRequired(false)),
  async execute(interaction) {
    const timeStr = interaction.options.getString('time');
    const note    = interaction.options.getString('message') || '🔔 Đến giờ rồi!';
    const delay   = ms(timeStr);

    if (!delay || delay < 5000 || delay > 7 * 24 * 60 * 60 * 1000)
      return interaction.reply({ content: '❌ 5 giây ≤ thời gian ≤ 7 ngày (1h, 30m, 2d…).', ephemeral: true });

    await interaction.reply(`⏰ Ok! Mình sẽ nhắc sau **${timeStr}**.`);

    setTimeout(() => {
      // Thử DM trước – nếu khóa, gửi tại kênh hiện tại
      interaction.user.send(note).catch(() => {
        interaction.channel.send(`<@${interaction.user.id}> ${note}`);
      });
    }, delay);
  },
};
