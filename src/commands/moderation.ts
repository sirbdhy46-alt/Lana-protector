import { type Message, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import {
  get,
  set,
  update,
  defaultWarnings,
  type UserWarnings,
  defaultSettings,
  type GuildSettings,
} from "../data/storage.js";
import { COLORS, rand, ANIMATED, base, aesthetic, lana } from "../utils/embeds.js";
import { getGif } from "../utils/gifs.js";

function gKey(guildId: string) {
  return `settings:${guildId}`;
}

async function sendMod(
  message: Message,
  title: string,
  desc: string,
  gif: string,
  color = COLORS.moderation
) {
  const embed = base(color)
    .setTitle(`${rand(ANIMATED)} ${title}`)
    .setDescription(desc)
    .setImage(gif);
  await message.channel.send({ embeds: [embed] });
}

function logAction(
  message: Message,
  action: string,
  target: string,
  reason: string
) {
  const settings = get<GuildSettings>(
    gKey(message.guildId!),
    "data",
    defaultSettings
  );
  if (!settings?.logsChannel) return;
  const ch = message.guild?.channels.cache.get(settings.logsChannel);
  if (!ch?.isTextBased()) return;
  const embed = base(COLORS.warn)
    .setTitle(`📋 Mod Log — ${action}`)
    .addFields(
      { name: "Target", value: target, inline: true },
      { name: "Moderator", value: message.author.tag, inline: true },
      { name: "Reason", value: reason, inline: false }
    );
  (ch as any).send({ embeds: [embed] }).catch(() => {});
}

export async function handleModeration(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;
  const hasPerms = (perm: bigint) => message.member?.permissions.has(perm);

  switch (cmd) {
    case "ban": {
      if (!hasPerms(PermissionFlagsBits.BanMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Ban Members** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to ban!")],
        });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.ban({ reason });
        await sendMod(
          message,
          `🔨 Banned — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`,
          getGif("ban")
        );
        logAction(message, "BAN", target.user.tag, reason);
      } catch {
        message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Could not ban that member.")],
        });
      }
      break;
    }

    case "kick": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to kick!")],
        });
      const reason = args.slice(1).join(" ") || "No reason provided";
      try {
        await target.kick(reason);
        await sendMod(
          message,
          `👢 Kicked — ${target.user.username}`,
          `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`,
          getGif("kick")
        );
        logAction(message, "KICK", target.user.tag, reason);
      } catch {
        message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Could not kick that member.")],
        });
      }
      break;
    }

    case "mute": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to mute!")],
        });
      const reason = args.slice(1).join(" ") || "No reason";
      update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({ ...w, muted: true }),
        defaultWarnings
      );
      await target.timeout(600_000, reason).catch(() => {});
      await sendMod(
        message,
        `🔇 Muted — ${target.user.username}`,
        `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Duration:** 10 minutes`,
        getGif("mute")
      );
      break;
    }

    case "unmute": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to unmute!")],
        });
      update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({ ...w, muted: false }),
        defaultWarnings
      );
      await target.timeout(null).catch(() => {});
      await message.channel.send({
        embeds: [aesthetic("🔊 Unmuted", `${target.user.tag} has been unmuted!`, COLORS.success)],
      });
      break;
    }

    case "timeout": {
      if (!hasPerms(PermissionFlagsBits.ModerateMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Moderate Members** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member!")],
        });
      const mins = parseInt(args[1] ?? "5", 10) || 5;
      const reason = args.slice(2).join(" ") || "No reason";
      await target.timeout(mins * 60_000, reason).catch(() => {});
      await sendMod(
        message,
        `⏱️ Timeout — ${target.user.username}`,
        `> **Duration:** ${mins} min\n> **Reason:** ${reason}`,
        getGif("timeout")
      );
      break;
    }

    case "warn": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")],
        });
      const target = message.mentions.users.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a user to warn!")],
        });
      const reason = args.slice(1).join(" ") || "No reason";
      const warns = update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({
          ...w,
          warnings: [
            ...w.warnings,
            { reason, mod: message.author.tag, timestamp: Date.now() },
          ],
        }),
        defaultWarnings
      );
      await sendMod(
        message,
        `⚠️ Warned — ${target.username}`,
        `> **Reason:** ${reason}\n> **Total Warns:** ${warns.warnings.length}`,
        getGif("warn"),
        COLORS.warn
      );
      break;
    }

    case "warnings": {
      const target = message.mentions.users.first() ?? message.author;
      const data = get<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        defaultWarnings
      );
      const list =
        data.warnings
          .map((w, i) => `**${i + 1}.** ${w.reason} — *by ${w.mod}*`)
          .join("\n") || "No warnings";
      await message.reply({
        embeds: [aesthetic(`📋 Warnings — ${target.username}`, list, COLORS.warn)],
      });
      break;
    }

    case "clearwarns": {
      if (!hasPerms(PermissionFlagsBits.KickMembers))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Kick Members** permission!")],
        });
      const target = message.mentions.users.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a user!")],
        });
      update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({ ...w, warnings: [] }),
        defaultWarnings
      );
      await message.reply({
        embeds: [aesthetic("🗑️ Cleared", `Warnings cleared for **${target.username}**`, COLORS.success)],
      });
      break;
    }

    case "clear":
    case "purge": {
      if (!hasPerms(PermissionFlagsBits.ManageMessages))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Messages** permission!")],
        });
      const amount = Math.min(parseInt(args[0] ?? "10", 10) || 10, 100);
      await (message.channel as any).bulkDelete(amount + 1, true).catch(() => {});
      const m = await message.channel.send({
        embeds: [aesthetic("🧹 Cleared", `Deleted **${amount}** messages!`, COLORS.success)],
      });
      setTimeout(() => m.delete().catch(() => {}), 3000);
      break;
    }

    case "slowmode": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")],
        });
      const secs = parseInt(args[0] ?? "0", 10) || 0;
      if ("setRateLimitPerUser" in message.channel) {
        await (message.channel as any).setRateLimitPerUser(secs);
      }
      await message.reply({
        embeds: [
          aesthetic(
            "⏳ Slowmode",
            secs === 0 ? "Slowmode disabled!" : `Slowmode set to **${secs}s**`,
            COLORS.info as any
          ),
        ],
      });
      break;
    }

    case "lock": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")],
        });
      await (message.channel as any)
        .permissionOverwrites.edit(message.guild.id, { SendMessages: false })
        .catch(() => {});
      await message.reply({
        embeds: [aesthetic("🔒 Locked", "This channel has been locked!", COLORS.warn)],
      });
      break;
    }

    case "unlock": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")],
        });
      await (message.channel as any)
        .permissionOverwrites.edit(message.guild.id, { SendMessages: null })
        .catch(() => {});
      await message.reply({
        embeds: [aesthetic("🔓 Unlocked", "This channel has been unlocked!", COLORS.success)],
      });
      break;
    }

    case "nick": {
      if (!hasPerms(PermissionFlagsBits.ManageNicknames))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Nicknames** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member!")],
        });
      const nick = args.slice(1).join(" ") || target.user.username;
      await target.setNickname(nick).catch(() => {});
      await message.reply({
        embeds: [aesthetic("📝 Nickname Set", `Set **${target.user.username}**'s nickname to **${nick}**`, COLORS.info as any)],
      });
      break;
    }

    case "jail": {
      if (!hasPerms(PermissionFlagsBits.ManageRoles))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Roles** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to jail!")],
        });
      const reason = args.slice(1).join(" ") || "No reason";
      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
      if (!settings.jailedRole)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ No jailed role set! Run `!setup` first.")],
        });
      const jailRole = message.guild.roles.cache.get(settings.jailedRole);
      if (!jailRole)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Jailed role not found!")],
        });
      await target.roles.add(jailRole).catch(() => {});
      update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({ ...w, jailed: true, jailReason: reason }),
        defaultWarnings
      );
      await sendMod(
        message,
        `🔒 Jailed — ${target.user.username}`,
        `> **User:** ${target.user.tag}\n> **Reason:** ${reason}\n> **Mod:** ${message.author.tag}`,
        getGif("jail")
      );
      if (settings.jailChannel) {
        const jailCh = message.guild.channels.cache.get(settings.jailChannel);
        if (jailCh?.isTextBased())
          (jailCh as any).send({
            content: `<@${target.id}>`,
            embeds: [
              lana(
                "You've been jailed 🔒",
                `> **Reason:** ${reason}\n> Contact a mod to be released.`
              ),
            ],
          }).catch(() => {});
      }
      break;
    }

    case "unjail": {
      if (!hasPerms(PermissionFlagsBits.ManageRoles))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Roles** permission!")],
        });
      const target = message.mentions.members?.first();
      if (!target)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ Mention a member to unjail!")],
        });
      const settings = get<GuildSettings>(gKey(message.guildId!), "data", defaultSettings);
      if (!settings.jailedRole)
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ No jailed role set!")],
        });
      const jailRole = message.guild.roles.cache.get(settings.jailedRole);
      if (jailRole) await target.roles.remove(jailRole).catch(() => {});
      update<UserWarnings>(
        `warnings:${message.guildId}`,
        target.id,
        (w) => ({ ...w, jailed: false, jailReason: "" }),
        defaultWarnings
      );
      await message.reply({
        embeds: [aesthetic("🔓 Released", `${target.user.tag} has been released from jail!`, COLORS.success)],
      });
      break;
    }

    case "nuke": {
      if (!hasPerms(PermissionFlagsBits.ManageChannels))
        return message.reply({
          embeds: [base(COLORS.error).setDescription("❌ You need **Manage Channels** permission!")],
        });
      const ch = message.channel as any;
      const clone = await ch.clone().catch(() => null);
      await ch.delete().catch(() => {});
      if (clone) {
        const m = await clone.send({
          embeds: [aesthetic("💥 Channel Nuked!", "This channel has been nuked!", COLORS.moderation)
            .setImage(getGif("nuke"))],
        });
      }
      break;
    }

    default:
      break;
  }
}
