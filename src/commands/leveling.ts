import { type Message, EmbedBuilder } from "discord.js";
import {
  get,
  set,
  update,
  getAll,
  defaultLevel,
  defaultSettings,
  type Level,
  type GuildSettings,
} from "../data/storage.js";
import { COLORS, base, lana, rand, CUTE, xpForLevel } from "../utils/embeds.js";

const LEVELUP_MESSAGES = [
  "you're leveling up like it's your era 🌸",
  "the vibe is ASCENDING 💜",
  "born to level up, baby 🎶",
  "summertime gains hitting different ✨",
  "the blue banisters of progress 💙",
  "you're in your leveling era 🌙",
  "lana would be SO proud rn ✿",
  "ultraviolet grind 💫",
  "honeymoon phase complete, new level unlocked 🌺",
  "this is what winning looks like 🌸",
];

const LEVEL_MILESTONES: Record<number, string> = {
  5:  "🌱 seedling — welcome to the journey",
  10: "🌸 blooming — you're finding your vibe",
  15: "🌊 summertime — the sadness left, the gains stayed",
  20: "🎶 ride — going places, honey",
  25: "💜 born to die — iconic mid-era moment",
  30: "✨ ultraviolence — serving looks and XP",
  40: "🌙 honeymoon — living in a dream",
  50: "💫 lust for life — halfway to legend",
  60: "🌺 love — in full bloom",
  70: "🎵 chemtrails — leaving your mark on the sky",
  80: "💙 blue banisters — the deep cuts era",
  90: "🌟 tunnel of love — almost there",
  100: "👑 PARADISE — you are the main character. the bot bows.",
};

function lKey(guildId: string) {
  return `levels:${guildId}`;
}

function gKey(guildId: string) {
  return `settings:${guildId}`;
}

export async function handleXp(message: Message) {
  if (!message.guild || message.author.bot) return;

  const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);

  const store = lKey(message.guildId!);
  const now = Date.now();

  const lvl = get<Level>(store, message.author.id, defaultLevel);
  if (now - lvl.lastXp < 60_000) return;

  const xpGain = 15 + Math.floor(Math.random() * 10);
  const updated = update<Level>(
    store,
    message.author.id,
    (l) => ({
      ...l,
      xp: l.xp + xpGain,
      messages: l.messages + 1,
      lastXp: now,
    }),
    defaultLevel
  );

  const neededXp = xpForLevel(updated.level + 1);
  if (updated.xp >= neededXp) {
    const newLevel = updated.level + 1;
    update<Level>(store, message.author.id, (l) => ({ ...l, level: newLevel, xp: 0 }), defaultLevel);

    if (!settings.levelChannel) return;

    const levelCh = message.guild.channels.cache.get(settings.levelChannel);
    if (!levelCh?.isTextBased()) return;

    const milestone = LEVEL_MILESTONES[newLevel];
    const levelUpMsg = LEVELUP_MESSAGES[Math.floor(Math.random() * LEVELUP_MESSAGES.length)];

    const embed = new EmbedBuilder()
      .setColor(newLevel >= 100 ? 0xffd700 : newLevel >= 50 ? 0xa78bfa : COLORS.leveling)
      .setTitle(newLevel >= 100 ? "👑 LEVEL 100 — PARADISE REACHED" : `⭐ Level Up — Level ${newLevel}!`)
      .setDescription(
        `${rand(CUTE)} ${message.author} **${levelUpMsg}**\n\n` +
        (milestone ? `✦ **${milestone}**\n\n` : "") +
        `﹒✿﹒ keep chatting to climb higher!`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: "🏆 new level", value: `**${newLevel}**`, inline: true },
        { name: "📊 next level xp", value: `**${xpForLevel(newLevel + 1)}**`, inline: true },
        { name: "💬 total messages", value: `**${updated.messages}**`, inline: true },
      )
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    if (newLevel >= 100) {
      embed.setImage("https://media.tenor.com/wj3G0HnMgesAAAAC/party-celebrate.gif");
    }

    await (levelCh as any).send({
      content: newLevel >= 50 ? `🎉 ${message.author} **milestone reached!!**` : undefined,
      embeds: [embed],
    }).catch(() => {});

    if (settings.levelroles?.[newLevel]) {
      const role = message.guild.roles.cache.get(settings.levelroles[newLevel]);
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (role && member) await member.roles.add(role).catch(() => {});
    }
  }
}

