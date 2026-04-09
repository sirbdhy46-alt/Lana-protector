import {
  type Message,
  type Client,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  type TextChannel,
  type Guild,
  REST,
  Routes,
} from "discord.js";
import { get, set, defaultSettings, type GuildSettings } from "../data/storage.js";
import { COLORS, base, lana, rand, CUTE, SYM } from "../utils/embeds.js";
import { getLanaGif } from "../utils/gifs.js";
import {
  TEMPLATES,
  getTemplate,
  templateListEmbed,
  type ServerTemplate,
} from "../data/templates.js";

function gKey(guildId: string) {
  return `settings:${guildId}`;
}

const CRAZY = ["⟡", "✿", "♡", "⊹", "✶", "❀", "★", "◎", "⭔", "ʬ", "✦", "◈", "❋", "⌖", "⍣", "⌘", "⎊", "⎈"];
const LINES = [
  "◈ ─────────────────────── ◈",
  "✦ ─────────────────────── ✦",
  "❋ ─────────────────────── ❋",
  "⟡ ─────────────────────── ⟡",
  "✿ ─────────────────────── ✿",
  "♡ ─────────────────────── ♡",
];
function cLine() { return LINES[Math.floor(Math.random() * LINES.length)]!; }
function cSym() { return CRAZY[Math.floor(Math.random() * CRAZY.length)]!; }

function rulesText(t: ServerTemplate) {
  return [
    cLine(),
    `${t.emoji} ﹒**RULES**﹒ ${t.emoji}`,
    cLine(),
    "",
    `﹒${cSym()}﹒ **1. Be respectful**`,
    "Treat everyone with kindness. No harassment, hate speech, or discrimination.",
    "",
    `﹒${cSym()}﹒ **2. No spam or flooding**`,
    "Don't spam messages, emojis, or mentions. Keep it chill.",
    "",
    `﹒${cSym()}﹒ **3. Keep it SFW**`,
    "This is a safe space. No NSFW content anywhere.",
    "",
    `﹒${cSym()}﹒ **4. No self‑promotion**`,
    "Don't advertise servers or products without permission.",
    "",
    `﹒${cSym()}﹒ **5. English in main channels**`,
    "Keep main channels in English so everyone can follow.",
    "",
    `﹒${cSym()}﹒ **6. No drama**`,
    "Leave the drama at the door. Good vibes only.",
    "",
    `﹒${cSym()}﹒ **7. Follow Discord ToS**`,
    "You must be 13+ and follow Discord's Terms of Service.",
    "",
    `﹒${cSym()}﹒ **8. Respect the mods**`,
    "Mod decisions are final. No arguing in public channels.",
    "",
    `﹒${cSym()}﹒ **9. No doxxing**`,
    "Never share personal information about anyone.",
    "",
    `﹒${t.emoji}﹒ **10. Have fun!**`,
    `This server runs on **Lana Del Dey** energy. Enjoy ${t.emoji}`,
    "",
    cLine(),
    "*By being here you agree to these rules.*",
    cLine(),
  ].join("\n");
}

function infoText(guildName: string, t: ServerTemplate) {
  return [
    cLine(),
    `${t.emoji} ﹒**ABOUT ${guildName.toUpperCase()}**﹒ ${t.emoji}`,
    cLine(),
    "",
    `Welcome to a server running on **Lana Del Dey** energy 💜`,
    "",
    `Theme﹒${cSym()}﹒ **${t.name}** — *${t.vibe}*`,
    "",
    `This community loves:`,
    `﹒${cSym()}﹒ Good music and aesthetics`,
    `﹒${cSym()}﹒ Chilling and making friends`,
    `﹒${cSym()}﹒ Giveaways and fun events`,
    `﹒${cSym()}﹒ Sharing art, music, and creativity`,
    "",
    `Use **!help** to see all bot commands.`,
    `Use **!setup list** to see all 10 server themes.`,
    `Use **!onboard** to set up Discord onboarding.`,
    "",
    cLine(),
  ].join("\n");
}

