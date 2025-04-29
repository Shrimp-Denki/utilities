// src/commands/giveawayReroll.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { endGiveaway } = require('./giveawayCreate');
const { finishGiveaway } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('Reroll giveaway đã kết thúc')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('message').setDescription('Link/ID tin nhắn').setRequired(true)),

  async execute(interaction) {
    const id = (interaction.options.getString('message').match(/\d{17,}/g) || []).pop();
    if (!id) return interaction.reply({ content: 'ID không hợp lệ', ephemeral: true });

    const g = interaction.client.giveaways?.get(id);
    if (!g || !g.closed) return interaction.reply({ content: 'Giveaway chưa kết thúc hoặc không tồn tại.', ephemeral: true });

    await endGiveaway(id, interaction.client, true);
    finishGiveaway(id);

    await interaction.reply({ content: 'Reroll xong rồi!', ephemeral: true });
  },
};
