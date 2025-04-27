const { Events } = require('discord.js');
const afk = require('../afkStore');

module.exports = {
  name: Events.MessageCreate,               // theo pattern sự kiện gốc :contentReference[oaicite:0]{index=0}
  async execute(message) {
    if (message.author.bot) return;

    /* 1. Nếu chính chủ AFK gửi tin → gỡ AFK */
    if (afk.has(message.author.id)) {
      afk.delete(message.author.id);
      message.reply('✅ Bạn đã trở lại (AFK đã được gỡ).').catch(() => {});
    }

    /* 2. Nếu tag người đang AFK → báo */
    message.mentions.users.forEach(user => {
      if (afk.has(user.id)) {
        const { reason, since } = afk.get(user.id);
        const mins = Math.floor((Date.now() - since) / 60000);
        message.reply(`💤 **${user.tag}** đang AFK *${reason}* – ${mins} phút trước.`).catch(() => {});
      }
    });
  },
};