function welcomeGuideText(t: ServerTemplate) {
  return [
    cLine(),
    `${t.emoji} ﹒**NEW HERE?**﹒ ${t.emoji}`,
    cLine(),
    "",
    "Here's how to get started:",
    "",
    `﹒${cSym()}﹒ Read **#rules** first!`,
    `﹒${cSym()}﹒ Introduce yourself in **#introductions**`,
    `﹒${cSym()}﹒ Use bot commands in **#bot-commands**`,
    `﹒${cSym()}﹒ Start chatting in **#general**`,
    "",
    "Bot prefix is **!** — type **!help** to see all commands.",
    "",
    cLine(),
  ].join("\n");
}

async function enableCommunity(guild: Guild, rulesId: string, updatesId: string, token: string) {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.patch(Routes.guild(guild.id), {
      body: {
        features: [...(guild.features ?? []).filter((f: string) => f !== "COMMUNITY"), "COMMUNITY"],
        verification_level: 1,
        explicit_content_filter: 2,
        rules_channel_id: rulesId,
        public_updates_channel_id: updatesId,
        preferred_locale: "en-US",
      },
      reason: "Lana Del Dey Bot — enabling community mode",
    });
    return true;
  } catch (e: any) {
    console.error("Community mode error:", e?.message ?? e);
    return false;
  }
}

async function setupOnboarding(
  guild: Guild,
  channels: { rules?: string; general?: string; announcements?: string; intro?: string; lana?: string; giveaway?: string; bot?: string },
  roles: { member?: string; vip?: string; booster?: string },
  token: string
) {
  const rest = new REST({ version: "10" }).setToken(token);
  const defaultChannels = [
    channels.general,
    channels.announcements,
    channels.intro,
    channels.lana,
  ].filter(Boolean) as string[];

  try {
    await rest.put(Routes.guildOnboarding(guild.id), {
      body: {
        enabled: true,
        mode: 0,
        default_channel_ids: defaultChannels.slice(0, 5),
        prompts: [
          {
            type: 0,
            in_onboarding: true,
            required: false,
            single_select: true,
            title: `${cSym()} Why are you here?`,
            options: [
              {
                title: "Lana Del Dey Fan 🌹",
                description: "I love Lana's music, lyrics & aesthetic",
                emoji: { name: "🌹" },
                role_ids: [],
                channel_ids: [channels.lana].filter(Boolean),
              },
              {
                title: "Here to vibe ✨",
                description: "Good energy, chill people, aesthetic server",
                emoji: { name: "✨" },
                role_ids: [],
                channel_ids: [channels.general].filter(Boolean),
              },
              {
                title: "Event & giveaway lover 🎉",
                description: "I'm here for the giveaways and fun events",
                emoji: { name: "🎉" },
                role_ids: [],
                channel_ids: [channels.giveaway].filter(Boolean),
              },
              {
                title: "I make edits & art 🎨",
                description: "I love creating and sharing Lana edits",
                emoji: { name: "🎨" },
                role_ids: [],
                channel_ids: [],
              },
            ],
          },
          {
            type: 0,
            in_onboarding: true,
            required: false,
            single_select: false,
            title: `${cSym()} Pick your vibe`,
            options: [
              {
                title: "Music lover 🎵",
                description: "I live for the music",
                emoji: { name: "🎵" },
                role_ids: [],
                channel_ids: [],
              },
              {
                title: "Aesthetic mode 🌸",
                description: "Soft, dreamy, and cottagecore",
                emoji: { name: "🌸" },
                role_ids: [],
                channel_ids: [],
              },
              {
                title: "Dark academia 🖤",
                description: "Moody, poetic, intellectual",
                emoji: { name: "🖤" },
                role_ids: [],
                channel_ids: [],
              },
              {
                title: "Chaotic ⚡",
                description: "I just vibe and cause problems",
                emoji: { name: "⚡" },
                role_ids: [],
                channel_ids: [],
              },
            ],
          },
          {
            type: 0,
            in_onboarding: true,
            required: false,
            single_select: true,
            title: `${cSym()} Favourite Lana Era?`,
            options: [
              { title: "Born To Die 🥀", description: "The classic era", emoji: { name: "🥀" }, role_ids: [], channel_ids: [] },
              { title: "Ultraviolence ⚡", description: "Dark and electric", emoji: { name: "⚡" }, role_ids: [], channel_ids: [] },
              { title: "Honeymoon 🍯", description: "Golden and romantic", emoji: { name: "🍯" }, role_ids: [], channel_ids: [] },
              { title: "NFR 🌿", description: "California indie folk", emoji: { name: "🌿" }, role_ids: [], channel_ids: [] },
              { title: "Chemtrails / BB / Tunnel 🌊", description: "The later era", emoji: { name: "🌊" }, role_ids: [], channel_ids: [] },
            ],
          },
        ],
      },
    });
    return true;
  } catch (e: any) {
    console.error("Onboarding error:", e?.message ?? e);
    return false;
  }
}

