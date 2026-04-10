import { type Message, type Client, EmbedBuilder } from "discord.js";
import { base, aesthetic, COLORS, rand, CUTE } from "../utils/embeds.js";
import { get, set } from "../data/storage.js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type EventConfig = {
  eventChannelId: string;
  announceChannelId: string;
};

function cfgKey(guildId: string) { return `eventcfg:${guildId}`; }

const DIVIDER = "✦ ·────────────────────────· ✦";

// ─── COMMANDS ─────────────────────────────────────────────────────────────────

export async function handleEvents(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const gid = message.guildId!;
  const isAdmin = message.member?.permissions.has(BigInt(0x8));

  // ── !seteventchannel #channel ─────────────────────────────────────────────
  if (cmd === "seteventchannel") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a channel! Example: `!seteventchannel #events`")] });
    const cfg = get<EventConfig>(cfgKey(gid), "data", { eventChannelId: "", announceChannelId: "" });
    set(cfgKey(gid), "data", { ...cfg, eventChannelId: channel.id });
    return message.reply({ embeds: [aesthetic("✅ Event Channel Set!", `Events will be posted in <#${channel.id}>!`, COLORS.success)] });
  }

  // ── !setannouncechannel #channel ──────────────────────────────────────────
  if (cmd === "setannouncechannel") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a channel! Example: `!setannouncechannel #announcements`")] });
    const cfg = get<EventConfig>(cfgKey(gid), "data", { eventChannelId: "", announceChannelId: "" });
    set(cfgKey(gid), "data", { ...cfg, announceChannelId: channel.id });
    return message.reply({ embeds: [aesthetic("✅ Announcement Channel Set!", `Announcements will be posted in <#${channel.id}>!`, COLORS.success)] });
  }

  // ── !event <title> | <description> | [date] | [prize] ────────────────────
  // Example: !event Game Night | Come join us for a fun game night! | Friday 9PM | Nitro
  if (cmd === "event") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });

    const cfg = get<EventConfig>(cfgKey(gid), "data", { eventChannelId: "", announceChannelId: "" });
    const targetChannelId = cfg.eventChannelId || message.channelId;
    const targetChannel = message.guild.channels.cache.get(targetChannelId);

    if (!targetChannel?.isTextBased()) {
      return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No event channel set! Use `!seteventchannel #channel` first.")] });
    }

    const fullText = message.content.slice(message.content.indexOf(" ") + 1);
    const parts = fullText.split("|").map(s => s.trim());
    const title = parts[0];
    const description = parts[1];
    const date = parts[2];
    const prize = parts[3];

    if (!title || !description) {
      return message.reply({
        embeds: [base(COLORS.error).setDescription(
          "❌ Usage: `!event <title> | <description> | [date] | [prize]`\n" +
          "Example: `!event Game Night | Come join us! | Friday 9PM | Nitro`"
        )],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.lana)
      .setTitle(`🎉 ${title}`)
      .setDescription(
        `${DIVIDER}\n\n` +
        `${description}\n\n` +
        `${DIVIDER}`
      )
      .setAuthor({ name: `Event by ${message.member?.displayName ?? message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    if (date) embed.addFields({ name: "📅 Date & Time", value: date, inline: true });
    if (prize) embed.addFields({ name: "🏆 Prize", value: prize, inline: true });
    embed.addFields({ name: "📌 Hosted by", value: `<@${message.author.id}>`, inline: true });

    await (targetChannel as any).send({ content: "@everyone", embeds: [embed] });

    if (targetChannelId !== message.channelId) {
      return message.reply({ embeds: [aesthetic("✅ Event Posted!", `Event announced in <#${targetChannelId}> with @everyone ping!`, COLORS.success)] });
    }
    return;
  }

  // ── !announce <message> ───────────────────────────────────────────────────
  if (cmd === "announce") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });

    const cfg = get<EventConfig>(cfgKey(gid), "data", { eventChannelId: "", announceChannelId: "" });
    const targetChannelId = cfg.announceChannelId || message.channelId;
    const targetChannel = message.guild.channels.cache.get(targetChannelId);

    if (!targetChannel?.isTextBased()) {
      return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No announcement channel set! Use `!setannouncechannel #channel` first.")] });
    }

    const text = args.join(" ").trim();
    if (!text) {
      return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!announce <your message here>`")] });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.lana)
      .setTitle("📢 Announcement")
      .setDescription(`${DIVIDER}\n\n${text}\n\n${DIVIDER}`)
      .setAuthor({ name: `${message.member?.displayName ?? message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    await (targetChannel as any).send({ content: "@everyone", embeds: [embed] });

    if (targetChannelId !== message.channelId) {
      return message.reply({ embeds: [aesthetic("✅ Announced!", `Announcement posted in <#${targetChannelId}> with @everyone ping!`, COLORS.success)] });
    }
    return;
  }
}
