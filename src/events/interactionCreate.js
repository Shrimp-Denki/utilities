const {
  Events, EmbedBuilder,
  ContainerBuilder, SectionBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  ButtonBuilder, ButtonStyle,
  SeparatorBuilder, SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const { client } = interaction;

    /*──────── Slash-command (gọi execute) ───────*/
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return interaction.reply({ content: '❌ Lệnh không tồn tại!', ephemeral: true });
      try { await cmd.execute(interaction); } catch (e) {
        console.error(e);
        await interaction.reply({ content: '❌ Lỗi thực thi.', ephemeral: true });
      }
      return;
    }

    /*──────── Vote button ───────*/
    if (interaction.isButton() && interaction.customId.startsWith('pollvote:')) {
      const [, key, idxStr] = interaction.customId.split(':');
      const poll = client.v2Polls?.get(key);
      if (!poll) return interaction.reply({ content: '❌ Poll không tồn tại.', ephemeral: true });
      if (poll.closed) return interaction.reply({ content: '⏳ Poll đã đóng.', ephemeral: true });

      const idx = Number(idxStr);
      if (poll.multiple) {
        const set = poll.votes.get(interaction.user.id) ?? new Set();
        set.has(idx) ? set.delete(idx) : set.add(idx);
        poll.votes.set(interaction.user.id, set);
      } else poll.votes.set(interaction.user.id, idx);

      /* recount */
      const counts = Array(poll.opts.length).fill(0);
      for (const v of poll.votes.values()) {
        if (poll.multiple) for (const i of v) counts[i]++; else counts[v]++;
      }

      const cont = buildVoteContainer(poll, counts, key);
      return interaction.update({ components: [cont], flags: MessageFlags.IsComponentsV2 });
    }

    /*──────── View button ───────*/
    if (interaction.isButton() && interaction.customId.startsWith('pollview:')) {
      const [, key, idxStr] = interaction.customId.split(':');
      const poll = client.v2Polls?.get(key);
      if (!poll) return interaction.reply({ content: '❌ Poll không khả dụng.', ephemeral: true });

      const idx = Number(idxStr);
      const voters = [...poll.votes.entries()]
        .filter(([, v]) => poll.multiple ? v.has(idx) : v === idx)
        .map(([id]) => `<@${id}>`);

      return interaction.reply({
        content: voters.length
          ? `**Người vote lựa chọn ${idx + 1}:**\n${voters.join('\n')}`
          : '_Không ai vote lựa chọn này._',
        ephemeral: true,
      });
    }

    /*──────── Select-menu /help ───────*/
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
      const folder = interaction.values[0];
      const embed  = buildHelpEmbed(folder, client);
      return interaction.update({ embeds: [embed] });
    }
  },
};

/*──────── helper: container vote phase ───────*/
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
    const btn = new ButtonBuilder()
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
        .setButtonAccessory(btn)
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

/*──────── helper /help ───────*/
function buildHelpEmbed(folder, client) {
  const groups = {};
  client.commands.forEach(c => {
    const f = c.__filename?.split('/').slice(-2, -1)[0] || 'misc';
    (groups[f] ||= []).push(c);
  });
  const eb = new EmbedBuilder().setColor(0x95a5a6).setTitle('📖 Danh sách lệnh');
  const show = folder === 'all' ? Object.entries(groups) : [[folder, groups[folder] || []]];
  for (const [f, cmds] of show) {
    eb.addFields({
      name: f.toUpperCase(),
      value: cmds.length ? cmds.map(c => `• **/${c.data.name}**`).join('\n') : '_—_',
    });
  }
  return eb;
}
