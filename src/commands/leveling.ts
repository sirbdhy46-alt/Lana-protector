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

function lKey(guildId: string) {
  return `levels:${guildId}`;
}

function gKey(guildId: string) {
  return `settings:${guildId}`;
}

export async function handleXp(message: Message) {
  if (!message.guild || message.author.bot) return;
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
    update<Level>(store, message.author.id, (l) => ({ ...l, level: newLevel }), defaultLevel);

    const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
    const levelCh = settings.levelChannel
      ? message.guild.channels.cache.get(settings.levelChannel)
      : message.channel;

    if (levelCh?.isTextBased()) {
      (levelCh as any).send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.leveling)
            .setTitle("⭐ Level Up!")
            .setDescription(
              `${rand(CUTE)} Congrats <@${message.author.id}>! You reached **Level ${newLevel}**!\n\n﹒✿﹒ Keep chatting to level up more!`
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      }).catch(() => {});
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

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.leveling)
            .setTitle(`⭐ ${target.username}'s Rank`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
              { name: "🏆 Level", value: lvl.level.toString(), inline: true },
              { name: "✨ XP", value: `${lvl.xp} / ${neededXp}`, inline: true },
              { name: "💬 Messages", value: lvl.messages.toString(), inline: true },
              { name: "📊 Progress", value: `\`${bar}\` ${Math.floor((lvl.xp / neededXp) * 100)}%`, inline: false }
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
        return `${m} <@${id}> — Level **${l.level}** (${l.xp} XP)`;
      }).join("\n");

      await message.reply({
        embeds: [lana("⭐ Level Leaderboard", list)],
      });
      break;
    }

    default:
      break;
  }
}
