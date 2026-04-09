import { type Message } from "discord.js";
import {
  get,
  set,
  update,
  getAll,
  defaultEconomy,
  type Economy,
} from "../data/storage.js";
import { COLORS, base, aesthetic, lana, rand, CUTE, formatCoins } from "../utils/embeds.js";
import { getGif } from "../utils/gifs.js";

const WORK_MESSAGES = [
  "You sang a Lana Del Dey song at karaoke and made",
  "You worked at a vintage record store and earned",
  "You sold aesthetic photos online and got",
  "You babysat the neighbour's cat for",
  "You streamed Lana Del Dey for 12 hours and somehow made",
  "You wrote poetry and sold a zine for",
];

function eKey(guildId: string, userId: string) {
  return `eco:${guildId}`;
}

export async function handleEconomy(
  cmd: string,
  message: Message,
  args: string[]
) {
  if (!message.guild) return;
  const gId = message.guildId!;
  const uId = message.author.id;
  const store = eKey(gId, uId);

  switch (cmd) {
    case "balance":
    case "bal": {
      const target = message.mentions.users.first() ?? message.author;
      const eco = get<Economy>(store, target.id, defaultEconomy);
      await message.reply({
        embeds: [
          lana(
            `💰 ${target.username}'s Balance`,
            `﹒👛﹒ **Wallet:** ${formatCoins(eco.balance)}\n﹒🏦﹒ **Bank:** ${formatCoins(eco.bank)}\n﹒💎﹒ **Total:** ${formatCoins(eco.balance + eco.bank)}`
          ),
        ],
      });
      break;
    }

    case "daily": {
      const eco = get<Economy>(store, uId, defaultEconomy);
      const now = Date.now();
      const cooldown = 86_400_000;
      if (now - eco.lastDaily < cooldown) {
        const rem = cooldown - (now - eco.lastDaily);
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        return message.reply({
          embeds: [base(COLORS.warn).setDescription(`⏳ Daily resets in **${h}h ${m}m**!`)],
        });
      }
      const amount = 200 + Math.floor(Math.random() * 300);
      update<Economy>(store, uId, (e) => ({ ...e, balance: e.balance + amount, lastDaily: now }), defaultEconomy);
      await message.reply({
        embeds: [lana("🌸 Daily Claimed!", `You received ${formatCoins(amount)}!\n\n*Come back tomorrow for more!*`)],
      });
      break;
    }

    case "work": {
      const eco = get<Economy>(store, uId, defaultEconomy);
      const now = Date.now();
      const cooldown = 3_600_000;
      if (now - (eco.lastRob ?? 0) < cooldown) {
        const rem = cooldown - (now - eco.lastRob);
        const m = Math.floor(rem / 60000);
        return message.reply({
          embeds: [base(COLORS.warn).setDescription(`⏳ You can work again in **${m}m**!`)],
        });
      }
      const amount = 50 + Math.floor(Math.random() * 200);
      update<Economy>(store, uId, (e) => ({ ...e, balance: e.balance + amount, lastRob: now }), defaultEconomy);
      await message.reply({
        embeds: [lana("💼 Work Complete!", `${rand(WORK_MESSAGES)} ${formatCoins(amount)}!`)],
      });
      break;
    }

    case "pay":
    case "give": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to pay!")] });
      if (target.id === uId) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You can't pay yourself!")] });
      const amount = parseInt(args[1] ?? "0", 10);
      if (!amount || amount <= 0) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a valid amount!")] });
      const eco = get<Economy>(store, uId, defaultEconomy);
      if (eco.balance < amount) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You don't have enough coins!")] });
      update<Economy>(store, uId, (e) => ({ ...e, balance: e.balance - amount }), defaultEconomy);
      update<Economy>(store, target.id, (e) => ({ ...e, balance: e.balance + amount }), defaultEconomy);
      await message.reply({
        embeds: [lana("💸 Payment Sent!", `You paid ${target.username} ${formatCoins(amount)}!`)],
      });
      break;
    }

    case "rob": {
      const target = message.mentions.members?.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to rob!")] });
      if (target.id === uId) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ You can't rob yourself!")] });
      const robber = get<Economy>(store, uId, defaultEconomy);
      const victim = get<Economy>(store, target.id, defaultEconomy);
      const now = Date.now();
      const cooldown = 7_200_000;
      if (now - robber.lastRob < cooldown) {
        const rem = cooldown - (now - robber.lastRob);
        const h = Math.floor(rem / 3600000);
        return message.reply({ embeds: [base(COLORS.warn).setDescription(`⏳ Rob cooldown: **${h}h**`)] });
      }
      if (victim.balance < 100) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ That person doesn't have enough to rob!")] });
      const success = Math.random() < 0.5;
      if (success) {
        const stolen = Math.floor(victim.balance * 0.2);
        update<Economy>(store, uId, (e) => ({ ...e, balance: e.balance + stolen, lastRob: now }), defaultEconomy);
        update<Economy>(store, target.id, (e) => ({ ...e, balance: e.balance - stolen }), defaultEconomy);
        await message.channel.send({
          embeds: [base(COLORS.warn).setTitle("🦹 Rob Success!").setDescription(`You robbed ${formatCoins(stolen)} from ${target.user.username}!`).setImage(getGif("rob"))],
        });
      } else {
        const fine = Math.floor(robber.balance * 0.1);
        update<Economy>(store, uId, (e) => ({ ...e, balance: Math.max(0, e.balance - fine), lastRob: now }), defaultEconomy);
        await message.reply({
          embeds: [base(COLORS.error).setTitle("🚨 Caught!").setDescription(`You got caught robbing ${target.user.username} and paid a fine of ${formatCoins(fine)}!`)],
        });
      }
      break;
    }

    case "deposit":
    case "dep": {
      const amount = args[0]?.toLowerCase() === "all"
        ? get<Economy>(store, uId, defaultEconomy).balance
        : parseInt(args[0] ?? "0", 10);
      if (!amount || amount <= 0) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a valid amount!")] });
      const eco = get<Economy>(store, uId, defaultEconomy);
      if (eco.balance < amount) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Not enough in wallet!")] });
      update<Economy>(store, uId, (e) => ({ ...e, balance: e.balance - amount, bank: e.bank + amount }), defaultEconomy);
      await message.reply({ embeds: [lana("🏦 Deposited!", `Deposited ${formatCoins(amount)} to your bank!`)] });
      break;
    }

    case "withdraw":
    case "with": {
      const amount = args[0]?.toLowerCase() === "all"
        ? get<Economy>(store, uId, defaultEconomy).bank
        : parseInt(args[0] ?? "0", 10);
      if (!amount || amount <= 0) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a valid amount!")] });
      const eco = get<Economy>(store, uId, defaultEconomy);
      if (eco.bank < amount) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Not enough in bank!")] });
      update<Economy>(store, uId, (e) => ({ ...e, bank: e.bank - amount, balance: e.balance + amount }), defaultEconomy);
      await message.reply({ embeds: [lana("💳 Withdrawn!", `Withdrew ${formatCoins(amount)} to your wallet!`)] });
      break;
    }

    case "leaderboard":
    case "lb": {
      if (args[0]?.toLowerCase() === "levels") break;
      const all = getAll<Economy>(`eco:${gId}`);
      const sorted = Object.entries(all)
        .sort(([, a], [, b]) => (b.balance + b.bank) - (a.balance + a.bank))
        .slice(0, 10);

      if (sorted.length === 0)
        return message.reply({ embeds: [base(COLORS.info as any).setDescription("No economy data yet!")] });

      const medals = ["🥇", "🥈", "🥉"];
      const list = sorted.map(([id, eco], i) => {
        const m = medals[i] ?? `**${i + 1}.**`;
        return `${m} <@${id}> — ${formatCoins(eco.balance + eco.bank)}`;
      }).join("\n");

      await message.reply({
        embeds: [lana("💰 Economy Leaderboard", list)],
      });
      break;
    }

    case "shop": {
      await message.reply({
        embeds: [
          lana("🛒 Shop", `
﹒🌸﹒ **Aesthetic Badge** — 500 coins
﹒💜﹒ **Lana Fan Badge** — 1000 coins
﹒✨﹒ **VIP Pass** — 5000 coins
﹒🛡️﹒ **Rob Shield (24h)** — 800 coins

*Use \`!buy <item name>\` to purchase!*
          `),
        ],
      });
      break;
    }

    default:
      break;
  }
}
