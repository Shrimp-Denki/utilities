// Đóng poll sớm bằng link/ID tin nhắn
const { SlashCommandBuilder } = require('discord.js');
const { closePoll } = require('./poll');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('endvote')
    .setDescription('Đóng poll sớm (dán link hoặc ID tin nhắn poll)')
    .addStringOption(o =>
      o.setName('message').setDescription('Link/ID tin nhắn').setRequired(true)),

  async execute(interaction) {
    const ref = interaction.options.getString('message').trim();
    const id = (ref.match(/\d{17,}/g) || []).pop();
    if (!id) return interaction.reply({ content: '❌ Không tìm thấy ID.', ephemeral: true });

    const poll = interaction.client.v2Polls?.get(id);
    if (!poll || poll.closed)
      return interaction.reply({ content: '❌ Không phải poll hoặc đã đóng.', ephemeral: true });

    await closePoll(id, interaction.client);
    return interaction.reply({ content: '✅ Đã đóng poll.', ephemeral: true });
  },
};
