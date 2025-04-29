const {
  SlashCommandBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
  ContainerBuilder, SectionBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  SeparatorBuilder, SeparatorSpacingSize,
} = require('discord.js');
const ms = require('ms');

module.exports = {
  /*──────── Slash schema ────────*/
  data: new SlashCommandBuilder()
    .setName('giveaway-create')
    .setDescription('Tạo giveaway nhanh')
    /* required – luôn ở trên */
    .addStringOption(o => o.setName('name').setDescription('Tiêu đề').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Số người thắng').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('10m, 2h…').setRequired(true))
    /* optional */
    .addStringOption(o => o.setName('description').setDescription('Mô tả').setRequired(false))
    .addStringOption(o => o.setName('image').setDescription('URL ảnh').setRequired(false)),

  /*──────── Execute ────────*/
  async execute(interaction) {
    const title   = interaction.options.getString('name');
    const winners = interaction.options.getInteger('winners');
    const durStr  = interaction.options.getString('duration');
    const desc    = interaction.options.getString('description');
    const imgURL  = interaction.options.getString('image');

    const endUnix = Math.floor((Date.now() + ms(durStr)) / 1000);

    /* Container */
    const c = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 🎉 ${title}`)
      );

    if (desc)
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(desc)
      );

    if (imgURL)
      c.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(imgURL)
        )
      );

    c.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );

    const joinBtn = new ButtonBuilder()
      .setCustomId(`giveaway_join:${interaction.id}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel('🎟️ Tham gia');

    c.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Nhấn nút để tham gia giveaway!')
        )
        .setButtonAccessory(joinBtn)
    );

    /* footer – THÊM dòng "👥 Số người tham gia" */
    c.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    ).addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏰ Kết thúc <t:${endUnix}:R> — <t:${endUnix}:f>\n` +
        `👑 Số người thắng: **${winners}**\n` +
        `👥 Số người tham gia: **0**`
      )
    );

    const msg = await interaction.reply({
      components: [c],
      flags: MessageFlags.IsComponentsV2,
      fetchReply: true,
    });

    /* Lưu giveaway vào Map */
    const g = {
      title, desc, imgURL,
      winners, endUnix,
      message: msg,
      entrants: new Set(),   // uid
      closed: false,
      lastWinners: [],
    };
    const map = interaction.client.giveaways ??= new Map();
    map.set(interaction.id, g);
    map.set(msg.id, g);

    /* Auto-end */
    setTimeout(() => require('./giveawayCreate').endGiveaway(msg.id, interaction.client).catch(()=>{}), ms(durStr));
  },
};

/*──────────────── Helper kết thúc (end / reroll) ───────────────*/
async function endGiveaway(id, client, reroll = false) {
  const g = client.giveaways?.get(id);
  if (!g || g.closed) return;

  /* pick winners */
  const entrants = [...g.entrants];
  const winnersArr = [];
  while (winnersArr.length < Math.min(g.winners, entrants.length)) {
    const i = Math.floor(Math.random() * entrants.length);
    winnersArr.push(entrants.splice(i, 1)[0]);
  }
  g.lastWinners = winnersArr;

  /* Build result container – giữ header, ảnh, mô tả */
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 🎉 ${g.title}`)
    );
  if (g.desc)
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(g.desc)
    );
  if (g.imgURL)
    c.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(g.imgURL)
      )
    );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
  ).addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      winnersArr.length
        ? `🎊 **Winner${winnersArr.length > 1 ? 's' : ''}:** ${winnersArr.map(u=>`<@${u}>`).join(', ')}`
        : '😢 Không có người tham gia.'
    )
  );

  const viewBtn = new ButtonBuilder()
    .setCustomId(`giveaway_view:${id}`)
    .setStyle(ButtonStyle.Secondary)
    .setLabel('👥 Xem người tham gia');

  c.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Nhấn để xem danh sách entrants')
      )
      .setButtonAccessory(viewBtn)
  );

  await g.message.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
  g.closed = true;
}
module.exports.endGiveaway = endGiveaway;
