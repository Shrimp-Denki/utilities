// src/commands/poll.js
const {
  SlashCommandBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
  ContainerBuilder, SectionBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  SeparatorBuilder, SeparatorSpacingSize,
  PermissionFlagsBits
} = require('discord.js');
const ms = require('ms');
const { insertPoll } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Tạo poll (mô tả ▸ ảnh ▸ vote ▸ auto-close)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o =>
      o.setName('question').setDescription('Câu hỏi').setRequired(true))
    .addStringOption(o =>
      o.setName('options').setDescription('A|B|C… (2-10)').setRequired(true))
    .addBooleanOption(o =>
      o.setName('multiple').setDescription('Cho phép vote nhiều lựa chọn').setRequired(true))
    .addStringOption(o =>
      o.setName('description').setDescription('Mô tả').setRequired(true))
    .addStringOption(o =>
      o.setName('image').setDescription('URL ảnh').setRequired(true))
    .addStringOption(o =>
      o.setName('duration').setDescription('Auto đóng: 10m, 2h…').setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optsRaw = interaction.options.getString('options');
    const multiple = interaction.options.getBoolean('multiple') ?? false;
    const description = interaction.options.getString('description');
    const imageURL = interaction.options.getString('image');
    const durationStr = interaction.options.getString('duration');

    const opts = optsRaw.split('|').map(t => t.trim()).filter(Boolean);
    if (opts.length < 2 || opts.length > 10) {
      return interaction.reply({ content: '❌ 2-10 tuỳ chọn thôi.', ephemeral: true });
    }

    const cont = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${question}`)
      );

    if (description) {
      cont.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      );
    }

    if (imageURL) {
      cont.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(imageURL)
        )
      );
    }

    cont.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );

    const pollKey = interaction.id;
    opts.forEach((text, i) => {
      const voteBtn = new ButtonBuilder()
        .setCustomId(`pollvote:${pollKey}:${i}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Vote');

      cont.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${i + 1}.** ${text} — **0** phiếu`)
          )
          .setButtonAccessory(voteBtn)
      );
    });

    cont.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );

    const endUnix = durationStr ? Math.floor((Date.now() + ms(durationStr)) / 1000) : null;
    cont.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        endUnix
          ? `⏰ Kết thúc <t:${endUnix}:R> — <t:${endUnix}:f>`
          : 'Bình chọn mở'
      )
    );

    const msg = await interaction.reply({
      components: [cont],
      flags: MessageFlags.IsComponentsV2,
      fetchReply: true,
    });

    insertPoll({
      messageId: msg.id,
      guildId: msg.guild.id,
      channelId: msg.channel.id,
      question: question,
      options: JSON.stringify(opts),
      multiple: multiple ? 1 : 0,
      endAt: Date.now() + ms(durationStr)
    });

    const data = {
      opts, multiple,
      votes: new Map(),
      message: msg,
      question, description, image: imageURL,
      endUnix, closed: false,
    };
    const store = interaction.client.v2Polls ??= new Map();
    store.set(interaction.id, data);
    store.set(msg.id, data);

    if (endUnix) {
      const delay = endUnix * 1000 - Date.now();
      if (delay >= 60_000 && delay <= 86_400_000) {
        setTimeout(() => closePoll(msg.id, interaction.client).catch(() => {}), delay);
      }
    }
  },
};

async function closePoll(key, client) {
  const poll = client.v2Polls?.get(key);
  if (!poll || poll.closed) return;

  const tally = Array(poll.opts.length).fill(0);
  for (const v of poll.votes.values()) {
    if (poll.multiple) {
      for (const i of v) tally[i]++;
    } else tally[v]++;
  }

  const cont = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${poll.question}`)
    );

  if (poll.description) {
    cont.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(poll.description)
    );
  }

  if (poll.image) {
    cont.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(poll.image)
      )
    );
  }

  cont.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
  ).addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Kết quả cuối cùng')
  ).addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  poll.opts.forEach((opt, i) => {
    const viewBtn = new ButtonBuilder()
      .setCustomId(`pollview:${key}:${i}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel(' View');

    cont.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${i + 1}.** ${opt} — **${tally[i]}** phiếu`)
        )
        .setButtonAccessory(viewBtn)
    );
  });

  await poll.message.edit({
    components: [cont],
    flags: MessageFlags.IsComponentsV2,
  });

  poll.closed = true;
}
module.exports.closePoll = closePoll;
