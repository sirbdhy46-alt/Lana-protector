import {
  type Message,
  type Client,
  type ButtonInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} from "discord.js";
import {
  get, set, update,
  defaultWarnings, type UserWarnings,
  defaultSettings, type GuildSettings,
} from "../data/storage.js";
import { COLORS, rand, ANIMATED, base, aesthetic, lana } from "../utils/embeds.js";
import { getGif } from "../utils/gifs.js";

// ─── JAIL TYPES ───────────────────────────────────────────────────────────────

type JailRecord = {
  userId: string;
  savedRoles: string[];
  reason: string;
  modId: string;
  jailedAt: number;
  releaseAt: number | null;
};

type PendingJail = {
  targetId: string;
  targetTag: string;
  savedRoles: string[];
  reason: string;
  modId: string;
  guildId: string;
};

const activeTimers = new Map<string, NodeJS.Timeout>();
const pendingJails = new Map<string, PendingJail>(); // key = guildId:targetId

function jailKey(guildId: string, userId: string) { return `jail:${guildId}:${userId}`; }
function gKey(guildId: string) { return `settings:${guildId}`; }
const DIVIDER = "✦ ·────────────────────────· ✦";

// ─── DURATION HELPERS ─────────────────────────────────────────────────────────

function parseDuration(str: string): number | null {
  const match = str?.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const num = parseInt(match[1]!);
  const unit = match[2]!.toLowerCase();
  const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return num * (mult[unit] ?? 0);
}

function formatDuration(ms: number | null): string {
  if (!ms) return "Indefinite";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

// ─── JAIL EXECUTION ───────────────────────────────────────────────────────────

async function executeJail(client: Client, guildId: string, pending: PendingJail, durationMs: number | null) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const settings = get<GuildSettings>(gKey(guildId), "data", defaultSettings);
  const member = await guild.members.fetch(pending.targetId).catch(() => null);
  if (!member) return;

  const jailRole = settings.jailedRole ? guild.roles.cache.get(settings.jailedRole) : null;
  if (!jailRole) return;

  // Remove all roles
  for (const roleId of pending.savedRoles) {
    await member.roles.remove(roleId).catch(() => {});
  }

  // Add jail role
  await member.roles.add(jailRole).catch(() => {});

  // Save record
  const record: JailRecord = {
    userId: pending.targetId,
    savedRoles: pending.savedRoles,
    reason: pending.reason,
    modId: pending.modId,
    jailedAt: Date.now(),
    releaseAt: durationMs ? Date.now() + durationMs : null,
  };
  set(jailKey(guildId, pending.targetId), "data", record);
  update<UserWarnings>(`warnings:${guildId}`, pending.targetId, (w) => ({ ...w, jailed: true, jailReason: pending.reason }), defaultWarnings);

  // Auto-release timer
  if (durationMs) {
    const timerKey = `${guildId}:${pending.targetId}`;
    if (activeTimers.has(timerKey)) clearTimeout(activeTimers.get(timerKey));
    const timer = setTimeout(() => performUnjail(guildId, pending.targetId, client), durationMs);
    activeTimers.set(timerKey, timer);
  }

  // DM user
  member.send({
    embeds: [
      new EmbedBuilder().setColor(0x7f8c8d).setTitle("🔒 You've been jailed")
        .setDescription(
          `**Server:** ${guild.name}\n**Reason:** ${pending.reason}\n**Duration:** ${formatDuration(durationMs)}\n\nContact a moderator to appeal.`
        ),
    ],
  }).catch(() => {});

  // Jail channel message
  if (settings.jailChannel) {
    const ch = guild.channels.cache.get(settings.jailChannel);
    if (ch?.isTextBased()) {
      (ch as any).send({
        content: `<@${pending.targetId}>`,
        embeds: [lana("🔒 You've been jailed!",
          `${DIVIDER}\n\n> **Reason:** ${pending.reason}\n> **Duration:** ${formatDuration(durationMs)}\n> **Mod:** <@${pending.modId}>\n\n> *Contact a moderator to appeal.*\n\n${DIVIDER}`)],
      }).catch(() => {});
    }
  }
}

