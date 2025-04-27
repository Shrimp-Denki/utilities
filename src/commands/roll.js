const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Đổ xúc xắc')
    .addIntegerOption(o =>
      o.setName('sides')
       .setDescription('Số mặt (mặc định 6)')
       .setMinValue(2)
       .setMaxValue(1000)
       .setRequired(false)
    ),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const result = 1 + Math.floor(Math.random() * sides);
    await interaction.reply(`🎲 Bạn đổ **d${sides}** → **${result}**`);
  },
};
