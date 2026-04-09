import { type Message, Events, type Client } from "discord.js";
import { handleModeration } from "../commands/moderation.js";
import { handleSetup, handleOnboard } from "../commands/setup.js";
import { handleUtility, sniped, editSniped } from "../commands/utility.js";
import { handleFun } from "../commands/fun.js";
import { handleEconomy } from "../commands/economy.js";
import { handleLeveling, handleXp } from "../commands/leveling.js";
import { handleGiveaway } from "../commands/giveaway.js";
import { handleExtras, handleAfkCheck, handleStarboard } from "../commands/extras.js";
import { get, defaultSettings, type GuildSettings } from "../data/storage.js";

const MOD_COMMANDS = new Set([
  "ban", "kick", "mute", "unmute", "timeout", "warn", "warnings",
  "clearwarns", "clear", "purge", "slowmode", "lock", "unlock",
  "nick", "jail", "unjail", "nuke",
  "hardban", "hardfuck",
]);

const SETUP_COMMANDS = new Set([
  "setup", "onboard",
  "setwelcome", "setleave", "setlogs",
  "setlevelchannel", "setjailchannel", "setprefix",
  "settings",
]);

const UTILITY_COMMANDS = new Set([
  "help", "snipe", "editsnipe", "serverinfo", "userinfo", "avatar",
  "ping", "botinfo", "say", "embed",
]);

const FUN_COMMANDS = new Set([
  "hug", "slap", "kiss", "dance", "fight", "8ball", "coinflip",
  "dice", "rps", "quote", "ship", "poll", "roast", "compliment",
  "pat", "poke", "cry",
]);

const ECONOMY_COMMANDS = new Set([
  "balance", "bal", "daily", "work", "pay", "give", "rob",
  "deposit", "dep", "withdraw", "with", "shop", "buy",
]);

const LEVELING_COMMANDS = new Set(["rank", "level", "levels", "leaderboard", "lb", "setlevel"]);

const GIVEAWAY_COMMANDS = new Set(["gstart", "gend", "greroll"]);

const EXTRAS_COMMANDS = new Set([
  "afk", "remind", "reminder",
  "ticket",
  "starboard",
  "confess",
  "aesthetic", "ae",
  "clap", "mock", "uwu", "owo",
  "reverse", "morse", "binary", "spoiler", "emojify",
  "vibe", "iq", "pp", "gay", "gayrate", "crush", "crushrate",
  "rate", "color", "colour",
  "truth", "dare", "wyr", "wouldyourather",
  "nhie", "neverhaveiever",
  "steal",
  "banner", "servericon", "serverbanner",
  "membercount", "mc",
  "roleinfo", "channelinfo",
]);

const LEADERBOARD_COMMANDS = new Set(["leaderboard", "lb"]);

export function registerMessageHandlers(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    await handleXp(message).catch(() => {});
    await handleAfkCheck(message).catch(() => {});

    const guildId = message.guildId!;
    const settings = get<GuildSettings>(`settings:${guildId}`, "data", defaultSettings);
    const prefix = settings.prefix ?? "!";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase() ?? "";

    if (!cmd) return;

    try {
      if (MOD_COMMANDS.has(cmd)) {
        await handleModeration(cmd, message, args);
      } else if (cmd === "onboard") {
        await handleOnboard(message);
      } else if (SETUP_COMMANDS.has(cmd)) {
        await handleSetup(cmd, message, args);
      } else if (UTILITY_COMMANDS.has(cmd)) {
        await handleUtility(cmd, message, args);
      } else if (FUN_COMMANDS.has(cmd)) {
        await handleFun(cmd, message, args);
      } else if (ECONOMY_COMMANDS.has(cmd)) {
        await handleEconomy(cmd, message, args);
      } else if (LEVELING_COMMANDS.has(cmd)) {
        await handleLeveling(cmd, message, args);
      } else if (LEADERBOARD_COMMANDS.has(cmd)) {
        await handleLeveling(cmd, message, args);
        await handleEconomy(cmd, message, args);
      } else if (GIVEAWAY_COMMANDS.has(cmd)) {
        await handleGiveaway(cmd, message, args);
      } else if (EXTRAS_COMMANDS.has(cmd)) {
        await handleExtras(cmd, message, args);
      }
    } catch (err) {
      console.error(`Error handling command ${cmd}:`, err);
    }
  });

  client.on(Events.MessageDelete, (message) => {
    if (!message.author || message.author.bot) return;
    if (!message.content) return;
    sniped.set(message.channel.id, {
      content: message.content,
      author: message.author.tag,
      authorId: message.author.id,
      avatar: message.author.displayAvatarURL(),
      timestamp: Date.now(),
    });
  });

  client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
    if (!oldMsg.author || oldMsg.author.bot) return;
    if (!oldMsg.content || !newMsg.content) return;
    if (oldMsg.content === newMsg.content) return;
    editSniped.set(oldMsg.channel.id, {
      before: oldMsg.content,
      after: newMsg.content,
      author: oldMsg.author.tag,
      authorId: oldMsg.author.id,
      avatar: oldMsg.author.displayAvatarURL(),
      timestamp: Date.now(),
    });
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name !== "⭐") return;
    try {
      const msg = reaction.partial ? await reaction.message.fetch() : reaction.message;
      if (msg.partial) return;
      await handleStarboard(msg as Message, client).catch(() => {});
    } catch {}
  });
}
