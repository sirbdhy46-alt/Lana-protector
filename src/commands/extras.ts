import {
  type Message,
  type Client,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  type TextChannel,
  type GuildMember,
} from "discord.js";
import {
  get, set, del, getAll, update,
  defaultSettings,
  type GuildSettings,
  type AfkEntry,
  type Ticket,
  type Reminder,
  type StarboardEntry,
} from "../data/storage.js";
import { COLORS, base, lana, rand, CUTE, HEARTS, ROMANTIC, SYM } from "../utils/embeds.js";
import { getLanaGif } from "../utils/gifs.js";

function gKey(guildId: string) { return `settings:${guildId}`; }

function timeStr(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function parseTime(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return 0;
  const n = parseInt(match[1]!, 10);
  const u: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (u[match[2]!.toLowerCase()] ?? 0);
}

const aestheticMap: Record<string, string> = {
  a:"ａ",b:"ｂ",c:"ｃ",d:"ｄ",e:"ｅ",f:"ｆ",g:"ｇ",h:"ｈ",i:"ｉ",j:"ｊ",
  k:"ｋ",l:"ｌ",m:"ｍ",n:"ｎ",o:"ｏ",p:"ｐ",q:"ｑ",r:"ｒ",s:"ｓ",t:"ｔ",
  u:"ｕ",v:"ｖ",w:"ｗ",x:"ｘ",y:"ｙ",z:"ｚ",
  A:"Ａ",B:"Ｂ",C:"Ｃ",D:"Ｄ",E:"Ｅ",F:"Ｆ",G:"Ｇ",H:"Ｈ",I:"Ｉ",J:"Ｊ",
  K:"Ｋ",L:"Ｌ",M:"Ｍ",N:"Ｎ",O:"Ｏ",P:"Ｐ",Q:"Ｑ",R:"Ｒ",S:"Ｓ",T:"Ｔ",
  U:"Ｕ",V:"Ｖ",W:"Ｗ",X:"Ｘ",Y:"Ｙ",Z:"Ｚ",
  " ":"　","0":"０","1":"１","2":"２","3":"３","4":"４","5":"５","6":"６","7":"７","8":"８","9":"９",
};

function toAesthetic(text: string) {
  return text.split("").map(c => aestheticMap[c] ?? c).join("");
}

function toMock(text: string) {
  return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

function toUwu(text: string) {
  return text
    .replace(/r|l/g, "w")
    .replace(/R|L/g, "W")
    .replace(/n([aeiou])/g, "ny$1")
    .replace(/N([aeiou])/g, "Ny$1")
    .replace(/ove/g, "uv")
    .replace(/\./g, "! uwu")
    .replace(/!/g, "!! nyaa~");
}

function toOwo(text: string) {
  return toUwu(text)
    .replace(/\s/g, " owo ")
    .trim();
}

function toClap(text: string) {
  return text.trim().split(/\s+/).join(" 👏 ");
}

function toMorse(text: string) {
  const M: Record<string, string> = {
    a:".-",b:"-...",c:"-.-.",d:"-..",e:".",f:"..-.",g:"--.",h:"....",i:"..",
    j:".---",k:"-.-",l:".-..",m:"--",n:"-.",o:"---",p:".--.",q:"--.-",r:".-.",
    s:"...",t:"-",u:"..-",v:"...-",w:".--",x:"-..-",y:"-.--",z:"--..",
    "1":".----","2":"..---","3":"...--","4":"....-","5":".....",
    "6":"-....","7":"--...","8":"---..","9":"----.","0":"-----",
    " ":"/",
  };
  return text.toLowerCase().split("").map(c => M[c] ?? c).join(" ");
}

function toBinary(text: string) {
  return text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8,"0")).join(" ");
}

const TRUTHS = [
  "What's the most embarrassing thing you've done for someone you liked?",
  "Have you ever lied to get out of plans?",
  "What's your biggest fear?",
  "Who in this server do you think is the most aesthetic?",
  "What's the weirdest thing you've searched online?",
  "Have you ever ghosted someone? Do you regret it?",
  "What song describes your life right now?",
  "What's a secret you've never told anyone?",
  "Who's your biggest celebrity crush?",
  "What's the most cringe thing in your camera roll?",
];

const DARES = [
  "Change your server nickname to 'Lana Del Dey Fan' for 10 minutes",
  "Send a voice message singing the first line of a Lana Del Dey song",
  "Write a poem about the last person who messaged you",
  "Type everything in uwu speak for the next 5 minutes",
  "Send your most aesthetic photo",
  "React to the last 5 messages with random emojis",
  "Confess your most unhinged opinion about anything",
  "Write 'I love Lana Del Dey' in another language",
  "Send a voice message saying 'Lana Del Dey forever' dramatically",
  "Draw something in 60 seconds and send it",
];

