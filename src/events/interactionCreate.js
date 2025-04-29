// src/events/interactionCreate.js
const {
  Events,
  EmbedBuilder,
  // Component-V2 builders
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const client = interaction.client;

    /*──────────────── Slash-command ──────────────*/
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd)
        return interaction.reply({ content: '❌ Lệnh không tồn tại!', flags: MessageFlags.Ephemeral });

      try {
        await cmd.execute(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred)
          await interaction.reply({ content: '❌ Lỗi thực thi.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    /*──────────────── Poll: Vote ────────────────*/
    if (interaction.isButton() && interaction.customId.startsWith('pollvote:')) {
      const [, key, idxStr] = interaction.customId.split(':');
      const poll = client.v2Polls?.get(key);
      if (!poll) return interaction.reply({ content: '❌ Poll không tồn tại.', flags: MessageFlags.Ephemeral });
      if (poll.closed)
        return interaction.reply({ content: '⏳ Poll đã đóng.', flags: MessageFlags.Ephemeral });

      const idx = Number(idxStr);
      if (poll.multiple) {
        const set = poll.votes.get(interaction.user.id) ?? new Set();
        set.has(idx) ? set.delete(idx) : set.add(idx);
        poll.votes.set(interaction.user.id, set);
      } else {
        poll.votes.set(interaction.user.id, idx);
      }

      /* đếm lại */
      const counts = Array(poll.opts.length).fill(0);
      for (const v of poll.votes.values()) {
        if (poll.multiple) for (const i of v) counts[i]++; else counts[v]++;
      }

      const cont = buildVoteContainer(poll, counts, key);
      return interaction.update({ components: [cont], flags: MessageFlags.IsComponentsV2 });
    }

    /*──────────────── Poll: View voters ─────────*/
    if (interaction.isButton() && interaction.customId.startsWith('pollview:')) {
      const [, key, idxStr] = interaction.customId.split(':');
      const poll = client.v2Polls?.get(key);
      if (!poll)
        return interaction.reply({ content: '❌ Poll không khả dụng.', flags: MessageFlags.Ephemeral });

      const idx = Number(idxStr);
      const voters = [...poll.votes.entries()]
        .filter(([, v]) => (poll.multiple ? v.has(idx) : v === idx))
        .map(([uid]) => `<@${uid}>`);

      return interaction.reply({
        content: voters.length
          ? `**Người vote lựa chọn ${idx + 1}:**\n${voters.join('\n')}`
          : '_Không ai vote lựa chọn này._',
        flags: MessageFlags.Ephemeral,
      });
    }

    /*──────── Giveaway Join / Leave ───────*/
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_join:')) {
      const [, key] = interaction.customId.split(':');
      const g = client.giveaways?.get(key);
      if (!g || g.closed)
        return interaction.reply({ content: 'Giveaway đã kết thúc!', flags: MessageFlags.Ephemeral });

      /* 1. Toggle entrant */
      const uid = interaction.user.id;
      const joined = g.entrants.has(uid);
      joined ? g.entrants.delete(uid) : g.entrants.add(uid);

      await interaction.reply({
        content: joined ? '❌ Bạn đã rời giveaway.' : '✅ Đã tham gia giveaway!',
        flags: MessageFlags.Ephemeral,
      });

      /* 2. Re-build Container với số entrant mới */
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
      );

      const joinBtn = new ButtonBuilder()
        .setCustomId(`giveaway_join:${key}`)
        .setStyle(ButtonStyle.Primary)
        .setLabel('🎟️ Tham gia');

      c.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('Nhấn nút để tham gia giveaway!')
          )
          .setButtonAccessory(joinBtn)
      );

      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
      ).addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⏰ Kết thúc <t:${g.endUnix}:R> — <t:${g.endUnix}:f>\n` +
          `👑 Số người thắng: **${g.winners}**\n` +
          `👥 Số người tham gia: **${g.entrants.size}**`
        )
      );

      await g.message.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
      return;
    }


    /*──────────────── Giveaway: View entrants ───*/
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_view:')) {
      const [, key] = interaction.customId.split(':');
      const g = client.giveaways?.get(key);
      if (!g)
        return interaction.reply({ content: 'Giveaway không tồn tại.', flags: MessageFlags.Ephemeral });

      const list = [...g.entrants].map(u => `<@${u}>`);
      return interaction.reply({
        content: list.length ? list.join('\n') : 'Chưa có người tham gia.',
        flags: MessageFlags.Ephemeral,
      });
    }

    /*──────────────── Select-menu: /help ────────*/
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
      const folder = interaction.values[0];
      const embed = buildHelpEmbed(folder, client);
      return interaction.update({ embeds: [embed] });
    }
  },
};

/*════════ helper: Container khi poll CÒN mở ════════*/
function buildVoteContainer(poll, counts, key) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 📊 ${poll.question}`)
    );

  if (poll.description)
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(poll.description)
    );

  if (poll.image)
    c.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(poll.image)
      )
    );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
  );

  poll.opts.forEach((opt, i) => {
    const voteBtn = new ButtonBuilder()
      .setCustomId(`pollvote:${key}:${i}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Vote');

    c.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**${i + 1}.** ${opt} — **${counts[i]}** phiếu`
          )
        )
        .setButtonAccessory(voteBtn)
    );
  });

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
  );
  if (poll.endUnix)
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⏰ Kết thúc <t:${poll.endUnix}:R> — <t:${poll.endUnix}:f>`
      )
    );
  else
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Bình chọn mở')
    );

  return c;
}

/*════════ helper: embed /help ════════*/
function buildHelpEmbed(folder, client) {
  const groups = {};
  client.commands.forEach(c => {
    const f = c.__filename?.split('/').slice(-2, -1)[0] || 'misc';
    (groups[f] ||= []).push(c);
  });

  const eb = new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle('📖 Danh sách lệnh');

  const show = folder === 'all' ? Object.entries(groups) : [[folder, groups[folder] || []]];
  for (const [f, cmds] of show) {
    eb.addFields({
      name: f.toUpperCase(),
      value: cmds.length
        ? cmds.map(c => `• **/${c.data.name}**`).join('\n')
        : '_—_',
    });
  }
  return eb;
}
