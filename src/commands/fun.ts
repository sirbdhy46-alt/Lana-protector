import { type Message, EmbedBuilder } from "discord.js";
import { COLORS, base, aesthetic, lana, rand, CUTE, ANIMATED } from "../utils/embeds.js";
import { getGif } from "../utils/gifs.js";

const LANA_QUOTES = [
  "\"I was in the winter of my life, and the men I met along the road were my only summer.\"",
  "\"Who are you? Are you in touch with all of your darkest fantasies?\"",
  "\"I know that I'm a mess, but you're all that I need.\"",
  "\"I am beautiful, sexy, brilliant, and sweet.\"",
  "\"Darling I'm a mess without you.\"",
  "\"Life is beautiful but you don't have a clue.\"",
  "\"It's you, it's you, it's all for you.\"",
  "\"Money is the anthem of success.\"",
  "\"We were born to die.\"",
  "\"Heaven is a place on earth with you.\"",
  "\"Tell me all the things you wanna do.\"",
  "\"Who are you? Are you in touch with all of your darkest fantasies?\"",
  "\"Nothing gold can stay.\"",
  "\"You like your girls insane.\"",
  "\"I was always an unusual girl.\"",
];

const EIGHT_BALL_RESPONSES = [
  "✨ Absolutely yes!",
  "💜 Signs point to yes!",
  "🌸 Definitely!",
  "✿ It is certain!",
  "⟡ Without a doubt!",
  "♡ Yes, definitely!",
  "🌹 You may rely on it!",
  "💫 As I see it, yes!",
  "❀ Outlook good!",
  "✶ It is decidedly so!",
  "🔮 Reply hazy, try again...",
  "⭔ Ask again later...",
  "◎ Better not tell you now...",
  "⟡ Cannot predict now...",
  "✦ Concentrate and ask again...",
  "❌ Don't count on it.",
  "⚠️ My reply is no.",
  "💔 My sources say no.",
  "🌑 Outlook not so good.",
  "☁️ Very doubtful.",
];

export async function handleFun(
  cmd: string,
  message: Message,
  args: string[]
) {
  switch (cmd) {
    case "hug": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to hug!")] });
      await message.channel.send({
        embeds: [
          base(COLORS.fun)
            .setTitle(`🤗 ${message.author.username} hugs ${target.username}!`)
            .setImage(getGif("hug")),
        ],
      });
      break;
    }

    case "slap": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to slap!")] });
      await message.channel.send({
        embeds: [
          base(COLORS.moderation)
            .setTitle(`👋 ${message.author.username} slaps ${target.username}!`)
            .setImage(getGif("slap")),
        ],
      });
      break;
    }

    case "kiss": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to kiss!")] });
      await message.channel.send({
        embeds: [
          base(COLORS.relationships)
            .setTitle(`💋 ${message.author.username} kisses ${target.username}!`)
            .setImage(getGif("kiss")),
        ],
      });
      break;
    }

    case "dance": {
      await message.channel.send({
        embeds: [
          base(COLORS.fun)
            .setTitle(`💃 ${message.author.username} is dancing!`)
            .setImage(getGif("dance")),
        ],
      });
      break;
    }

    case "fight": {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention someone to fight!")] });
      await message.channel.send({
        embeds: [
          base(COLORS.moderation)
            .setTitle(`⚔️ ${message.author.username} fights ${target.username}!`)
            .setImage(getGif("fight")),
        ],
      });
      break;
    }

    case "8ball": {
      const question = args.join(" ");
      if (!question) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Ask a question!")] });
      const resp = rand(EIGHT_BALL_RESPONSES);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle("🔮 Magic 8-Ball")
            .addFields(
              { name: "❓ Question", value: question },
              { name: "🎱 Answer", value: resp }
            )
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
            .setTimestamp(),
        ],
      });
      break;
    }

    case "coinflip": {
      const result = Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
      await message.reply({
        embeds: [aesthetic("🪙 Coin Flip", result, COLORS.economy)],
      });
      break;
    }

    case "dice": {
      const roll = Math.floor(Math.random() * 6) + 1;
      const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
      await message.reply({
        embeds: [aesthetic("🎲 Dice Roll", `${faces[roll - 1]} You rolled a **${roll}**!`, COLORS.games)],
      });
      break;
    }

    case "rps": {
      const choices = ["rock", "paper", "scissors"] as const;
      const emojis: Record<string, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
      const userChoice = args[0]?.toLowerCase() as typeof choices[number] | undefined;
      if (!userChoice || !choices.includes(userChoice))
        return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Choose `rock`, `paper`, or `scissors`!")] });
      const botChoice = rand([...choices]);
      let result = "";
      if (userChoice === botChoice) result = "🤝 **It's a tie!**";
      else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) result = "🎉 **You win!**";
      else result = "💔 **You lose!**";
      await message.reply({
        embeds: [
          aesthetic(
            "✂️ Rock Paper Scissors",
            `${emojis[userChoice]} You: **${userChoice}**\n${emojis[botChoice]} Bot: **${botChoice}**\n\n${result}`,
            COLORS.games
          ),
        ],
      });
      break;
    }

    case "quote": {
      const q = rand(LANA_QUOTES);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle("🌹 Lana Del Dey Quote 🌹")
            .setDescription(q)
            .setFooter({ text: `${rand(CUTE)} — Lana Del Dey` })
            .setTimestamp(),
        ],
      });
      break;
    }

    case "ship": {
      const user1 = message.mentions.users.first();
      const user2 = message.mentions.users.at(1) ?? message.author;
      if (!user1) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Mention at least one user!")] });
      const percent = Math.floor(Math.random() * 101);
      const bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10));
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.relationships)
            .setTitle(`💞 Ship: ${user1.username} x ${user2.username}`)
            .setDescription(
              `\`${bar}\` **${percent}%**\n\n${percent >= 80 ? "💕 Perfect match!" : percent >= 60 ? "💓 Pretty good!" : percent >= 40 ? "💙 It could work..." : "💔 Not looking great..."}`
            )
            .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
        ],
      });
      break;
    }

    case "poll": {
      const pollText = args.join(" ");
      if (!pollText) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Provide a poll question!")] });
      const pollMsg = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.lana)
            .setTitle("📊 Poll")
            .setDescription(pollText)
            .setFooter({ text: `Poll by ${message.author.username} ✿` })
            .setTimestamp(),
        ],
      });
      await pollMsg.react("✅");
      await pollMsg.react("❌");
      await message.delete().catch(() => {});
      break;
    }

    case "roast": {
      const target = message.mentions.users.first() ?? message.author;
      const roasts = [
        `${target.username} has fewer brain cells than a Discord server with no channels.`,
        `${target.username} is the reason Discord added the mute button.`,
        `${target.username}'s WiFi is as slow as their comebacks.`,
        `${target.username} is so basic they make Nitro feel like a chore.`,
        `${target.username} talks so much and says so little.`,
      ];
      await message.reply({
        embeds: [aesthetic("🔥 Roasted!", rand(roasts), COLORS.warn)],
      });
      break;
    }

    case "compliment": {
      const target = message.mentions.users.first() ?? message.author;
      const compliments = [
        `${target.username} has the most beautiful energy in this server 💜`,
        `${target.username} is an absolute gem and we're lucky to have them here! 🌸`,
        `${target.username} radiates main character energy ✨`,
        `${target.username} is so aesthetic it hurts 💕`,
        `${target.username} is the vibe this server needed 🌹`,
      ];
      await message.reply({
        embeds: [lana("💕 Compliment", rand(compliments))],
      });
      break;
    }

    default:
      break;
  }
}