const WYR = [
  "Would you rather listen to only Summertime Sadness forever OR only Born To Die forever?",
  "Would you rather live in a Lana Del Dey music video OR a Taylor Swift music video?",
  "Would you rather have no music for a week OR no internet for a week?",
  "Would you rather be famous but unhappy OR unknown but happy?",
  "Would you rather go back in time OR fast forward to the future?",
  "Would you rather lose your voice OR lose your hearing?",
  "Would you rather have the ability to fly OR be invisible?",
  "Would you rather live by the ocean OR in the mountains?",
  "Would you rather have unlimited money OR unlimited time?",
  "Would you rather know when you die OR how you die?",
];

export async function handleExtras(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;
  const gId = message.guildId!;
  const uId = message.author.id;
  const settings = get<GuildSettings>(gKey(gId), "data", defaultSettings);

  switch (cmd) {

    case "afk": {
      const reason = args.join(" ") || "AFK";
      set<AfkEntry>(`afk:${gId}`, uId, { reason, timestamp: Date.now() });
      await message.reply({
        embeds: [lana("💤 AFK Set", `You're now AFK with reason: **${reason}**\nYou'll be unset when you next send a message!`)],
      });
      break;
    }

    case "remind":
    case "reminder": {
      const timeArg = args[0];
      const reminderMsg = args.slice(1).join(" ");
      if (!timeArg || !reminderMsg) {
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!remind <time> <message>`\nExample: `!remind 30m feed my cat`")] });
      }
      const ms = parseTime(timeArg);
      if (!ms) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Invalid time! Use: `30s`, `5m`, `2h`, `1d`")] });
      if (ms > 86400000 * 7) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Maximum reminder time is 7 days!")] });

      const fireAt = Date.now() + ms;
      const key = `${uId}:${fireAt}`;
      const reminder: Reminder = { userId: uId, channelId: message.channel.id, message: reminderMsg, fireAt };
      set("reminders", key, reminder);

      await message.reply({
        embeds: [lana("⏰ Reminder Set!", `I'll remind you in **${timeStr(ms)}**!\n\nMessage: *${reminderMsg}*`)],
      });
      break;
    }

    case "ticket": {
      const sub = args[0]?.toLowerCase();
      if (!sub || sub === "create" || sub === "new" || sub === "open") {
        const subject = args.slice(1).join(" ") || "Support needed";
        if (!settings.ticketCategory) {
          return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Ticket category not set up! Run `!setup confirm` first.")] });
        }
        const existing = getAll<Ticket>("tickets");
        const userOpen = Object.values(existing).find(t => t.userId === uId && t.guildId === gId && t.open);
        if (userOpen) {
          return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ You already have an open ticket: <#${userOpen.channelId}>`)] });
        }
        const ch = await message.guild.channels.create({
          name: `🎫│ticket-${message.author.username.slice(0,10).toLowerCase()}`,
          type: ChannelType.GuildText,
          parent: settings.ticketCategory,
          permissionOverwrites: [
            { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: uId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            ...(message.guild.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.ManageChannels)).map(r => ({
              id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            }))),
          ],
          topic: `Ticket for ${message.author.tag} | ${subject}`,
        }).catch(() => null);
        if (!ch) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Failed to create ticket channel!")] });
        const ticket: Ticket = { channelId: ch.id, userId: uId, guildId: gId, createdAt: Date.now(), open: true, subject };
        set("tickets", `${gId}:${ch.id}`, ticket);
        await (ch as TextChannel).send({
          embeds: [
            lana("🎫 Ticket Created!", `Welcome ${message.author}! 💜\n\n**Subject:** ${subject}\n\nA staff member will be with you shortly.\nUse \`!ticket close\` to close this ticket.`),
          ],
        });
        await message.reply({ embeds: [lana("🎫 Ticket Opened!", `Your ticket has been created: ${ch}`)] });
      } else if (sub === "close") {
        const t = get<Ticket>("tickets", `${gId}:${message.channel.id}`, null as any);
        if (!t || !t.open) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ This isn't a ticket channel!")] });
        const isOwner = t.userId === uId;
        const isStaff = message.member?.permissions.has(PermissionFlagsBits.ManageChannels);
        if (!isOwner && !isStaff) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Only the ticket owner or staff can close this!")] });
        set("tickets", `${gId}:${message.channel.id}`, { ...t, open: false });
        await message.channel.send({ embeds: [lana("🔒 Ticket Closing", "This ticket will be deleted in 5 seconds...")] });
        setTimeout(() => message.channel.delete().catch(() => {}), 5000);
      }
      break;
    }

    case "starboard": {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) break;
      const num = parseInt(args[0] ?? "3", 10);
      if (isNaN(num) || num < 1) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a valid number!")] });
      const updated: GuildSettings = { ...settings, starboardMin: num };
      set(gKey(gId), "data", updated);
      await message.reply({ embeds: [lana("⭐ Starboard Updated", `Messages now need **${num} ⭐** to appear on the starboard!`)] });
      break;
    }

    case "confess": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a confession! `!confess <your secret>`")] });
      const confessChannel = message.guild.channels.cache.find(c => c.name.includes("confession") && c.isTextBased());
      const target = (confessChannel ?? message.channel) as TextChannel;
      await message.delete().catch(() => {});
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle("🤫 Anonymous Confession")
            .setDescription(`${SYM.line}\n\n*"${text}"*\n\n${SYM.line}`)
            .setFooter({ text: `${rand(CUTE)} sent anonymously via lana del dey bot ✿` })
            .setTimestamp(),
        ],
      });
      break;
    }

    case "aesthetic":
    case "ae": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text! `!aesthetic <text>`")] });
      await message.reply({ embeds: [lana("✨ Aesthetic Text", `\`\`\`\n${toAesthetic(text)}\n\`\`\`\n${toAesthetic(text)}`)] });
      break;
    }

    case "clap": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(`👏 ${toClap(text)} 👏`);
      break;
    }

    case "mock": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(toMock(text));
      break;
    }

    case "uwu": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(toUwu(text));
      break;
    }

    case "owo": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(toOwo(text));
      break;
    }

    case "reverse": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(text.split("").reverse().join(""));
      break;
    }

    case "morse": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      const m = toMorse(text);
      await message.reply({ embeds: [lana("📡 Morse Code", `**Input:** ${text}\n**Morse:** \`${m.slice(0, 800)}\``)] });
      break;
    }

    case "binary": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      const bin = toBinary(text);
      await message.reply({ embeds: [lana("💻 Binary", `**Input:** ${text}\n**Binary:** \`${bin.slice(0, 800)}\``)] });
      break;
    }

    case "spoiler": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      await message.reply(`||${text.split("").join("||||")}||`);
      break;
    }

    case "emojify": {
      const text = args.join(" ");
      if (!text) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide text!")] });
      const result = text.toLowerCase().split("").map(c => {
        if (c >= "a" && c <= "z") return `:regional_indicator_${c}: `;
        if (c === " ") return "   ";
        if (c >= "0" && c <= "9") return ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"][parseInt(c)]! + " ";
        return c;
      }).join("");
      await message.reply(result.slice(0, 1990) || "nothing");
      break;
    }

    case "vibe": {
      const target = message.mentions.users.first() ?? message.author;
      const pct = Math.floor(Math.random() * 101);
      const vibes = ["✨ ethereal", "🌸 dreamy", "🌙 mysterious", "💜 aesthetic", "🌹 romantic", "⚡ electric", "🌊 oceanic", "🍯 golden", "🌿 indie", "☁️ cottagecore"];
      const v = rand(vibes);
      const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
      await message.reply({
        embeds: [lana("✨ Vibe Check", `${target.username}'s vibe: **${v}**\n\`${bar}\` **${pct}%**\n\n*Certified Lana Del Dey energy*`)],
      });
      break;
    }

    case "iq": {
      const target = message.mentions.users.first() ?? message.author;
      const iq = 60 + Math.floor(Math.random() * 141);
      const label = iq < 70 ? "🧸 needs help" : iq < 100 ? "🌸 average" : iq < 130 ? "✨ above average" : iq < 160 ? "🔮 genius" : "🌌 transcendent";
      await message.reply({ embeds: [lana("🧠 IQ Test", `**${target.username}**'s IQ: **${iq}** — ${label}`)] });
      break;
    }

    case "pp": {
      const target = message.mentions.users.first() ?? message.author;
      const size = Math.floor(Math.random() * 20);
      const pp = "8" + "=".repeat(size) + "D";
      await message.reply({ embeds: [lana("🌸 PP Meter", `**${target.username}**'s pp:\n\`${pp}\`\n*(${size} inches)*`)] });
      break;
    }

    case "gay":
    case "gayrate": {
      const target = message.mentions.users.first() ?? message.author;
      const pct = Math.floor(Math.random() * 101);
      const bar = "🏳️‍🌈".repeat(Math.ceil(pct / 20));
      await message.reply({ embeds: [lana("🏳️‍🌈 Gay Meter", `**${target.username}** is **${pct}% gay**!\n${bar}`)] });
      break;
    }

    case "crush":
    case "crushrate": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone!")] });
      const pct = Math.floor(Math.random() * 101);
      const heart = rand(HEARTS);
      await message.reply({
        embeds: [lana("💘 Crush Rate", `${message.author.username} **${heart}** ${target.username}\n\nCompatibility: **${pct}%** ${pct > 80 ? "🔥 meant to be!" : pct > 50 ? "💕 there's potential!" : "💔 maybe not..."}`)],
      });
      break;
    }

    case "rate": {
      const text = args.join(" ") || message.author.username;
      const pct = Math.floor(Math.random() * 101);
      await message.reply({ embeds: [lana("⭐ Rating", `I rate **${text}** a **${pct}/100**!\n${pct > 80 ? "🌟 iconic" : pct > 50 ? "✨ decent" : pct > 25 ? "😐 meh" : "💀 yikes"}`)] });
      break;
    }

    case "color":
    case "colour": {
      const hex = args[0]?.replace("#", "") ?? Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
      const num = parseInt(hex, 16);
      if (isNaN(num)) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a valid hex! Example: `!color ff6bbd`")] });
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(num)
            .setTitle(`🎨 #${hex.toUpperCase()}`)
            .addFields(
              { name: "🔴 Red", value: r.toString(), inline: true },
              { name: "🟢 Green", value: g.toString(), inline: true },
              { name: "🔵 Blue", value: b.toString(), inline: true },
            )
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
      break;
    }

    case "truth": {
      await message.reply({ embeds: [lana("🎯 Truth!", rand(TRUTHS))] });
      break;
    }

    case "dare": {
      await message.reply({ embeds: [lana("😈 Dare!", rand(DARES))] });
      break;
    }

    case "wyr":
    case "wouldyourather": {
      await message.reply({ embeds: [lana("🤔 Would You Rather?", rand(WYR))] });
      break;
    }

    case "neverhaveiever":
    case "nhie": {
      const NHIE = [
        "Never have I ever sent a text to the wrong person",
        "Never have I ever lied about my age online",
        "Never have I ever cried to a Lana Del Dey song",
        "Never have I ever ghosted someone I liked",
        "Never have I ever fallen asleep in class",
        "Never have I ever eaten an entire pizza by myself",
        "Never have I ever pretended to be asleep to avoid a conversation",
        "Never have I ever stalked someone's social media for over an hour",
      ];
      await message.reply({ embeds: [lana("🙈 Never Have I Ever!", rand(NHIE))] });
      break;
    }

    case "steal": {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You need **Manage Emojis** permission!")] });
      }
      const emojiArg = args[0];
      if (!emojiArg) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide an emoji to steal!")] });
      const match = emojiArg.match(/<(?:a)?:(\w+):(\d+)>/);
      if (!match) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a custom emoji!")] });
      const [, name, id] = match;
      const isAnimated = emojiArg.startsWith("<a:");
      const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? "gif" : "png"}`;
      const emoji = await message.guild.emojis.create({ attachment: url, name: name! }).catch(() => null);
      if (!emoji) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Failed to steal emoji!")] });
      await message.reply({ embeds: [lana("✨ Emoji Stolen!", `Successfully added ${emoji} **:${name}:**!`)] });
      break;
    }

    case "banner": {
      const target = message.mentions.users.first() ?? message.author;
      const fetched = await target.fetch(true).catch(() => null);
      if (!fetched?.banner) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ This user has no banner!")] });
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle(`🖼️ ${target.username}'s Banner`)
            .setImage(fetched.bannerURL({ size: 4096 }) ?? "")
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
      break;
    }

    case "servericon": {
      const icon = message.guild.iconURL({ size: 4096 });
      if (!icon) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ This server has no icon!")] });
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle(`🖼️ ${message.guild.name} Icon`)
            .setImage(icon)
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
      break;
    }

    case "serverbanner": {
      const banner = message.guild.bannerURL({ size: 4096 });
      if (!banner) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ This server has no banner!")] });
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle(`🖼️ ${message.guild.name} Banner`)
            .setImage(banner)
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
      break;
    }

    case "membercount":
    case "mc": {
      const total = message.guild.memberCount;
      const bots = message.guild.members.cache.filter(m => m.user.bot).size;
      await message.reply({
        embeds: [lana("👥 Member Count", `﹒👥﹒ **Total:** ${total}\n﹒👤﹒ **Humans:** ${total - bots}\n﹒🤖﹒ **Bots:** ${bots}`)],
      });
      break;
    }

    case "roleinfo": {
      const role = message.mentions.roles.first() ?? message.guild.roles.cache.get(args[0] ?? "");
      if (!role) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention a role!")] });
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(role.color || (COLORS.lana as number))
            .setTitle(`🎭 ${role.name}`)
            .addFields(
              { name: "🆔 ID", value: role.id, inline: true },
              { name: "👥 Members", value: role.members.size.toString(), inline: true },
              { name: "📅 Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
              { name: "🎨 Color", value: role.hexColor, inline: true },
              { name: "📌 Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
              { name: "🔔 Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
            )
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
            .setTimestamp(),
        ],
      });
      break;
    }

    case "channelinfo": {
      const ch = message.mentions.channels.first() ?? message.channel;
      if (!ch || !ch.isTextBased()) return;
      const tc = ch as TextChannel;
      await message.reply({
        embeds: [
          lana("📢 Channel Info",
            `﹒📢﹒ **Name:** #${tc.name}\n﹒🆔﹒ **ID:** ${tc.id}\n﹒📅﹒ **Created:** <t:${Math.floor(tc.createdTimestamp! / 1000)}:R>\n﹒📝﹒ **Topic:** ${(tc as any).topic ?? "none"}`
          ),
        ],
      });
      break;
    }

    default:
      break;
  }
}

