// src/commands/giveawayEnd.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { endGiveaway } = require('./giveawayCreate');
const { finishGiveaway } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('Kết thúc một giveaway sớm')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('message').setDescription('Link/ID tin nhắn').setRequired(true)),

  async execute(interaction) {
    const id = (interaction.options.getString('message').match(/\d{17,}/g) || []).pop();
    if (!id) return interaction.reply({ content: 'ID không hợp lệ', ephemeral: true });

    const g = interaction.client.giveaways?.get(id);
    if (!g || g.closed) return interaction.reply({ content: 'Không phải giveaway hoặc đã kết thúc.', ephemeral: true });

    await endGiveaway(id, interaction.client);
    finishGiveaway(id);

    await interaction.reply({ content: 'Đã kết thúc giveaway!', ephemeral: true });
  },
};