async function postChannelMessages(
  channels: Record<string, TextChannel | null>,
  settings: GuildSettings,
  guild: Guild,
  t: ServerTemplate
) {
  const footer = `${rand(CUTE)} lana del dey bot ✿ ${t.emoji}`;

  if (channels.rules) {
    await channels.rules.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle(`${t.emoji} Server Rules ${t.emoji}`)
          .setDescription(rulesText(t))
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.info) {
    await channels.info.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle(`${t.emoji} About This Server`)
          .setDescription(infoText(guild.name, t))
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.welcome) {
    await channels.welcome.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle(`${t.emoji} Welcome Channel ${t.emoji}`)
          .setDescription(
            `${cLine()}\n\nThis is where new members are greeted! ${t.emoji}\n\n﹒${cSym()}﹒ Admins: use \`!setwelcome\` to customise the welcome message\n\n${cLine()}`
          )
          .setImage(getLanaGif())
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.help) {
    await channels.help.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle("❓ Help Center")
          .setDescription(welcomeGuideText(t))
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.giveaway) {
    await channels.giveaway.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle("🎉 Giveaway Channel")
          .setDescription(
            `${cLine()}\n\nGiveaways drop here! 🎉\n\n﹒${cSym()}﹒ Use \`!gstart <time> <winners> <prize>\`\n﹒${cSym()}﹒ React 🎉 to enter\n﹒${cSym()}﹒ Use \`!gend <id>\` to end early\n\n${cLine()}`
          )
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.lana) {
    await channels.lana.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle(`${t.emoji} Lana Del Dey Corner`)
          .setDescription(
            `${cLine()}\n\n🌹 This space is for **Lana Del Dey** 🌹\n\n﹒${cSym()}﹒ Talk about her music and aesthetic\n﹒${cSym()}﹒ Share edits in **lana-media**\n﹒${cSym()}﹒ Drop lyrics in **lana-lyrics**\n﹒${cSym()}﹒ Use \`!quote\` for a Lana quote!\n\n${cLine()}`
          )
          .setImage(getLanaGif())
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  if (channels.starboard) {
    await channels.starboard.send({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle("⭐ Starboard")
          .setDescription(
            `${cLine()}\n\nMessages that get **${settings.starboardMin} ⭐** reactions appear here!\n\n﹒${cSym()}﹒ Star the best messages to feature them!\n\n${cLine()}`
          )
          .setFooter({ text: footer })
          .setTimestamp(),
      ],
    }).catch(() => {});
  }
}