export function startReminders(client: Client) {
  setInterval(async () => {
    const all = getAll<Reminder>("reminders");
    const now = Date.now();
    for (const [key, r] of Object.entries(all)) {
      if (now < r.fireAt) continue;
      try {
        const ch = await client.channels.fetch(r.channelId).catch(() => null) as TextChannel | null;
        if (ch?.isTextBased()) {
          await (ch as TextChannel).send({
            content: `<@${r.userId}>`,
            embeds: [lana("⏰ Reminder!", `You asked me to remind you:\n\n*${r.message}*`)],
          });
        }
      } catch {}
      del("reminders", key);
    }
  }, 15_000);
}

export async function handleAfkCheck(message: Message) {
  if (!message.guild || message.author.bot) return;
  const gId = message.guildId!;
  const uId = message.author.id;

  const afk = get<AfkEntry | null>(`afk:${gId}`, uId, null);
  if (afk) {
    del(`afk:${gId}`, uId);
    await message.reply({
      embeds: [lana("👋 Welcome Back!", `Your AFK has been removed!\nYou were away for **${timeStr(Date.now() - afk.timestamp)}**`)],
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
  }

  for (const mentioned of message.mentions.users.values()) {
    if (mentioned.id === uId) continue;
    const mAfk = get<AfkEntry | null>(`afk:${gId}`, mentioned.id, null);
    if (mAfk) {
      await message.reply({
        embeds: [base(COLORS.warn).setDescription(`💤 **${mentioned.username}** is AFK: *${mAfk.reason}*\n*(away for ${timeStr(Date.now() - mAfk.timestamp)})*`)],
      }).catch(() => {});
    }
  }
}

export async function handleStarboard(message: Message, client: Client) {
  if (!message.guild || !message.channel.isTextBased()) return;
  const gId = message.guildId!;
  const settings = get<GuildSettings>(`settings:${gId}`, "data", defaultSettings);
  if (!settings.starboardChannel) return;

  const starCh = message.guild.channels.cache.get(settings.starboardChannel) as TextChannel | null;
  if (!starCh) return;

  const reaction = message.reactions.cache.get("⭐");
  if (!reaction) return;

  const count = reaction.count ?? 0;
  if (count < settings.starboardMin) return;

  const existing = get<StarboardEntry | null>("starboard", `${gId}:${message.id}`, null);
  if (existing) {
    try {
      const starMsg = await starCh.messages.fetch(existing.starboardId).catch(() => null);
      if (starMsg) {
        await starMsg.edit({ content: `⭐ **${count}** — <#${message.channel.id}>` });
      }
    } catch {}
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.lana)
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setDescription(message.content || "*[no text]*")
    .addFields({ name: "Source", value: `[Jump to message](${message.url})` })
    .setTimestamp(message.createdAt)
    .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` });

  if (message.attachments.first()) {
    embed.setImage(message.attachments.first()!.url);
  }

  const sent = await starCh.send({
    content: `⭐ **${count}** — <#${message.channel.id}>`,
    embeds: [embed],
  }).catch(() => null);

  if (sent) {
    set<StarboardEntry>("starboard", `${gId}:${message.id}`, {
      originalId: message.id,
      starboardId: sent.id,
      stars: count,
      channelId: message.channel.id,
    });
  }
}
