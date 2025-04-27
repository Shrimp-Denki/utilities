const { SlashCommandBuilder } = require('discord.js');
const math = require('mathjs');          // npm i mathjs

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Tính nhanh biểu thức')
    .addStringOption(o =>
      o.setName('expr')
       .setDescription('Biểu thức, ví dụ 2*(3+4)')
       .setRequired(true)
    ),
  async execute(interaction) {
    const expr = interaction.options.getString('expr');
    try {
      const res = math.evaluate(expr).toString();
      await interaction.reply(`🧮 **${expr} = ${res}**`);
    } catch {
      await interaction.reply({ content: '❌ Biểu thức không hợp lệ!', ephemeral: true });
    }
  },
};
