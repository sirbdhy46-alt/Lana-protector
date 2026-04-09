import { type Message, EmbedBuilder, type TextChannel } from "discord.js";
import { get, set, del, getAll, type Giveaway } from "../data/storage.js";
import { COLORS, base, lana, rand, CUTE } from "../utils/embeds.js";

const STORE = "giveaways";

function parseTime(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (multipliers[unit] ?? 0);
}

export async function startGiveawayTimer(client: any) {
  setInterval(async () => {
    const all = getAll<Giveaway>(STORE);
    for (const [key, gw] of Object.entries(all)) {
      if (gw.ended) continue;
      if (Date.now() >= gw.endsAt) {
        await endGiveaway(client, key, gw);
      }
    }
  }, 15_000);
}

async function endGiveaway(client: any, key: string, gw: Giveaway) {
  try {
    const channel = await client.channels.fetch(gw.channelId).catch(() => null) as TextChannel | null;
    if (!channel) return;

    const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
    if (!msg) return;

    const reaction = msg.reactions.cache.get("🎉");
    const users = await reaction?.users.fetch().catch(() => null);
    const participants = users
      ? [...users.values()].filter((u: any) => !u.bot).map((u: any) => u.id)
      : gw.participants;

    let winners: string[] = [];
    if (participants.length > 0) {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      winners = shuffled.slice(0, gw.winnersCount);
    }

    set(STORE, key, { ...gw, ended: true, participants });

    const winnerText = winners.length > 0
      ? winners.map((id) => `<@${id}>`).join(", ")
      : "No valid participants";

    const embed = new EmbedBuilder()
      .setColor(COLORS.lana)
      .setTitle("🎉 Giveaway Ended!")
      .setDescription(
        `**Prize:** ${gw.prize}\n\n` +
        `**Winner(s):** ${winnerText}\n\n` +
        `**Hosted by:** <@${gw.hostId}>`
      )
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    await msg.edit({ embeds: [embed] }).catch(() => {});
    await channel.send({
      content: winners.length > 0 ? `🎉 Congrats ${winnerText}! You won **${gw.prize}**!` : "No winners — no valid participants.",
    });
  } catch (e) {
    console.error("Giveaway end error:", e);
  }
}

export async function handleGiveaway(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;
  const hasAdmin = message.member?.permissions.has(BigInt("8"));

  switch (cmd) {
    case "gstart": {
      if (!hasAdmin)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")] });

      const [timeStr, winnersStr, ...prizeArr] = args;
      const duration = parseTime(timeStr ?? "");
      const winners = parseInt(winnersStr ?? "1", 10) || 1;
      const prize = prizeArr.join(" ");

      if (!duration || !prize)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!gstart <time> <winners> <prize>`\nExample: `!gstart 1h 1 Nitro`")] });

      const endsAt = Date.now() + duration;

      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle("🎉 GIVEAWAY!")
        .setDescription(
          `**Prize:** ${prize}\n\n` +
          `React with 🎉 to enter!\n\n` +
          `**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n` +
          `**Winners:** ${winners}\n` +
          `**Hosted by:** ${message.author.tag}`
        )
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
        .setTimestamp(endsAt);

      await message.delete().catch(() => {});
      const gMsg = await message.channel.send({ embeds: [embed] });
      await gMsg.react("🎉");

      const key = `${message.guildId}:${gMsg.id}`;
      const giveaway: Giveaway = {
        channelId: message.channel.id,
        messageId: gMsg.id,
        prize,
        winnersCount: winners,
        endsAt,
        hostId: message.author.id,
        ended: false,
        participants: [],
      };
      set(STORE, key, giveaway);
      break;
    }

    case "gend": {
      if (!hasAdmin)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")] });

      const msgId = args[0];
      if (!msgId)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide the giveaway message ID!")] });

      const key = `${message.guildId}:${msgId}`;
      const gw = get<Giveaway>(STORE, key, null as any);
      if (!gw)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Giveaway not found!")] });

      await endGiveaway(message.client, key, gw);
      await message.reply({ embeds: [lana("✅ Giveaway Ended", "The giveaway has been ended early!")] });
      break;
    }

    case "greroll": {
      if (!hasAdmin)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")] });

      const msgId = args[0];
      if (!msgId)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide the giveaway message ID!")] });

      const key = `${message.guildId}:${msgId}`;
      const gw = get<Giveaway>(STORE, key, null as any);
      if (!gw || !gw.ended)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Giveaway not found or still running!")] });

      const newWinner = gw.participants[Math.floor(Math.random() * gw.participants.length)];
      if (!newWinner)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No participants to reroll!")] });

      await message.channel.send({
        embeds: [lana("🎉 Rerolled!", `New winner: <@${newWinner}>! Congrats on winning **${gw.prize}**!`)],
      });
      break;
    }

    default:
      break;
  }
}
