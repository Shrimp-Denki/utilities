const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Đếm thành viên server'),
  async execute(interaction) {
    await interaction.reply(`👥 Server có **${interaction.guild.memberCount}** thành viên.`);
  },
};
