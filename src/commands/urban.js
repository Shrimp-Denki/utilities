const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urban')
    .setDescription('Định nghĩa Urban Dictionary')
    .addStringOption(o =>
      o.setName('term')
       .setDescription('Từ cần tìm')
       .setRequired(true)
    ),
  async execute(interaction) {
    const term = interaction.options.getString('term');
    const res  = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
    const json = await res.json();
    if (!json.list.length)
      return interaction.reply(`❌ Không tìm thấy định nghĩa cho **${term}**`);
    const def = json.list[0];
    const embed = new EmbedBuilder()
      .setTitle(def.word)
      .setURL(def.permalink)
      .setDescription(def.definition.slice(0, 1024))
      .addFields({ name: 'Ví dụ', value: def.example.slice(0, 1024) || '—' })
      .setFooter({ text: `👍 ${def.thumbs_up} | 👎 ${def.thumbs_down}` })
      .setColor(0x1abc9c);
    await interaction.reply({ embeds: [embed] });
  },
};
