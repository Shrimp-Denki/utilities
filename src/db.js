// src/db.js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, '..', 'data.sqlite'));

db.prepare(`
  CREATE TABLE IF NOT EXISTS giveaways(
    messageId TEXT PRIMARY KEY,
    guildId   TEXT,
    channelId TEXT,
    name      TEXT,
    winners   INTEGER,
    endAt     INTEGER,
    ended     INTEGER DEFAULT 0
)`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS polls(
    messageId TEXT PRIMARY KEY,
    guildId   TEXT,
    channelId TEXT,
    question  TEXT,
    options   TEXT,
    multiple  INTEGER,
    endAt     INTEGER,
    ended     INTEGER DEFAULT 0
)`).run();

module.exports = {
  insertGiveaway(g) {
    db.prepare(`INSERT OR REPLACE INTO giveaways
      (messageId,guildId,channelId,name,winners,endAt,ended)
      VALUES (@messageId,@guildId,@channelId,@name,@winners,@endAt,0)`).run(g);
  },
  finishGiveaway(messageId) {
    db.prepare(`UPDATE giveaways SET ended=1 WHERE messageId=?`).run(messageId);
  },
  getActiveGiveaways() {
    return db.prepare(`SELECT * FROM giveaways WHERE ended=0`).all();
  },

  insertPoll(p) {
    db.prepare(`INSERT OR REPLACE INTO polls
      (messageId,guildId,channelId,question,options,multiple,endAt,ended)
      VALUES (@messageId,@guildId,@channelId,@question,@options,@multiple,@endAt,0)`).run(p);
  },
  finishPoll(messageId) {
    db.prepare(`UPDATE polls SET ended=1 WHERE messageId=?`).run(messageId);
  },
  getActivePolls() {
    return db.prepare(`SELECT * FROM polls WHERE ended=0`).all();
  }
};
