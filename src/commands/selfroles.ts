import { type Message, type Client, type GuildMember, EmbedBuilder, Events } from "discord.js";
import { base, aesthetic, COLORS, rand, CUTE } from "../utils/embeds.js";
import { get, set, update, defaultSettings, type GuildSettings } from "../data/storage.js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type SelfRoleEntry = {
  roleId: string;
  emoji: string;
  description: string;
  label: string;
};

export type SelfRolePanel = {
  channelId: string;
  messageId: string;
  roles: SelfRoleEntry[];
};

function panelKey(guildId: string) { return `selfroles:${guildId}`; }

// ─── BUILD THE SELF ROLES EMBED ───────────────────────────────────────────────

export function buildSelfRoleEmbed(panel: SelfRolePanel, guildName: string) {
  const SYMS = ["⟡", "✿", "♡", "⊹", "✶", "❀", "★", "◎", "⭔", "✦"];
  const sym = () => SYMS[Math.floor(Math.random() * SYMS.length)]!;
  const LINE = "✦ ───────────────────────── ✦";

  const roleLines = panel.roles.map(
    (r) => `${r.emoji}﹒**${r.label}** — *${r.description}*\n> React with ${r.emoji} to get <@&${r.roleId}>`
  ).join("\n\n");

  return new EmbedBuilder()
    .setColor(COLORS.lana)
    .setTitle(`${sym()} Self Roles — ${guildName} ${sym()}`)
    .setDescription(
      `${LINE}\n\n` +
      `React below to assign yourself a role!\n` +
      `Remove the reaction to remove the role.\n\n` +
      `${LINE}\n\n` +
      (roleLines || "*No self roles configured yet.*") +
      `\n\n${LINE}`
    )
    .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
    .setTimestamp();
}

// ─── POST OR UPDATE THE PANEL ─────────────────────────────────────────────────

export async function refreshSelfRolePanel(client: Client, guildId: string) {
  const panel = get<SelfRolePanel | null>(panelKey(guildId), "data", null);
  if (!panel) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const ch = client.channels.cache.get(panel.channelId);
  if (!ch?.isTextBased()) return;

  const embed = buildSelfRoleEmbed(panel, guild.name);

  try {
    const existing = await (ch as any).messages.fetch(panel.messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
      await existing.reactions.removeAll().catch(() => {});
      for (const r of panel.roles) {
        await existing.react(r.emoji).catch(() => {});
      }
    }
  } catch {}
}

export async function postSelfRolePanel(client: Client, guildId: string, channelId: string): Promise<string | null> {
  const panel = get<SelfRolePanel | null>(panelKey(guildId), "data", null) ?? { channelId, messageId: "", roles: [] };
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;
  const ch = client.channels.cache.get(channelId);
  if (!ch?.isTextBased()) return null;

  const embed = buildSelfRoleEmbed(panel, guild.name);
  const msg = await (ch as any).send({ embeds: [embed] });

  for (const r of panel.roles) {
    await msg.react(r.emoji).catch(() => {});
  }

  const updated: SelfRolePanel = { ...panel, channelId, messageId: msg.id };
  set(panelKey(guildId), "data", updated);
  return msg.id;
}

// ─── REGISTER REACTION HANDLERS ──────────────────────────────────────────────