async function performUnjail(guildId: string, userId: string, client: Client) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const record = get<JailRecord | null>(jailKey(guildId, userId), "data", null);
  if (!record) return;
  const settings = get<GuildSettings>(gKey(guildId), "data", defaultSettings);
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  if (settings.jailedRole) {
    const jailRole = guild.roles.cache.get(settings.jailedRole);
    if (jailRole) await member.roles.remove(jailRole).catch(() => {});
  }

  for (const roleId of record.savedRoles) {
    if (guild.roles.cache.has(roleId)) await member.roles.add(roleId).catch(() => {});
  }

  set(jailKey(guildId, userId), "data", null);
  update<UserWarnings>(`warnings:${guildId}`, userId, (w) => ({ ...w, jailed: false, jailReason: "" }), defaultWarnings);

  const timerKey = `${guildId}:${userId}`;
  if (activeTimers.has(timerKey)) { clearTimeout(activeTimers.get(timerKey)); activeTimers.delete(timerKey); }

  if (settings.jailChannel) {
    const ch = guild.channels.cache.get(settings.jailChannel);
    if (ch?.isTextBased())
      (ch as any).send({ content: `<@${userId}>`, embeds: [lana("🔓 Released!", "You are free to go. Behave! ✿")] }).catch(() => {});
  }
}

// ─── JAIL PANEL UI ────────────────────────────────────────────────────────────

