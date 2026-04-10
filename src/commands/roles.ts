import { type Message } from "discord.js";
import { base, aesthetic, COLORS } from "../utils/embeds.js";

// ─── COMMANDS ─────────────────────────────────────────────────────────────────

export async function handleRoles(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const isAdmin = message.member?.permissions.has(BigInt(0x8));

  // !giverole @user @role
  if (cmd === "giverole") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const member = message.mentions.members?.first();
    const role = message.mentions.roles.first();
    if (!member || !role) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!giverole @user @role`")] });
    const err = await member.roles.add(role).catch((e: any) => e);
    if (err instanceof Error) return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not give role.\n> ${err.message}`)] });
    return message.reply({ embeds: [aesthetic("✅ Role Given!", `Gave <@&${role.id}> to <@${member.id}>!`, COLORS.success)] });
  }

  // !takerole @user @role
  if (cmd === "takerole") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const member = message.mentions.members?.first();
    const role = message.mentions.roles.first();
    if (!member || !role) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!takerole @user @role`")] });
    const err = await member.roles.remove(role).catch((e: any) => e);
    if (err instanceof Error) return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Could not remove role.\n> ${err.message}`)] });
    return message.reply({ embeds: [aesthetic("✅ Role Removed!", `Removed <@&${role.id}> from <@${member.id}>!`, COLORS.success)] });
  }

  // !roles @user  — list all roles of a member
  if (cmd === "roles") {
    const member = message.mentions.members?.first() ?? message.member!;
    const roles = member.roles.cache
      .filter(r => r.id !== message.guild!.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .join(", ") || "*No roles*";

    return message.reply({
      embeds: [
        base(COLORS.lana)
          .setTitle(`🎭 Roles — ${member.displayName}`)
          .setDescription(roles)
          .setThumbnail(member.user.displayAvatarURL()),
      ],
    });
  }
}
