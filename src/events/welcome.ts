import { type Client, Events, EmbedBuilder, GuildMember } from "discord.js";
import { get, defaultSettings, type GuildSettings } from "../data/storage.js";
import { COLORS, rand, CUTE } from "../utils/embeds.js";
import { getWelcomeGif, getWelcomeMessage, getLanaGif } from "../utils/gifs.js";

const WELCOME_BANNERS = [
  "✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦",
  "⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆ ⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆",
  "𖦹 ₊˚ 𖦹 ₊˚ 𖦹 ₊˚ 𖦹 ₊˚ 𖦹 ₊˚ 𖦹",
  "✿ ꕤ ✿ ꕤ ✿ ꕤ ✿ ꕤ ✿ ꕤ ✿ ꕤ ✿",
  "꩜ ˖ ꩜ ˖ ꩜ ˖ ꩜ ˖ ꩜ ˖ ꩜ ˖ ꩜",
  "◈ ─────────────── ◈ ─────────────── ◈",
  "✶ ⊹ ✶ ⊹ ✶ ⊹ ✶ ⊹ ✶ ⊹ ✶ ⊹ ✶",
];

const WELCOME_COLORS = [
  0xe8a0bf, 0xb9b4c7, 0xa78bfa, 0xf9a8d4, 0x93c5fd,
  0xc4b5fd, 0xfca5a5, 0x6ee7b7, 0xfcd34d, 0xfb7185,
];

const WELCOME_ICONS = ["🌸", "🌺", "✨", "💜", "🌙", "🌊", "🎶", "🌹", "💫", "🦋", "🌷", "⭐", "🎵", "🌼", "💐"];

const VIBES = [
  "sadcore girlie", "lana era", "dreamy soul", "aesthetic queen",
  "blue banisters babe", "honeymoon era", "born to die era", "ultraviolet spirit",
  "summertime sadness era", "chemtrails girlie", "nfr enthusiast",
];

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
    const welcomeGif = getWelcomeGif();
    const welcomeMsg = getWelcomeMessage();
    const banner = rand(WELCOME_BANNERS as any);
    const color = WELCOME_COLORS[Math.floor(Math.random() * WELCOME_COLORS.length)];
    const icon = WELCOME_ICONS[Math.floor(Math.random() * WELCOME_ICONS.length)];
    const vibe = VIBES[Math.floor(Math.random() * VIBES.length)];
    const ordinal = getOrdinal(memberCount);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${icon} welcome to ${member.guild.name} ${icon}`)
      .setDescription(
        `${banner}\n\n` +
        `hey ${member}! **${welcomeMsg}**\n\n` +
        `you are giving total **${vibe}** and we are HERE for it\n\n` +
        `${banner}\n\n` +
        `﹒✿﹒ read the rules first babe\n` +
        `﹒🌸﹒ go introduce yourself!\n` +
        `﹒💜﹒ pick your roles in self-roles\n` +
        `﹒✨﹒ chat & earn levels + coins!\n\n` +
        `${banner}`
      )
      .addFields(
        { name: `${icon} member`, value: `**${ordinal}** to join`, inline: true },
        { name: "✨ total members", value: `**${memberCount}**`, inline: true },
        { name: "💜 vibe check", value: `**${vibe}**`, inline: true },
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage(welcomeGif)
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿ | account created ${getAccountAge(member.user.createdAt)}` })
      .setTimestamp();

    const pingLines = [
      `🌸 ${member} just walked into the vibe !!`,
      `✨ everyone say hi to ${member} !!`,
      `💜 ${member} has entered the server era !!`,
      `🌙 ${member} showed up & we're obsessed !!`,
      `🎶 the music plays for ${member} !!`,
      `🌺 ${member} pulled up & we're NOT calm !!`,
    ];
    const pingMsg = pingLines[Math.floor(Math.random() * pingLines.length)];

    await (channel as any).send({
      content: pingMsg,
      embeds: [embed],
    }).catch(() => {});
  });

  client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const settings = get<GuildSettings>(`settings:${guildId}`, "data", defaultSettings);

    if (!settings.leaveChannel) return;

    const channel = member.guild.channels.cache.get(settings.leaveChannel);
    if (!channel?.isTextBased()) return;

    const goodbyeLines = [
      `they walked so we could run 💔`,
      `another one gone... the vibe shifts 🥀`,
      `we'll play summertime sadness in their honour 🎶`,
      `the blue banisters wave goodbye 💙`,
      `they were in their leaving era 💔`,
    ];

    const embed = new EmbedBuilder()
      .setColor(0x555577)
      .setTitle("💔 see you on the other side")
      .setDescription(
        `**${member.user.tag}** has left the building\n\n` +
        `${goodbyeLines[Math.floor(Math.random() * goodbyeLines.length)]}\n\n` +
        `we had **${member.guild.memberCount}** members. now one less 🥀`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(getLanaGif())
      .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
      .setTimestamp();

    await (channel as any).send({ embeds: [embed] }).catch(() => {});
  });
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getAccountAge(created: Date): string {
  const days = Math.floor((Date.now() - created.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