export function registerSelfRoleReactions(client: Client) {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    try {
      if (reaction.partial) reaction = await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
      const msg = reaction.message;
      if (!msg.guild) return;

      const gid = msg.guild.id;
      const panel = get<SelfRolePanel | null>(panelKey(gid), "data", null);
      if (!panel || panel.messageId !== msg.id) return;

      const emoji = reaction.emoji.toString();
      const entry = panel.roles.find((r) => r.emoji === emoji);
      if (!entry) return;

      const member = await msg.guild.members.fetch(user.id).catch(() => null);
      if (!member) return;
      const role = msg.guild.roles.cache.get(entry.roleId);
      if (role) await member.roles.add(role).catch(() => {});
    } catch {}
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;
    try {
      if (reaction.partial) reaction = await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
      const msg = reaction.message;
      if (!msg.guild) return;

      const gid = msg.guild.id;
      const panel = get<SelfRolePanel | null>(panelKey(gid), "data", null);
      if (!panel || panel.messageId !== msg.id) return;

      const emoji = reaction.emoji.toString();
      const entry = panel.roles.find((r) => r.emoji === emoji);
      if (!entry) return;

      const member = await msg.guild.members.fetch(user.id).catch(() => null);
      if (!member) return;
      const role = msg.guild.roles.cache.get(entry.roleId);
      if (role) await member.roles.remove(role).catch(() => {});
    } catch {}
  });
}

// ─── COMMANDS ─────────────────────────────────────────────────────────────────

export async function handleSelfRoles(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const gid = message.guildId!;
  const isAdmin = message.member?.permissions.has(BigInt(0x8));

  if (cmd === "refreshroles") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    await refreshSelfRolePanel(message.client, gid);
    return message.reply({ embeds: [aesthetic("✅ Panel Refreshed!", "The self-roles panel has been updated.", COLORS.success)] });
  }

  if (cmd === "setrolespanel") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const channel = message.mentions.channels.first() ?? message.channel;
    const msgId = await postSelfRolePanel(message.client, gid, channel.id);
    if (!msgId) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Failed to post panel. Make sure I have permission to send messages there!")] });
    return message.reply({ embeds: [aesthetic("✅ Panel Posted!", `Self-roles panel has been posted in <#${channel.id}>!`, COLORS.success)] });
  }

  if (cmd === "selfrole") {
    const sub = args[0]?.toLowerCase();

    if (sub === "add") {
      if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
      const role = message.mentions.roles.first();
      const emoji = args[2];
      const desc = (args.slice(3).join(" ") || role?.name) ?? "Self Role";
      if (!role || !emoji)
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!selfrole add @role emoji description`")] });

      const panel = get<SelfRolePanel | null>(panelKey(gid), "data", null) ?? {
        channelId: "", messageId: "", roles: [],
      };

      const entry: SelfRoleEntry = { roleId: role.id, emoji, description: desc, label: role.name };
      const updated: SelfRolePanel = { ...panel, roles: [...panel.roles.filter(r => r.roleId !== role.id), entry] };
      set(panelKey(gid), "data", updated);

      await refreshSelfRolePanel(message.client, gid);
      return message.reply({ embeds: [aesthetic(`✅ Role Added!`, `${emoji} **${role.name}** added to the self-roles panel!`, COLORS.success)] });
    }

    if (sub === "remove") {
      if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
      const role = message.mentions.roles.first();
      if (!role) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a role to remove!")] });

      const panel = get<SelfRolePanel | null>(panelKey(gid), "data", null);
      if (!panel) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No self-role panel exists!")] });

      const updated: SelfRolePanel = { ...panel, roles: panel.roles.filter(r => r.roleId !== role.id) };
      set(panelKey(gid), "data", updated);
      await refreshSelfRolePanel(message.client, gid);
      return message.reply({ embeds: [aesthetic("🗑️ Role Removed!", `**${role.name}** removed from self-roles panel.`, COLORS.success)] });
    }

    if (sub === "list") {
      const panel = get<SelfRolePanel | null>(panelKey(gid), "data", null);
      if (!panel || panel.roles.length === 0)
        return message.reply({ embeds: [base(COLORS.lana).setDescription("No self roles configured.")] });
      return message.reply({
        embeds: [
          base(COLORS.lana)
            .setTitle("🎭 Self Roles")
            .setDescription(panel.roles.map(r => `${r.emoji} <@&${r.roleId}> — ${r.description}`).join("\n")),
        ],
      });
    }
  }
}
