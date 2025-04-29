// src/events/ready.js
const { getActiveGiveaways, getActivePolls, finishGiveaway, finishPoll } = require('../db');
const { endGiveaway } = require('../commands/giveawayCreate');
const { closePoll } = require('../commands/poll');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    client.user.setPresence({
      activities: [{ name: 'với Hocmai.vn', type: 2 }],
      status: 'online',
    });
    
    for (const g of getActiveGiveaways()) {
      const channel = await client.channels.fetch(g.channelId).catch(() => null);
      if (!channel) {
        finishGiveaway(g.messageId);
        continue;
      }
      const endIn = g.endAt - Date.now();
      if (endIn <= 0) {
        await endGiveaway(g.messageId, client);
        finishGiveaway(g.messageId);
      } else {
        setTimeout(async () => {
          await endGiveaway(g.messageId, client).catch(() => {});
          finishGiveaway(g.messageId);
        }, endIn);
      }
    }

    for (const p of getActivePolls()) {
      const channel = await client.channels.fetch(p.channelId).catch(() => null);
      if (!channel) {
        finishPoll(p.messageId);
        continue;
      }
      const endIn = p.endAt - Date.now();
      if (endIn <= 0) {
        await closePoll(p.messageId, client);
        finishPoll(p.messageId);
      } else {
        setTimeout(async () => {
          await closePoll(p.messageId, client).catch(() => {});
          finishPoll(p.messageId);
        }, endIn);
      }
    }

    console.log(`✅ Restored ${getActiveGiveaways().length} giveaways & ${getActivePolls().length} polls`);
  },
};
