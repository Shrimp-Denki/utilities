const { SlashCommandBuilder } = require('discord.js');
const { clientId } = '1308454366180540466'; // hoặc .env

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Link mời bot vào server khác'),
  async execute(interaction) {
    const perms = 8n; // quyền Admin; đổi tùy nhu cầu
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${perms}&scope=bot%20applications.commands`;
    await interaction.reply({ content: `🔗 **Invite:** ${url}`, ephemeral: true });
  },
};
