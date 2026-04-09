import { type Message, type Client, EmbedBuilder } from "discord.js";
import { base, aesthetic, xpForLevel, rand, COLORS, CUTE } from "../utils/embeds.js";
import { get, set, update, defaultSettings, type GuildSettings } from "../data/storage.js";

type LevelData = { xp: number; level: number; lastXp: number };
const defaultLevel: LevelData = { xp: 0, level: 0, lastXp: 0 };
function lKey(g: string) { return `levels:${g}`; }

const SYMS = ["⟡","✿","♡","⊹","✶","❀","★","◎","⭔","✦","◈","❋","⌖","⍣"];
const sym = () => SYMS[Math.floor(Math.random() * SYMS.length)]!;
const LINE = () => `${sym()} ─────────────────────────── ${sym()}`;

// ─── XP HANDLER ───────────────────────────────────────────────────────────────

export async function handleXp(message: Message) {
  if (!message.guild || message.author.bot) return;
  const gid = message.guildId!;
  const uid = message.author.id;
  const now = Date.now();
  const data = get<LevelData>(lKey(gid), uid, defaultLevel);
  if (now - data.lastXp < 60_000) return;

  const xpGain = Math.floor(Math.random() * 15) + 5;
  const newXp = data.xp + xpGain;
  const needed = xpForLevel(data.level + 1);
  const newLevel = newXp >= needed ? data.level + 1 : data.level;
  update<LevelData>(lKey(gid), uid, (d) => ({ ...d, xp: newXp, level: newLevel, lastXp: now }), defaultLevel);

  if (newLevel > data.level) {
    const settings = get<GuildSettings>(`settings:${gid}`, "data", defaultSettings);
    const chId = settings.levelChannel;
    const ch = chId
      ? message.guild.channels.cache.get(chId)
      : message.channel;

    if (ch?.isTextBased()) {
      (ch as any).send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.leveling)
            .setTitle(`${sym()} Level Up! ${sym()}`)
            .setDescription(
              `${LINE()}\n\n` +
              `${message.author} just leveled up to **Level ${newLevel}**! 🎉\n\n` +
              `${LINE()}`
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      }).catch(() => {});
    }

    // Assign level roles if configured
    if (settings.levelroles?.[String(newLevel)]) {
      const role = message.guild.roles.cache.get(settings.levelroles[String(newLevel)]!);
      if (role) await message.member?.roles.add(role).catch(() => {});
    }

    // Update live leaderboard
    updateLiveLeaderboard(message.client, gid).catch(() => {});
  }
}

// ─── LIVE LEADERBOARD ─────────────────────────────────────────────────────────

type LiveBoard = { channelId: string; messageId: string };

function boardKey(gid: string) { return `liveboard:${gid}`; }

export function buildLeaderboardEmbed(entries: { uid: string; level: number; xp: number }[], guildName: string) {
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
  const lines = entries.slice(0, 10).map((e, i) =>
    `${medals[i] ?? `**${i + 1}.**`} <@${e.uid}>\n> Level **${e.level}** • **${e.xp.toLocaleString()}** XP`
  ).join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.leveling)
    .setTitle(`${sym()} Level Leaderboard — ${guildName} ${sym()}`)
    .setDescription(
      `${LINE()}\n\n` +
      (lines || "*No data yet — start chatting to earn XP!*") +
      `\n\n${LINE()}\n` +
      `*Updates automatically • Use \`!rank\` for your own level*`
    )
    .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
    .setTimestamp();
}

