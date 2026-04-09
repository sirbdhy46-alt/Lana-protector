import { type Message, EmbedBuilder, ActivityType } from "discord.js";
import { COLORS, base, aesthetic, lana, rand, CUTE, SYM } from "../utils/embeds.js";
import { getLanaGif } from "../utils/gifs.js";
import { type SnipedMessage } from "../data/storage.js";

export const sniped: Map<string, SnipedMessage> = new Map();
export const editSniped: Map<string, { before: string; after: string; author: string; authorId: string; avatar: string; timestamp: number }> = new Map();

export async function handleUtility(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;

  switch (cmd) {
    case "help": {
      const category = args[0]?.toLowerCase();
      if (category === "mod") {
        await message.reply({
          embeds: [
            lana("Moderation Commands", `
${SYM.line}
\`!ban @user [reason]\` — Ban a member
\`!kick @user [reason]\` — Kick a member
\`!mute @user [reason]\` — Mute for 10m
\`!unmute @user\` — Unmute a member
\`!timeout @user <mins> [reason]\` — Timeout
\`!warn @user [reason]\` — Warn a member
\`!warnings @user\` — View warnings
\`!clearwarns @user\` — Clear warnings
\`!jail @user [reason]\` — Jail a member
\`!unjail @user\` — Release from jail
\`!clear [amount]\` — Delete messages
\`!purge [amount]\` — Delete messages
\`!lock\` — Lock the channel
\`!unlock\` — Unlock the channel
\`!slowmode [secs]\` — Set slowmode
\`!nick @user [name]\` — Set nickname
\`!nuke\` — Nuke a channel
${SYM.line}`),
          ],
        });
      } else if (category === "util") {
        await message.reply({
          embeds: [
            lana("Utility Commands", `
${SYM.line}
\`!snipe\` — Last deleted message
\`!editsnipe\` — Last edited message
\`!serverinfo\` — Server information
\`!userinfo [@user]\` — User information
\`!avatar [@user]\` — User avatar
\`!ping\` — Bot latency
\`!botinfo\` — About this bot
\`!setup\` — Auto server setup
${SYM.line}`),
          ],
        });
      } else if (category === "fun") {
        await message.reply({
          embeds: [
            lana("Fun Commands", `
${SYM.line}
\`!hug @user\` — Hug someone
\`!slap @user\` — Slap someone
\`!kiss @user\` — Kiss someone
\`!dance\` — Do a little dance
\`!8ball <question>\` — Magic 8 ball
\`!coinflip\` — Flip a coin
\`!dice\` — Roll a dice
\`!rps <rock/paper/scissors>\` — Rock paper scissors
\`!quote\` — Random Lana quote
\`!ship @user1 @user2\` — Ship two users
${SYM.line}`),
          ],
        });
      } else if (category === "eco") {
        await message.reply({
          embeds: [
            lana("Economy Commands", `
${SYM.line}
\`!balance\` — View your balance
\`!daily\` — Claim daily coins
\`!work\` — Work for coins
\`!pay @user <amount>\` — Pay someone
\`!rob @user\` — Rob someone
\`!leaderboard\` — Economy leaderboard
\`!shop\` — View the shop
\`!buy <item>\` — Buy from shop
${SYM.line}`),
          ],
        });
      } else if (category === "level") {
        await message.reply({
          embeds: [
            lana("Leveling Commands", `
${SYM.line}
\`!rank [@user]\` — View level card
\`!leaderboard levels\` — Level leaderboard
\`!setlevelchannel #channel\` — Set XP up channel
${SYM.line}`),
          ],
        });
      } else if (category === "giveaway") {
        await message.reply({
          embeds: [
            lana("Giveaway Commands", `
${SYM.line}
\`!gstart <time> <winners> <prize>\` — Start giveaway
\`!gend <messageId>\` — End giveaway early
\`!greroll <messageId>\` — Reroll a giveaway
${SYM.line}`),
          ],
        });
      } else if (category === "extras" || category === "extra") {
        await message.reply({
          embeds: [
            lana("✨ Extras & Utility Commands", `
${SYM.line}
**🤖 Text Tools**
\`!aesthetic <text>\` / \`!ae\` — ａｅｓｔｈｅｔｉｃ text
\`!clap <text>\` — 👏 clap 👏 text
\`!mock <text>\` — mOcK tExT
\`!uwu <text>\` — uwuify text
\`!owo <text>\` — owoify text
\`!reverse <text>\` — esrever text
\`!morse <text>\` — ... --- ...
\`!binary <text>\` — 01010101
\`!spoiler <text>\` — ||s||p||o||i||l||e||r||
\`!emojify <text>\` — 🇪 🇲 🇴 🇯 🇮

**🎯 Fun**
\`!vibe [@user]\` — Vibe check
\`!iq [@user]\` — IQ test
\`!pp [@user]\` — PP size
\`!gay [@user]\` — Gay percentage
\`!crush @user\` — Crush meter
\`!rate <thing>\` — Rate anything
\`!color [hex]\` — View a color

**🎮 Games**
\`!truth\` — Random truth question
\`!dare\` — Random dare
\`!wyr\` — Would you rather?
\`!nhie\` — Never have I ever

**💤 AFK**
\`!afk [reason]\` — Set AFK status

**⏰ Reminders**
\`!remind <time> <msg>\` — Set a reminder

**🎫 Tickets**
\`!ticket create [subject]\` — Open a ticket
\`!ticket close\` — Close a ticket

**⭐ Other**
\`!confess <text>\` — Anonymous confession
\`!steal <emoji>\` — Steal an emoji
\`!banner [@user]\` — User banner
\`!servericon\` — Server icon
\`!membercount\` — Member count
\`!roleinfo @role\` — Role info
\`!channelinfo [#ch]\` — Channel info
${SYM.line}`),
          ],
        });
      } else {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.lana)
              .setTitle("🌸 Lana Del Dey Bot — Commands 🌸")
              .setDescription(
                `${SYM.line}\n\n` +
                `Use \`!help <category>\` for detailed commands\n\n` +
                `﹒🛡️﹒ \`!help mod\` — Moderation\n` +
                `﹒🔧﹒ \`!help util\` — Utility\n` +
                `﹒🎮﹒ \`!help fun\` — Fun & Social\n` +
                `﹒🪙﹒ \`!help eco\` — Economy\n` +
                `﹒⭐﹒ \`!help level\` — Leveling\n` +
                `﹒🎉﹒ \`!help giveaway\` — Giveaways\n` +
                `﹒✨﹒ \`!help extras\` — AFK, Tickets, Text tools, Fun\n\n` +
                `**🎨 Server Setup:**\n` +
                `\`!setup list\` — See all 10 server themes\n` +
                `\`!setup <theme> confirm\` — Apply a theme\n\n` +
                `${SYM.line}`
              )
              .setImage(getLanaGif())
              .setTimestamp()
              .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
          ],
        });
      }
      break;
    }

    case "snipe": {
      const key = message.channel.id;
      const snap = sniped.get(key);
      if (!snap)
        return message.reply({
          embeds: [base(COLORS.info as any).setDescription("❌ Nothing to snipe in this channel!")],
        });

      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setAuthor({ name: snap.author, iconURL: snap.avatar })
        .setDescription(snap.content || "*[no text content]*")
        .setFooter({ text: `Deleted at ${new Date(snap.timestamp).toLocaleTimeString()}` })
        .setTimestamp(snap.timestamp);

      await message.reply({ embeds: [embed] });
      break;
    }

    case "editsnipe": {
      const key = message.channel.id;
      const snap = editSniped.get(key);
      if (!snap)
        return message.reply({
          embeds: [base(COLORS.info as any).setDescription("❌ Nothing to edit snipe in this channel!")],
        });

      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setAuthor({ name: snap.author, iconURL: snap.avatar })
        .addFields(
          { name: "Before", value: snap.before || "*empty*", inline: true },
          { name: "After", value: snap.after || "*empty*", inline: true }
        )
        .setFooter({ text: `Edited at ${new Date(snap.timestamp).toLocaleTimeString()}` })
        .setTimestamp(snap.timestamp);

      await message.reply({ embeds: [embed] });
      break;
    }

    case "serverinfo": {
      const g = message.guild;
      const owner = await g.fetchOwner().catch(() => null);
      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle(`✿ ${g.name}`)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: "👑 Owner", value: owner?.user.tag ?? "Unknown", inline: true },
          { name: "👥 Members", value: g.memberCount.toString(), inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "💬 Channels", value: g.channels.cache.size.toString(), inline: true },
          { name: "🎭 Roles", value: g.roles.cache.size.toString(), inline: true },
          { name: "🌍 Region", value: g.preferredLocale, inline: true }
        )
        .setFooter({ text: `ID: ${g.id} ✿` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      break;
    }

    case "userinfo": {
      const target = message.mentions.members?.first() ?? message.member;
      if (!target) return;
      const user = target.user;
      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle(`﹒⟡﹒ ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "🏷️ Tag", value: user.tag, inline: true },
          { name: "🆔 ID", value: user.id, inline: true },
          { name: "🤖 Bot", value: user.bot ? "Yes" : "No", inline: true },
          { name: "📅 Joined Server", value: `<t:${Math.floor((target.joinedTimestamp ?? 0) / 1000)}:R>`, inline: true },
          { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "🎭 Roles", value: target.roles.cache.size > 1 ? target.roles.cache.filter(r => r.id !== message.guild!.id).map(r => r.toString()).slice(0, 5).join(", ") : "None", inline: false }
        )
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      break;
    }

    case "avatar": {
      const target = message.mentions.users.first() ?? message.author;
      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle(`🖼️ ${target.username}'s avatar`)
        .setImage(target.displayAvatarURL({ size: 512 }))
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` });

      await message.reply({ embeds: [embed] });
      break;
    }

    case "ping": {
      const sent = await message.reply({
        embeds: [base(COLORS.lana).setDescription("🏓 Pinging...")],
      });
      const latency = sent.createdTimestamp - message.createdTimestamp;
      const wsLatency = message.client.ws.ping;
      await sent.edit({
        embeds: [
          aesthetic(
            "🏓 Pong!",
            `﹒📡﹒ Message Latency: **${latency}ms**\n﹒💓﹒ API Latency: **${wsLatency}ms**`,
            COLORS.lana
          ),
        ],
      });
      break;
    }

    case "botinfo": {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle("🌸 Lana Del Dey Bot 🌸")
        .setDescription(
          `${SYM.line}\n\n` +
          `A bot dedicated to the Lana Del Dey aesthetic 💜\n\n` +
          `﹒⚡﹒ **Uptime:** ${hours}h ${mins}m\n` +
          `﹒💻﹒ **Runtime:** Node.js\n` +
          `﹒📦﹒ **Library:** discord.js v14\n` +
          `﹒🔧﹒ **Prefix:** \`!\`\n` +
          `﹒📋﹒ **Commands:** 50+\n\n` +
          `${SYM.line}`
        )
        .setThumbnail(message.client.user?.displayAvatarURL() ?? null)
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      break;
    }

    case "say": {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages as any))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No permission!")] });
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.delete().catch(() => {});
      await message.channel.send(text);
      break;
    }

    case "embed": {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages as any))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ No permission!")] });
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.delete().catch(() => {});
      await message.channel.send({ embeds: [lana("📢 Announcement", text)] });
      break;
    }

    default:
      break;
  }
}
