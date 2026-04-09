import { type Client, Events, EmbedBuilder, GuildMember } from "discord.js";
import { get, defaultSettings, type GuildSettings } from "../data/storage.js";
import { COLORS, rand, CUTE } from "../utils/embeds.js";
import { getLanaGif } from "../utils/gifs.js";

export function registerWelcomeHandlers(client: Client) {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const settings = get<GuildSettings>(`settings:${guildId}`, "data", defaultSettings);

    if (settings.memberRole) {
      const role = member.guild.roles.cache.get(settings.memberRole);
      if (role) await member.roles.add(role).catch(() => {});
    }

    if (!settings.welcomeChannel) return;

    const channel = member.guild.channels.cache.get(settings.welcomeChannel);
    if (!channel?.isTextBased()) return;

    const memberCount = member.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(COLORS.lana)
      .setTitle(`🌸 Welcome to ${member.guild.name}! 🌸`)
      .setDescription(
        `◈ ─────────────────────── ◈\n\n` +
        `Hey ${member}! We're so glad you're here 💜\n\n` +
        `﹒⟡﹒ Read the rules to get started\n` +
        `﹒✿﹒ Introduce yourself in introductions!\n` +
        `﹒♡﹒ This is a Lana Del Dey server — good vibes only\n\n` +
        `You are member **#${memberCount}**! 🎉\n\n` +
        `◈ ─────────────────────── ◈`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage(getLanaGif())
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    await (channel as any).send({
      content: `Welcome ${member}! 🌸`,
      embeds: [embed],
    }).catch(() => {});
  });

  client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const settings = get<GuildSettings>(`settings:${guildId}`, "data", defaultSettings);

    if (!settings.leaveChannel) return;

    const channel = member.guild.channels.cache.get(settings.leaveChannel);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x555555)
      .setTitle("👋 Goodbye!")
      .setDescription(
        `◈ ─────────────────────── ◈\n\n` +
        `**${member.user.tag}** has left the server.\n\n` +
        `We'll miss you! 💔\n\n` +
        `◈ ─────────────────────── ◈`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    await (channel as any).send({ embeds: [embed] }).catch(() => {});
  });
}
