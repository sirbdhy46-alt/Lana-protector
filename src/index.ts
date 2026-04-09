import http from "node:http";
import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from "discord.js";
import { registerMessageHandlers } from "./events/messageHandler.js";
import { registerWelcomeHandlers } from "./events/welcome.js";
import { startGiveawayTimer } from "./commands/giveaway.js";
import { startReminders } from "./commands/extras.js";

const port = Number(process.env["PORT"] ?? 8080);
http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✿ Lana Del Dey Bot is online ✿");
}).listen(port, () => {
  console.log(`Health server listening on port ${port}`);
});

const token = process.env["DISCORD_TOKEN"];
if (!token) {
  console.error("DISCORD_TOKEN environment variable is required.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
});

const ROTATING_STATUSES = [
  { name: "Lana Del Dey ♡ | !help", type: ActivityType.Listening },
  { name: "Born To Die ♡", type: ActivityType.Listening },
  { name: "Summertime Sadness 🌊", type: ActivityType.Listening },
  { name: "!setup list — 10 themes!", type: ActivityType.Playing },
  { name: "your servers | !help", type: ActivityType.Watching },
  { name: "Ultraviolence ⚡", type: ActivityType.Listening },
  { name: "Norman Fucking Rockwell 🌿", type: ActivityType.Listening },
];

let statusIndex = 0;

client.once("ready", () => {
  console.log(`✿ Lana Del Dey Bot is online as ${client.user?.tag}!`);

  const setStatus = () => {
    const s = ROTATING_STATUSES[statusIndex % ROTATING_STATUSES.length]!;
    client.user?.setPresence({ status: "dnd", activities: [s] });
    statusIndex++;
  };

  setStatus();
  setInterval(setStatus, 5 * 60_000);

  startGiveawayTimer(client);
  startReminders(client);
});

registerMessageHandlers(client);
registerWelcomeHandlers(client);

client.login(token).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});