export async function handleLeveling(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;

  switch (cmd) {
    case "rank":
    case "level": {
      const target = message.mentions.users.first() ?? message.author;
      const store = lKey(message.guildId!);
      const lvl = get<Level>(store, target.id, defaultLevel);
      const neededXp = xpForLevel(lvl.level + 1);
      const progress = Math.floor((lvl.xp / neededXp) * 10);
      const bar = "█".repeat(progress) + "░".repeat(10 - progress);
      const milestone = LEVEL_MILESTONES[lvl.level];
      const percent = Math.floor((lvl.xp / neededXp) * 100);

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(lvl.level >= 100 ? 0xffd700 : lvl.level >= 50 ? 0xa78bfa : COLORS.leveling)
            .setTitle(`⭐ ${target.username}'s Level Card`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(milestone ? `✦ *${milestone}*` : null)
            .addFields(
              { name: "🏆 Level", value: `**${lvl.level}**`, inline: true },
              { name: "✨ XP", value: `**${lvl.xp}** / ${neededXp}`, inline: true },
              { name: "💬 Messages", value: `**${lvl.messages}**`, inline: true },
              { name: "📊 Progress", value: `\`${bar}\` **${percent}%**`, inline: false },
            )
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
            .setTimestamp(),
        ],
      });
      break;
    }

    case "leaderboard":
    case "lb": {
      if (args[0]?.toLowerCase() !== "levels") break;
      const store = lKey(message.guildId!);
      const all = getAll<Level>(store);
      const sorted = Object.entries(all)
        .sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp)
        .slice(0, 10);

      if (sorted.length === 0)
        return message.reply({ embeds: [base(COLORS.info as any).setDescription("No level data yet!")] });

      const medals = ["🥇", "🥈", "🥉"];
      const list = sorted.map(([id, l], i) => {
        const m = medals[i] ?? `**${i + 1}.**`;
        const milestone = LEVEL_MILESTONES[l.level] ? ` — *${LEVEL_MILESTONES[l.level].split("—")[0].trim()}*` : "";
        return `${m} <@${id}> — Level **${l.level}** (${l.xp} XP)${milestone}`;
      }).join("\n");

      await message.reply({
        embeds: [lana("⭐ Level Leaderboard", list)],
      });
      break;
    }

    case "setlevel": {
      if (!message.member?.permissions.has("ManageGuild")) {
        return message.reply({ embeds: [base(COLORS.error as any).setDescription("❌ You need **Manage Server** to use this.")] });
      }
      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);

      if (args[0]?.toLowerCase() === "off" || args[0]?.toLowerCase() === "disable") {
        set<GuildSettings>(gKey(message.guildId!), "data", { ...settings, levelChannel: "" });
        return message.reply({ embeds: [base(COLORS.success as any).setDescription("✅ Level-up notifications **disabled**. No channel will receive them.")] });
      }

      const ch = message.mentions.channels.first() ?? message.guild.channels.cache.get(args[0]);
      if (!ch || !ch.isTextBased()) {
        return message.reply({ embeds: [base(COLORS.error as any).setDescription("❌ Please mention a valid text channel.\n\nUsage: `!setlevel #channel` or `!setlevel off`")] });
      }

      set<GuildSettings>(gKey(message.guildId!), "data", { ...settings, levelChannel: ch.id });
      return message.reply({ embeds: [base(COLORS.success as any).setDescription(`✅ Level-up notifications will now **only** appear in ${ch}!\n\nTip: Use \`!setlevel off\` to disable them completely.`)] });
    }

    default:
      break;
  }
}
