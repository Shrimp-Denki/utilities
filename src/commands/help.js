const {
    SlashCommandBuilder, EmbedBuilder,
    StringSelectMenuBuilder, ActionRowBuilder,
    StringSelectMenuOptionBuilder,
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Chọn nhóm lệnh để xem')
      .addBooleanOption(o =>
        o.setName('dm')
          .setDescription('Gửi vào DM?')
          .setRequired(false)),
  
    async execute(interaction) {
      const { client } = interaction;
      const sendDM = interaction.options.getBoolean('dm') ?? false;
  
      // Gom lệnh theo thư mục cha
      const categories = {};
      client.commands.forEach(cmd => {
        const folder =
          cmd.__filename?.split('/').slice(-2, -1)[0] || 'misc';
        (categories[folder] ||= []).push(cmd);
      });
  
      // Xây select-menu V2
      const select = new StringSelectMenuBuilder()
        .setCustomId('help_menu')
        .setPlaceholder('Chọn nhóm lệnh…')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Tất cả')
            .setValue('all')
            .setDefault(true),
          ...Object.keys(categories).map(cat =>
            new StringSelectMenuOptionBuilder()
              .setLabel(cat.toUpperCase())
              .setValue(cat)),
        );
  
      const row = new ActionRowBuilder().addComponents(select);
  
      // Embed mặc định (tất cả lệnh)
      const embed = buildEmbed('all');
  
      const reply = { embeds: [embed], components: [row], ephemeral: !sendDM };
  
      sendDM
        ? interaction.user.send(reply).then(() =>
            interaction.reply({ content: '📬 Đã gửi vào DM!', ephemeral: true }),
          )
        : interaction.reply(reply);
  
      //──── local helper ────
      function buildEmbed(key) {
        const eb = new EmbedBuilder()
          .setColor(0x95a5a6)
          .setTitle('📖 Danh sách lệnh');
  
        const entries =
          key === 'all'
            ? Object.entries(categories)
            : [[key, categories[key]]];
  
        for (const [cat, cmds] of entries) {
          eb.addFields({
            name: cat.toUpperCase(),
            value: cmds.map(c => `• **/${c.data.name}**`).join('\n'),
          });
        }
        return eb;
      }
  
      // Lưu tạm categories vào interaction để handler dùng
      interaction._helpCategories = categories;
    },
  };
  