export async function updateLiveLeaderboard(client: Client, guildId: string) {
  const board = get<LiveBoard | null>(boardKey(guildId), "data", null);
  if (!board) return;
  const ch = client.channels.cache.get(board.channelId);
  if (!ch?.isTextBased()) return;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  // Get all level data for the guild and sort
  const raw = get<Record<string, LevelData>>(lKey(guildId), "__all__", {} as any);
  const storeKey = lKey(guildId);

  // Access raw storage — we read all user fields for this guild
  const entries: { uid: string; level: number; xp: number }[] = [];
  // Since storage is per-key/field, we iterate cached members
  for (const [uid] of guild.members.cache) {
    const d = get<LevelData>(storeKey, uid, defaultLevel);
    if (d.xp > 0) entries.push({ uid, level: d.level, xp: d.xp });
  }
  entries.sort((a, b) => b.xp - a.xp);

  const embed = buildLeaderboardEmbed(entries, guild.name);

  try {
    const existing = await (ch as any).messages.fetch(board.messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
    } else {
      const newMsg = await (ch as any).send({ embeds: [embed] });
      set(boardKey(guildId), "data", { channelId: board.channelId, messageId: newMsg.id });
    }
  } catch {}
}

export async function postLiveLeaderboard(client: Client, guildId: string, channelId: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const ch = client.channels.cache.get(channelId);
  if (!ch?.isTextBased()) return;

  const entries: { uid: string; level: number; xp: number }[] = [];
  for (const [uid] of guild.members.cache) {
    const d = get<LevelData>(lKey(guildId), uid, defaultLevel);
    if (d.xp > 0) entries.push({ uid, level: d.level, xp: d.xp });
  }
  entries.sort((a, b) => b.xp - a.xp);

  const embed = buildLeaderboardEmbed(entries, guild.name);
  const msg = await (ch as any).send({ embeds: [embed] });
  set(boardKey(guildId), "data", { channelId, messageId: msg.id });
  return msg.id;
}

// Start background leaderboard update timer
export function startLeaderboardTimer(client: Client) {
  setInterval(async () => {
    for (const [guildId] of client.guilds.cache) {
      await updateLiveLeaderboard(client, guildId).catch(() => {});
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// ─── COMMANDS ─────────────────────────────────────────────────────────────────

export async function handleLeveling(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const gid = message.guildId!;
  const uid = message.author.id;

  switch (cmd) {
    case "rank":
    case "level": {
      const target = message.mentions.users.first() ?? message.author;
      const data = get<LevelData>(lKey(gid), target.id, defaultLevel);
      const needed = xpForLevel(data.level + 1);
      const pct = Math.min(Math.floor((data.xp / needed) * 10), 10);
      const bar = "█".repeat(pct) + "░".repeat(10 - pct);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.leveling)
            .setTitle(`${sym()} Rank — ${target.username} ${sym()}`)
            .setDescription(
              `${LINE()}\n\n` +
              `⭐ **Level:** ${data.level}\n` +
              `✨ **XP:** ${data.xp.toLocaleString()} / ${needed.toLocaleString()}\n\n` +
              `Progress: \`${bar}\` ${Math.floor((data.xp / needed) * 100)}%\n\n` +
              `${LINE()}`
            )
            .setThumbnail(target.displayAvatarURL())
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
    }
    case "leaderboard":
    case "lb":
    case "levels": {
      const guild = message.guild;
      const entries: { uid: string; level: number; xp: number }[] = [];
      for (const [muid] of guild.members.cache) {
        const d = get<LevelData>(lKey(gid), muid, defaultLevel);
        if (d.xp > 0) entries.push({ uid: muid, level: d.level, xp: d.xp });
      }
      entries.sort((a, b) => b.xp - a.xp);
      return message.reply({ embeds: [buildLeaderboardEmbed(entries, guild.name)] });
    }
    case "setlevel": {
      if (!message.member?.permissions.has(BigInt(8))) return;
      const target = message.mentions.users.first();
      const level = parseInt(args[1] ?? "0", 10) || 0;
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a user!")] });
      const xp = xpForLevel(level);
      update<LevelData>(lKey(gid), target.id, (d) => ({ ...d, level, xp }), defaultLevel);
      return message.reply({ embeds: [aesthetic("📊 Level Set", `Set **${target.username}**'s level to **${level}**!`, COLORS.leveling)] });
    }
    default:
      break;
  }
}