export async function handleSetup(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;
  const hasPerms = message.member?.permissions.has(PermissionFlagsBits.Administrator);

  if (!hasPerms) {
    return message.reply({
      embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")],
    });
  }

  if (args[0]?.toLowerCase() === "list") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.lana)
          .setTitle(`${cSym()} Server Templates ${cSym()} Pick Your Aesthetic!`)
          .setDescription(templateListEmbed())
          .setFooter({ text: `${rand(CUTE)} Use: !setup <template> confirm` })
          .setTimestamp(),
      ],
    });
  }

  const templateArg = args.length >= 2 ? args[0] : "classic";
  const confirmArg = args.length >= 2 ? args[1] : args[0];

  if (confirmArg?.toLowerCase() !== "confirm") {
    const t = getTemplate(templateArg) ?? TEMPLATES.classic!;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(t.primaryColor)
          .setTitle(`${t.emoji} Auto Server Setup — ${t.name}`)
          .setDescription(
            `${cLine()}\n\n` +
            `This will:\n\n` +
            `﹒🗑️ **Delete all channels** (your current channel is preserved)\n` +
            `﹒🎭 **Keep all existing roles** — new aesthetic roles will be added\n` +
            `﹒${t.emoji} Create **${t.name}** themed channels\n` +
            `﹒📜 Auto-post rules, info, welcome, and help messages\n` +
            `﹒🌐 Enable Discord Community mode\n` +
            `﹒✨ Set up onboarding, starboard & tickets\n\n` +
            `**Template vibe:** *${t.description}*\n\n` +
            `Type \`!setup ${templateArg} confirm\` to proceed.\n\n` +
            `> ⚠️ Channels will be deleted. Roles are **kept**. Type \`!setup list\` to see all templates.\n\n` +
            `${cLine()}`
          )
          .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
          .setTimestamp(),
      ],
    });
  }

  const template = getTemplate(templateArg) ?? TEMPLATES.classic!;
  const guild = message.guild;
  const commandChannelId = message.channel.id;

  const progressMsg = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(template.primaryColor)
        .setTitle(`${template.emoji} Setting Up: ${template.name}`)
        .setDescription(`${cLine()}\nStarting setup... please wait ✨\n${cLine()}`)
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
    ],
  });

  const editProgress = (step: string, detail: string) =>
    progressMsg.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(template.primaryColor)
          .setTitle(`${template.emoji} ${step}`)
          .setDescription(`${cLine()}\n${detail}\n${cLine()}`)
          .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
      ],
    }).catch(() => {});

  await editProgress("Step 1/6 — Deleting old channels...", "Removing all channels except this one...");

  const allChannels = [...guild.channels.cache.values()].filter(
    (ch) => ch.id !== commandChannelId
  );
  for (const ch of allChannels) {
    await ch.delete().catch(() => {});
    await new Promise((r) => setTimeout(r, 250));
  }

  await editProgress("Step 2/6 — Creating roles...", "Adding new aesthetic roles (existing roles are kept!) ✿");

  const rn = template.roleNames;
  const rc = template.roleColors;

  const ownerRole = await guild.roles.create({ name: rn.owner, color: rc.owner, hoist: true, mentionable: false, permissions: [PermissionFlagsBits.Administrator], position: 99 }).catch(() => null);
  const adminRole = await guild.roles.create({ name: rn.admin, color: rc.admin, hoist: true, mentionable: true, permissions: [PermissionFlagsBits.Administrator] }).catch(() => null);
  const modRole = await guild.roles.create({ name: rn.mod, color: rc.mod, hoist: true, mentionable: true, permissions: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageChannels] }).catch(() => null);
  const vipRole = await guild.roles.create({ name: rn.vip, color: rc.vip, hoist: true, mentionable: true }).catch(() => null);
  const boosterRole = await guild.roles.create({ name: rn.booster, color: rc.booster, hoist: true, mentionable: true }).catch(() => null);
  const memberRole = await guild.roles.create({ name: rn.member, color: rc.member, hoist: false, mentionable: false }).catch(() => null);
  const jailedRole = await guild.roles.create({ name: rn.jailed, color: rc.jailed, hoist: false, mentionable: false, permissions: [] }).catch(() => null);

  await editProgress("Step 3/6 — Creating channels...", "Building aesthetic channel structure ✨");

  const s = template.catSymbols;
  const p = template.channelPrefix;
  const everyone = guild.id;
  const jId = jailedRole?.id ?? "";

  const denyAll = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory];
  const jailDeny = jId ? [{ id: jId, deny: denyAll }] : [];
  const readOnly = [{ id: everyone, deny: [PermissionFlagsBits.SendMessages] }, ...jailDeny];
  const staffOnly = [
    { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
    ...(adminRole ? [{ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
    ...(modRole ? [{ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
  ];

  const mkCat = (name: string, perms = jailDeny) =>
    guild.channels.create({ name, type: ChannelType.GuildCategory, permissionOverwrites: perms }).catch(() => null);
  const mkText = (name: string, parent: string | undefined, topic: string, perms?: any[]) =>
    guild.channels.create({ name, type: ChannelType.GuildText, parent, topic, ...(perms ? { permissionOverwrites: perms } : {}) }).catch(() => null);

  const catInfo = await mkCat(`${s.info} information`, readOnly);
  const rulesChannel = await mkText(`${p}✿${p}rules`, catInfo?.id, "Read the rules before chatting!", readOnly);
  const infoChannel = await mkText(`${p}◎${p}info`, catInfo?.id, "About this server", readOnly);
  const announcementsChannel = await mkText(`${p}📢${p}announcements`, catInfo?.id, "Important announcements", readOnly);
  const rolesChannel = await mkText(`${p}🎭${p}roles`, catInfo?.id, "Self assignable roles", readOnly);

  const catWelcome = await mkCat(`${s.welcome} welcome`);
  const welcomeChannel = await mkText(`${p}🌸${p}welcome`, catWelcome?.id, "Welcome new members!", readOnly);
  const goodbyeChannel = await mkText(`${p}👋${p}goodbye`, catWelcome?.id, "We'll miss you!", readOnly);
  const introChannel = await mkText(`${p}👤${p}introductions`, catWelcome?.id, "Introduce yourself!");

  const catChat = await mkCat(`${s.general} general`);
  const generalChannel = await mkText(`${p}💬${p}general`, catChat?.id, "General chit chat ✿");
  const mediaChannel = await mkText(`${p}🖼️${p}media`, catChat?.id, "Share images, art, and media");
  const botChannel = await mkText(`${p}🤖${p}bot-commands`, catChat?.id, "Use bot commands here!");

  const catLana = await mkCat(`${s.lana} lana del dey`);
  const lanaChat = await mkText(`${p}🌹${p}lana-chat`, catLana?.id, "Talk about Lana Del Dey!");
  const lanaMedia = await mkText(`${p}✨${p}lana-media`, catLana?.id, "Lana Del Dey edits, photos & gifs");
  const lanaLyrics = await mkText(`${p}🎵${p}lana-lyrics`, catLana?.id, "Share your fave Lana Del Dey lyrics");

  const catFun = await mkCat(`${s.fun} fun`);
  const memeChannel = await mkText(`${p}😂${p}memes`, catFun?.id, "Memes and laughs ✿");
  const countingChannel = await mkText(`${p}🔢${p}counting`, catFun?.id, "Count as high as possible!");
  const confessChannel = await mkText(`${p}🤫${p}confessions`, catFun?.id, "Use !confess to send anonymous confessions");
  const aestheticChannel = await mkText(`${p}✨${p}aesthetic`, catFun?.id, "Aesthetic pics and vibes only");

  const catEvents = await mkCat(`${s.events} events`);
  const giveawayChannel = await mkText(`${p}🎉${p}giveaways`, catEvents?.id, "Giveaways and prizes!", readOnly);
  const eventsChannel = await mkText(`${p}📅${p}events`, catEvents?.id, "Upcoming server events!", readOnly);
  const starboardChannel = await mkText(`${p}⭐${p}starboard`, catEvents?.id, "Best messages get featured here!", readOnly);

  const catSupport = await mkCat(`${s.support} support`);
  const helpChannel = await mkText(`${p}❓${p}help`, catSupport?.id, "Ask for help here!");
  const suggestionChannel = await mkText(`${p}💡${p}suggestions`, catSupport?.id, "Suggest improvements!");
  const ticketCat = await mkCat(`${s.support} tickets`, staffOnly);

  const catLogs = await mkCat(`${s.logs} logs`, staffOnly);
  const logsChannel = await mkText(`${p}📋${p}mod-logs`, catLogs?.id, "Moderation action logs", staffOnly);
  const msgLogs = await mkText(`${p}📝${p}message-logs`, catLogs?.id, "Message edit & delete logs", staffOnly);

  const jailChannel = await guild.channels.create({
    name: `${p}🔒${p}jail`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
      ...(jId ? [{ id: jId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
      ...(modRole ? [{ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
    ],
    topic: "Jailed members go here.",
  }).catch(() => null);

  await editProgress("Step 4/6 — Moving your channel...", "Putting the command channel in the right place ✿");

  const commandChannel = guild.channels.cache.get(commandChannelId);
  if (commandChannel && catChat) {
    await commandChannel.setParent(catChat.id).catch(() => {});
    await (commandChannel as TextChannel).setName(`${p}🤖${p}setup-here`).catch(() => {});
  }

  await editProgress("Step 5/6 — Saving settings & posting messages...", "Saving IDs and auto-posting channel content...");

  const settings: GuildSettings = {
    prefix: "!",
    welcomeChannel: welcomeChannel?.id ?? "",
    leaveChannel: goodbyeChannel?.id ?? "",
    logsChannel: logsChannel?.id ?? "",
    levelChannel: generalChannel?.id ?? "",
    jailChannel: jailChannel?.id ?? "",
    starboardChannel: starboardChannel?.id ?? "",
    ticketCategory: ticketCat?.id ?? "",
    badwords: [],
    antispam: true,
    levelroles: {},
    jailedRole: jailedRole?.id ?? "",
    memberRole: memberRole?.id ?? "",
    starboardMin: 3,
    template: template.id,
  };

  set(gKey(guild.id), "data", settings);

  await postChannelMessages(
    {
      rules: rulesChannel as TextChannel | null,
      info: infoChannel as TextChannel | null,
      welcome: welcomeChannel as TextChannel | null,
      help: helpChannel as TextChannel | null,
      giveaway: giveawayChannel as TextChannel | null,
      lana: lanaChat as TextChannel | null,
      starboard: starboardChannel as TextChannel | null,
    },
    settings,
    guild,
    template
  );

  await editProgress("Step 6/6 — Enabling Community & Onboarding...", "Enabling Community mode and setting up Discord onboarding...");

  const token = process.env["DISCORD_TOKEN"]!;
  const communityOk = await enableCommunity(
    guild,
    rulesChannel?.id ?? "",
    announcementsChannel?.id ?? "",
    token
  );

  let onboardOk = false;
  if (communityOk) {
    onboardOk = await setupOnboarding(
      guild,
      {
        rules: rulesChannel?.id,
        general: generalChannel?.id,
        announcements: announcementsChannel?.id,
        intro: introChannel?.id,
        lana: lanaChat?.id,
        giveaway: giveawayChannel?.id,
        bot: botChannel?.id,
      },
      {
        member: memberRole?.id,
        vip: vipRole?.id,
        booster: boosterRole?.id,
      },
      token
    );
  }

  await progressMsg.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(template.primaryColor)
        .setTitle(`${template.emoji} Setup Complete! — ${template.name}`)
        .setDescription(
          `${cLine()}\n\n` +
          `Your server has been rebuilt with the **${template.name}** theme! ${template.emoji}\n\n` +
          `**Channels created:**\n` +
          `﹒${cSym()}﹒ Rules, Info, Announcements, Roles\n` +
          `﹒${cSym()}﹒ Welcome, Goodbye, Introductions\n` +
          `﹒${cSym()}﹒ General, Media, Bot Commands\n` +
          `﹒${cSym()}﹒ Lana Chat, Media, Lyrics\n` +
          `﹒${cSym()}﹒ Memes, Counting, Confessions, Aesthetic\n` +
          `﹒${cSym()}﹒ Giveaways, Events, Starboard ⭐\n` +
          `﹒${cSym()}﹒ Help, Suggestions, Tickets 🎫\n` +
          `﹒${cSym()}﹒ Jail, Mod Logs, Message Logs (staff only)\n\n` +
          `**Roles created:** ${rn.owner} ${rn.admin} ${rn.mod} ${rn.vip} ${rn.booster} ${rn.member} ${rn.jailed}\n` +
          `*(Your existing roles were kept!)*\n\n` +
          `**Community Mode:** ${communityOk ? "✅ Enabled" : "⚠️ Needs manual enable (Server Settings → Enable Community)"}\n` +
          `**Onboarding:** ${onboardOk ? "✅ Configured with 3 prompts!" : communityOk ? "⚠️ Use `!onboard` to retry" : "⚠️ Enable Community mode first, then use `!onboard`"}\n\n` +
          `**Your channel** was preserved and moved to General ✿\n\n` +
          `Use \`!setup list\` to switch themes • \`!onboard\` to reconfigure onboarding\n\n` +
          `${cLine()}`
        )
        .setImage(getLanaGif())
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿ ${template.emoji}` })
        .setTimestamp(),
    ],
  }).catch(() => {});
}

export async function handleOnboard(message: Message) {
  if (!message.guild) return;
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")] });
  }

  const guild = message.guild;
  const gId = guild.id;
  const settings = get<GuildSettings>(gKey(gId), "data", defaultSettings);

  const progressMsg = await message.reply({
    embeds: [lana(`${cSym()} Setting Up Onboarding...`, "Enabling Community mode and configuring Discord onboarding ✨")],
  });

  const token = process.env["DISCORD_TOKEN"]!;

  const rulesChannel = settings.logsChannel
    ? null
    : guild.channels.cache.find(c => c.name.includes("rules") && c.isTextBased());
  const announcementsChannel = guild.channels.cache.find(c => c.name.includes("announcements") && c.isTextBased());
  const generalChannel = guild.channels.cache.find(c => c.name.includes("general") && c.isTextBased());
  const lanaChannel = guild.channels.cache.find(c => c.name.includes("lana-chat") && c.isTextBased());
  const introChannel = guild.channels.cache.find(c => c.name.includes("intro") && c.isTextBased());
  const giveawayChannel = guild.channels.cache.find(c => c.name.includes("giveaway") && c.isTextBased());
  const rulesId = guild.channels.cache.find(c => c.name.includes("rules") && c.isTextBased())?.id ?? "";
  const updatesId = announcementsChannel?.id ?? generalChannel?.id ?? "";

  await progressMsg.edit({
    embeds: [lana(`${cSym()} Step 1/2 — Enabling Community...`, "Enabling Discord Community mode for your server...")],
  });

  const communityOk = await enableCommunity(guild, rulesId, updatesId, token);

  await progressMsg.edit({
    embeds: [lana(`${cSym()} Step 2/2 — Configuring Onboarding...`, "Setting up onboarding prompts with crazy symbols and Lana vibes...")],
  });

  const onboardOk = communityOk ? await setupOnboarding(
    guild,
    {
      rules: rulesId,
      general: generalChannel?.id,
      announcements: announcementsChannel?.id,
      intro: introChannel?.id,
      lana: lanaChannel?.id,
      giveaway: giveawayChannel?.id,
    },
    {},
    token
  ) : false;

  await progressMsg.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(communityOk && onboardOk ? COLORS.lana : COLORS.warn)
        .setTitle(communityOk && onboardOk ? `${cSym()} Onboarding Configured!` : `${cSym()} Partial Setup`)
        .setDescription(
          `${cLine()}\n\n` +
          `**Community Mode:** ${communityOk ? "✅ Enabled" : "❌ Failed"}\n` +
          `**Onboarding:** ${onboardOk ? "✅ Configured" : "❌ Failed"}\n\n` +
          (communityOk && onboardOk
            ? `Onboarding is now live! New members will see:\n\n﹒${cSym()}﹒ Why are you here? (reason prompt)\n﹒${cSym()}﹒ Pick your vibe (aesthetics)\n﹒${cSym()}﹒ Favourite Lana Era? (fan prompt)\n\nMembers complete these before joining the server! ✨`
            : communityOk
            ? "Community is enabled but onboarding setup failed. Try Server Settings → Onboarding to configure manually."
            : "Community mode failed. You may need to:\n﹒ Enable 2FA on your account\n﹒ Set a verification level in Server Settings\n﹒ Then run `!onboard` again"
          ) +
          `\n\n${cLine()}`
        )
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
        .setTimestamp(),
    ],
  }).catch(() => {});
}
