// src/index.js
require('dotenv').config();

const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
} = require('discord.js');

const fs   = require('fs');
const path = require('path');
const { table } = require('console');

/*──────────────── Client ─────────────────*/
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message], // để edit / fetch message cũ (poll & giveaway)
});

/*──────────────── Load COMMANDS (đệ quy) ─────────────────*/
client.commands = new Collection();

function walkCommands(dir) {
  for (const file of fs.readdirSync(dir)) {
    const loc = path.join(dir, file);
    if (fs.statSync(loc).isDirectory()) walkCommands(loc);
    else if (file.endsWith('.js')) {
      const cmd = require(loc);
      if ('data' in cmd && 'execute' in cmd) {
        client.commands.set(cmd.data.name, cmd);
        commandsTable.push({
          Command: '/' + cmd.data.name,
          Description: cmd.data.description,
        });
      } else console.warn(`[WARN] ${loc} thiếu "data" hoặc "execute".`);
    }
  }
}
const commandsTable = [];
walkCommands(path.join(__dirname, 'commands'));

console.log('\n=== COMMANDS LOADED ===');
commandsTable.length ? table(commandsTable) : console.log('No commands found.');

/*──────────────── Load EVENTS ─────────────────*/
function walkEvents(dir) {
  for (const file of fs.readdirSync(dir)) {
    const loc = path.join(dir, file);
    if (fs.statSync(loc).isDirectory()) walkEvents(loc);
    else if (file.endsWith('.js')) {
      const evt = require(loc);
      if (!evt || !evt.name || !evt.execute) continue;
      evt.once
        ? client.once(evt.name, (...args) => evt.execute(...args))
        : client.on(evt.name, (...args) => evt.execute(...args));

      eventsTable.push({ Event: evt.name, Once: evt.once ? 'Yes' : 'No' });
    }
  }
}
const eventsTable = [];
walkEvents(path.join(__dirname, 'events'));

console.log('\n=== EVENTS LOADED ===');
eventsTable.length ? table(eventsTable) : console.log('No events found.');

/*──────────────── Error handling ───────────────*/
process.on('unhandledRejection', console.error);
process.on('uncaughtException',  console.error);

/*──────────────── Login ─────────────────*/
client.login(process.env.TOKEN)
  .then(() => console.log('\n=== BOT ONLINE ==='))
  .catch(err => console.error('Login failed:', err));