function buildJailPanel(pending: PendingJail) {
  const embed = new EmbedBuilder()
    .setColor(0x7f8c8d)
    .setTitle("🔒 Jail Panel")
    .setDescription(
      `${DIVIDER}\n\n` +
      `👤 **Target:** <@${pending.targetId}> \`(${pending.targetTag})\`\n` +
      `📝 **Reason:** ${pending.reason}\n` +
      `🎭 **Roles to be removed:** ${pending.savedRoles.length}\n\n` +
      `${DIVIDER}\n\n` +
      `**Select jail duration below:**\n` +
      `*Click Cancel to abort.*`
    )
    .setFooter({ text: "Only the moderator who ran !jail can interact" });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:1800000`).setLabel("30 min").setEmoji("⏱️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:3600000`).setLabel("1 hour").setEmoji("🕐").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:21600000`).setLabel("6 hours").setEmoji("🕕").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:43200000`).setLabel("12 hours").setEmoji("🕛").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:86400000`).setLabel("24 hours").setEmoji("📅").setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:259200000`).setLabel("3 days").setEmoji("📆").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:604800000`).setLabel("7 days").setEmoji("📆").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`jailpick:${pending.guildId}:${pending.targetId}:0`).setLabel("Indefinite").setEmoji("♾️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`jailcancel:${pending.guildId}:${pending.targetId}`).setLabel("Cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary),
  );

  return { embed, components: [row1, row2] };
}

// ─── REGISTER JAIL BUTTON HANDLER ────────────────────────────────────────────

export function registerJailButtons(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.guild) return;
    const btn = interaction as ButtonInteraction;

    // Duration pick
    if (btn.customId.startsWith("jailpick:")) {
      const parts = btn.customId.split(":");
      const guildId = parts[1]!;
      const targetId = parts[2]!;
      const durationMs = parseInt(parts[3]!) || null;

      const pending = pendingJails.get(`${guildId}:${targetId}`);
      if (!pending) {
        await btn.reply({ content: "❌ This jail panel has expired. Run `!jail` again.", ephemeral: true });
        return;
      }

      // Only the mod who ran the command can confirm
      if (btn.user.id !== pending.modId) {
        await btn.reply({ content: "❌ Only the moderator who initiated this jail can confirm.", ephemeral: true });
        return;
      }

      pendingJails.delete(`${guildId}:${targetId}`);
      await executeJail(client, guildId, pending, durationMs);

      const confirmedEmbed = new EmbedBuilder()
        .setColor(0x7f8c8d)
        .setTitle("🔒 Member Jailed")
        .setDescription(
          `${DIVIDER}\n\n` +
          `👤 **Jailed:** <@${targetId}>\n` +
          `📝 **Reason:** ${pending.reason}\n` +
          `⏱️ **Duration:** ${formatDuration(durationMs)}\n` +
          `🎭 **Roles removed:** ${pending.savedRoles.length}\n` +
          `👮 **By:** <@${pending.modId}>\n\n` +
          `${DIVIDER}`
        )
        .setTimestamp();

      await btn.update({ embeds: [confirmedEmbed], components: [] });
      return;
    }

    // Cancel
    if (btn.customId.startsWith("jailcancel:")) {
      const parts = btn.customId.split(":");
      const guildId = parts[1]!;
      const targetId = parts[2]!;

      const pending = pendingJails.get(`${guildId}:${targetId}`);
      if (pending && btn.user.id !== pending.modId) {
        await btn.reply({ content: "❌ Only the moderator who initiated this can cancel.", ephemeral: true });
        return;
      }

      pendingJails.delete(`${guildId}:${targetId}`);
      const cancelEmbed = new EmbedBuilder().setColor(0x95a5a6).setDescription("❌ Jail cancelled.");
      await btn.update({ embeds: [cancelEmbed], components: [] });
      return;
    }
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function sendMod(message: Message, title: string, desc: string, gif: string, color = COLORS.moderation) {
  const embed = base(color).setTitle(`${rand(ANIMATED)} ${title}`).setDescription(desc);
  if (gif) embed.setImage(gif);
  await message.channel.send({ embeds: [embed] });
}

function logAction(message: Message, action: string, target: string, reason: string) {
  const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
  if (!settings?.logsChannel) return;
  const ch = message.guild?.channels.cache.get(settings.logsChannel);
  if (!ch?.isTextBased()) return;
  (ch as any).send({
    embeds: [
      base(COLORS.warn).setTitle(`📋 Mod Log — ${action}`)
        .addFields(
          { name: "Target", value: target, inline: true },
          { name: "Moderator", value: message.author.tag, inline: true },
          { name: "Reason", value: reason, inline: false }
        ),
    ],
  }).catch(() => {});
}

function checkRoleHierarchy(message: Message, target: any): string | null {
  if (!message.guild) return null;
  if (target.id === message.guild.ownerId) return "❌ I can't perform actions on the server owner!";
  const botMember = message.guild.members.me;
  if (!botMember) return null;
  if (target.roles.highest.position >= botMember.roles.highest.position)
    return "❌ Their role is higher than or equal to mine.\n> Go to **Server Settings → Roles** and drag my role to the **very top**.";
  return null;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function handleModeration(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const hasPerms = (perm: bigint) => message.member?.permissions.has(perm);

  switch (cmd) {

    case "ban": {
      if (!hasPerms(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Ban Members** permission!")] });
      if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ I don't have **Ban Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to ban!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.ban({ reason });
        await sendMod(message, `🔨 Banned — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`, getGif("ban"));
        logAction(message, "BAN", target.user.tag, reason);
      } catch (e: any) {
        message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not ban.\n> ${e?.message ?? "Unknown error"}`)] });
      }
      break;
    }

    case "kick": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")] });
      if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ I don't have **Kick Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to kick!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.kick(reason);
        await sendMod(message, `👢 Kicked — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`, getGif("kick"));
        logAction(message, "KICK", target.user.tag, reason);
      } catch (e: any) {
        message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not kick.\n> ${e?.message ?? "Unknown error"}`)] });
      }
      break;
    }

    case "mute": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to mute!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const reason = args.slice(1).join(" ") || "No reason";
      const err = await target.timeout(600_000, reason).catch((e: any) => e);
      if (err instanceof Error) return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not mute.\n> ${err.message}`)] });
      update<UserWarnings>(`warnings:${message.guildId}`, target.id, (w) => ({ ...w, muted: true }), defaultWarnings);
      await sendMod(message, `🔇 Muted — ${target.user.username}`,
        `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Duration:** 10 minutes`, getGif("mute"));
      logAction(message, "MUTE", target.user.tag, reason);
      break;
    }

    case "unmute": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to unmute!")] });
      update<UserWarnings>(`warnings:${message.guildId}`, target.id, (w) => ({ ...w, muted: false }), defaultWarnings);
      await target.timeout(null).catch(() => {});
      await message.channel.send({ embeds: [aesthetic("🔊 Unmuted", `${target.user.tag} has been unmuted!`, COLORS.success)] });
      break;
    }

    case "timeout": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const mins = parseInt(args[1] ?? "5", 10) || 5;
      const reason = args.slice(2).join(" ") || "No reason";
      const err = await target.timeout(mins * 60_000, reason).catch((e: any) => e);
      if (err instanceof Error) return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not timeout.\n> ${err.message}`)] });
      await sendMod(message, `⏱️ Timed Out — ${target.user.username}`,
        `> **User:** ${target.user.tag}\n> **Duration:** ${mins} min\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`, getGif("timeout"));
      logAction(message, "TIMEOUT", target.user.tag, `${mins} min — ${reason}`);
      break;
    }

    case "warn": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")] });
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a user to warn!")] });
      const reason = args.slice(1).join(" ") || "No reason";
      const warns = update<UserWarnings>(`warnings:${message.guildId}`, target.id,
        (w) => ({ ...w, warnings: [...w.warnings, { reason, mod: message.author.tag, timestamp: Date.now() }] }), defaultWarnings);
      await sendMod(message, `⚠️ Warned — ${target.username}`,
        `> **User:** ${target.tag}\n> **Reason:** ${reason}\n> **Total Warns:** ${warns.warnings.length}\n> **Mod:** ${message.author.tag}`, getGif("warn"), COLORS.warn);
      logAction(message, "WARN", target.tag, reason);
      break;
    }

    case "warnings": {
      const target = message.mentions.users.first() ?? message.author;
      const data = get<UserWarnings>(`warnings:${message.guildId}`, target.id, defaultWarnings);
      const list = data.warnings.map((w, i) => `**${i + 1}.** ${w.reason} — *by ${w.mod}*`).join("\n") || "No warnings";
      await message.reply({ embeds: [aesthetic(`📋 Warnings — ${target.username}`, list, COLORS.warn)] });
      break;
    }

    case "clearwarns": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")] });
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a user!")] });
      update<UserWarnings>(`warnings:${message.guildId}`, target.id, (w) => ({ ...w, warnings: [] }), defaultWarnings);
      await message.reply({ embeds: [aesthetic("🗑️ Cleared", `Warnings cleared for **${target.username}**`, COLORS.success)] });
      break;
    }

    case "clear":
    case "purge": {
      if (!hasPerms(PermissionFlagsBits.ManageMessages))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Messages** permission!")] });
      const amount = Math.min(parseInt(args[0] ?? "10", 10) || 10, 100);
      await (message.channel as any).bulkDelete(amount + 1, true).catch(() => {});
      const m = await message.channel.send({ embeds: [aesthetic("🧹 Cleared", `Deleted **${amount}** messages!`, COLORS.success)] });
      setTimeout(() => m.delete().catch(() => {}), 3000);
      break;
    }

    case "slowmode": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")] });
      const secs = parseInt(args[0] ?? "0", 10) || 0;
      if ("setRateLimitPerUser" in message.channel) await (message.channel as any).setRateLimitPerUser(secs);
      await message.reply({ embeds: [aesthetic("⏳ Slowmode", secs === 0 ? "Slowmode disabled!" : `Slowmode set to **${secs}s**`, COLORS.info as any)] });
      break;
    }

    case "lock": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")] });
      await (message.channel as any).permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(() => {});
      await message.reply({ embeds: [aesthetic("🔒 Locked", "This channel has been locked!", COLORS.warn)] });
      break;
    }

    case "unlock": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")] });
      await (message.channel as any).permissionOverwrites.edit(message.guild.id, { SendMessages: null }).catch(() => {});
      await message.reply({ embeds: [aesthetic("🔓 Unlocked", "This channel has been unlocked!", COLORS.success)] });
      break;
    }

    case "nick": {
      if (!hasPerms(PermissionFlagsBits.ManageNicknames))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Nicknames** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member!")] });
      const nick = args.slice(1).join(" ") || target.user.username;
      await target.setNickname(nick).catch(() => {});
      await message.reply({ embeds: [aesthetic("📝 Nickname Set", `Set **${target.user.username}**'s nickname to **${nick}**`, COLORS.info as any)] });
      break;
    }

    // ── JAILSETUP ─────────────────────────────────────────────────────────────
    case "jailsetup": {
      if (!hasPerms(PermissionFlagsBits.Administrator))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Administrator** permission!")] });

      const pending = await message.reply({ embeds: [base(COLORS.lana).setDescription("⏳ Setting up jail system...")] });
      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);

      let jailRole = settings.jailedRole ? message.guild.roles.cache.get(settings.jailedRole) : null;
      jailRole = jailRole ?? message.guild.roles.cache.find(r => r.name === "🔒 Jailed") ?? null;
      if (!jailRole) {
        jailRole = await message.guild.roles.create({ name: "🔒 Jailed", color: 0x7f8c8d, permissions: [], reason: "Jail system setup" }).catch(() => null);
      }
      if (!jailRole) {
        await pending.edit({ embeds: [base(COLORS.error).setDescription("❌ Could not create Jailed role. Give me **Manage Roles** permission!")] });
        return;
      }

      for (const [, channel] of message.guild.channels.cache) {
        if (channel.type === ChannelType.GuildCategory || channel.isTextBased() || channel.isVoiceBased()) {
          await (channel as any).permissionOverwrites.edit(jailRole.id, { ViewChannel: false, SendMessages: false }).catch(() => {});
        }
      }

      let jailChannel = settings.jailChannel ? message.guild.channels.cache.get(settings.jailChannel) : null;
      if (!jailChannel) {
        jailChannel = await message.guild.channels.create({
          name: "🔒・jail",
          type: ChannelType.GuildText,
          reason: "Jail system setup",
          permissionOverwrites: [
            { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: jailRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], deny: [PermissionFlagsBits.AddReactions] },
            { id: message.guild.members.me!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
          ],
        }).catch(() => null) as any;
      }

      const newSettings = { ...settings, jailedRole: jailRole.id, jailChannel: jailChannel?.id ?? settings.jailChannel ?? "" };
      set(gKey(message.guildId!), "data", newSettings);

      await pending.edit({
        embeds: [
          new EmbedBuilder().setColor(0x57f287).setTitle("✅ Jail System Ready!")
            .setDescription(
              `${DIVIDER}\n\n` +
              `**Jailed Role:** <@&${jailRole.id}>\n` +
              `**Jail Channel:** ${jailChannel ? `<#${(jailChannel as any).id}>` : "*(not created)*"}\n\n` +
              `Jailed members will lose all roles and only see the jail channel.\n\n` +
              `${DIVIDER}\n\n` +
              `\`!jail @user reason\` — opens jail duration panel\n` +
              `\`!unjail @user\` — restores all roles\n` +
              `\`!jaillist\` — see all jailed members`
            ),
        ],
      });
      break;
    }

    // ── JAIL — Opens the duration picker panel ────────────────────────────────
    case "jail": {
      if (!hasPerms(PermissionFlagsBits.ManageRoles))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Roles** permission!")] });

      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to jail!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });

      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
      const jailRole = settings.jailedRole ? message.guild.roles.cache.get(settings.jailedRole) : null;
      if (!jailRole)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Jail system not set up!\n> Run `!jailsetup` to auto-configure everything.")] });

      const reason = args.slice(1).join(" ") || "No reason provided";
      const savedRoles = target.roles.cache.filter(r => r.id !== message.guild!.id && r.id !== jailRole.id).map(r => r.id);

      const pending: PendingJail = {
        targetId: target.id,
        targetTag: target.user.tag,
        savedRoles,
        reason,
        modId: message.author.id,
        guildId: message.guildId!,
      };
      pendingJails.set(`${message.guildId}:${target.id}`, pending);

      // Auto-expire panel after 2 minutes
      setTimeout(() => pendingJails.delete(`${message.guildId}:${target.id}`), 120_000);

      const { embed, components } = buildJailPanel(pending);
      await message.reply({ embeds: [embed], components });
      break;
    }

    // ── UNJAIL ────────────────────────────────────────────────────────────────
    case "unjail": {
      if (!hasPerms(PermissionFlagsBits.ManageRoles))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Roles** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member to unjail!")] });

      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
      const record = get<JailRecord | null>(jailKey(message.guildId!, target.id), "data", null);

      if (settings.jailedRole) {
        const jailRole = message.guild.roles.cache.get(settings.jailedRole);
        if (jailRole) await target.roles.remove(jailRole).catch(() => {});
      }

      if (record?.savedRoles?.length) {
        for (const roleId of record.savedRoles) {
          if (message.guild.roles.cache.has(roleId)) await target.roles.add(roleId).catch(() => {});
        }
      }

      set(jailKey(message.guildId!, target.id), "data", null);
      update<UserWarnings>(`warnings:${message.guildId}`, target.id, (w) => ({ ...w, jailed: false, jailReason: "" }), defaultWarnings);
      const timerKey = `${message.guildId}:${target.id}`;
      if (activeTimers.has(timerKey)) { clearTimeout(activeTimers.get(timerKey)); activeTimers.delete(timerKey); }

      await message.reply({ embeds: [aesthetic("🔓 Released!", `${target.user.tag} has been released.\n> ${record?.savedRoles?.length ?? 0} roles restored.`, COLORS.success)] });
      logAction(message, "UNJAIL", target.user.tag, "Released from jail");

      if (settings.jailChannel) {
        const ch = message.guild.channels.cache.get(settings.jailChannel);
        if (ch?.isTextBased())
          (ch as any).send({ content: `<@${target.id}>`, embeds: [lana("🔓 Released!", "You are free to go. Behave! ✿")] }).catch(() => {});
      }
      break;
    }

    // ── JAILLIST ──────────────────────────────────────────────────────────────
    case "jaillist": {
      if (!hasPerms(PermissionFlagsBits.ManageRoles))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Roles** permission!")] });

      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
      if (!settings.jailedRole) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Run `!jailsetup` first.")] });
      const jailRole = message.guild.roles.cache.get(settings.jailedRole);
      if (!jailRole) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Jail role not found. Run `!jailsetup` again.")] });

      const jailed = jailRole.members;
      if (jailed.size === 0) return message.reply({ embeds: [aesthetic("🔒 Jail List", "No members currently jailed. ✿", COLORS.info as any)] });

      const lines = jailed.map(m => {
        const rec = get<JailRecord | null>(jailKey(message.guildId!, m.id), "data", null);
        const timeLeft = rec?.releaseAt ? `<t:${Math.floor(rec.releaseAt / 1000)}:R>` : "Indefinite";
        return `• <@${m.id}> — *${rec?.reason ?? "No reason"}* · ${timeLeft}`;
      }).join("\n");

      await message.reply({
        embeds: [base(COLORS.warn).setTitle(`🔒 Jail List — ${jailed.size} jailed`).setDescription(`${DIVIDER}\n\n${lines}\n\n${DIVIDER}`)],
      });
      break;
    }

    case "hardban": {
      if (!hasPerms(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Ban Members** permission!")] });
      if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ I don't have **Ban Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.ban({ reason, deleteMessageSeconds: 604800 });
        await sendMod(message, `💥 HARD BANNED — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Messages:** Last 7 days deleted 🗑️`, getGif("hardban"), 0xff0000 as any);
        logAction(message, "HARDBAN", target.user.tag, reason);
      } catch (e: any) {
        message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not hardban.\n> ${e?.message ?? "Unknown error"}`)] });
      }
      break;
    }

    case "hardfuck": {
      if (!hasPerms(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Ban Members** permission!")] });
      if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ I don't have **Ban Members** permission!")] });
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a member!")] });
      const hierErr = checkRoleHierarchy(message, target);
      if (hierErr) return message.reply({ embeds: [base(COLORS.error).setDescription(hierErr)] });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.ban({ reason, deleteMessageSeconds: 604800 });
        await sendMod(message, `☠️ HARDFUCKED — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Status:** Obliterated 💀 Messages nuked 🗑️`, getGif("hardfuck"), 0x8b0000 as any);
        logAction(message, "HARDFUCK", target.user.tag, reason);
      } catch (e: any) {
        message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not execute.\n> ${e?.message ?? "Unknown error"}`)] });
      }
      break;
    }

    case "nuke": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")] });
      const ch = message.channel as any;
      const clone = await ch.clone().catch(() => null);
      await ch.delete().catch(() => {});
      if (clone) await clone.send({ embeds: [aesthetic("💥 Channel Nuked!", "This channel has been nuked!", COLORS.moderation).setImage(getGif("nuke"))] }).catch(() => {});
      break;
    }

    default:
      break;
  }
}
