const { SlashCommandBuilder } = require('discord.js');
const afk = require('../afkStore');   // map lưu trạng thái dùng chung

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Đánh dấu bạn AFK')
    .addStringOption(o =>
      o.setName('reason')
       .setDescription('Lý do (tuỳ chọn)')
       .setRequired(false)),
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK';
    afk.set(interaction.user.id, { reason, since: Date.now() });
    await interaction.reply(`💤 Bạn đã được đánh dấu AFK: **${reason}**`);
  },
};
