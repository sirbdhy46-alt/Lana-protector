/**
 * FUN COMMANDS — GIF INTEGRATION GUIDE
 *
 * In your fun.ts file, make sure you import getGif:
 *   import { getGif } from "../utils/gifs.js";
 *
 * Then for each action command, use .setImage(getGif("type")) on the embed.
 *
 * Example patterns to check/add in your fun.ts switch cases:
 */

/*

case "hug": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to hug!")] });
  const embed = base(COLORS.fun)
    .setTitle(`🤗 ${message.author.username} hugged ${target.username}!`)
    .setDescription(`${message.author} gives ${target} the warmest hug 🌸`)
    .setImage(getGif("hug"));
  return message.channel.send({ embeds: [embed] });
}

case "kiss": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to kiss!")] });
  const embed = base(COLORS.relationships)
    .setTitle(`💋 ${message.author.username} kissed ${target.username}!`)
    .setDescription(`${message.author} kisses ${target} 💜`)
    .setImage(getGif("kiss"));
  return message.channel.send({ embeds: [embed] });
}

case "slap": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to slap!")] });
  const embed = base(COLORS.moderation)
    .setTitle(`👋 ${message.author.username} slapped ${target.username}!`)
    .setDescription(`${message.author} slaps ${target} 😤`)
    .setImage(getGif("slap"));
  return message.channel.send({ embeds: [embed] });
}

case "dance": {
  const embed = base(COLORS.fun)
    .setTitle(`💃 ${message.author.username} is dancing!`)
    .setDescription(`${message.author} hits the dance floor ✨`)
    .setImage(getGif("dance"));
  return message.channel.send({ embeds: [embed] });
}

case "fight": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to fight!")] });
  const embed = base(COLORS.moderation)
    .setTitle(`⚔️ ${message.author.username} vs ${target.username}!`)
    .setDescription(`${message.author} challenges ${target} to a fight! ⚡`)
    .setImage(getGif("fight"));
  return message.channel.send({ embeds: [embed] });
}

case "ship": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to ship with!")] });
  const shipScore = Math.floor(Math.random() * 101);
  const meter = "█".repeat(Math.floor(shipScore / 10)) + "░".repeat(10 - Math.floor(shipScore / 10));
  const embed = base(COLORS.relationships)
    .setTitle(`💘 ${message.author.username} ❤️ ${target.username}`)
    .setDescription(
      `**Ship Name:** ${message.author.username.slice(0, 3)}${target.username.slice(0, 3)}\n\n` +
      `**Compatibility:** ${shipScore}%\n` +
      `\`${meter}\`\n\n` +
      (shipScore >= 80 ? "Absolutely soulmates! 💞" :
       shipScore >= 60 ? "A great match! 💕" :
       shipScore >= 40 ? "Could work with effort! 💛" :
       shipScore >= 20 ? "Unlikely but possible! 🌸" : "Not meant to be... 💔")
    )
    .setImage(getGif("ship"));
  return message.channel.send({ embeds: [embed] });
}

case "pat": {
  const target = message.mentions.users.first();
  if (!target) return message.reply({ embeds: [base(COLORS.fun).setDescription("❌ Mention someone to pat!")] });
  const embed = base(COLORS.fun)
    .setTitle(`🥺 ${message.author.username} patted ${target.username}!`)
    .setDescription(`${message.author} gives ${target} a gentle pat 🌸`)
    .setImage(getGif("pat"));
  return message.channel.send({ embeds: [embed] });
}

*/

// SUMMARY OF WHAT'S NEW IN gifs.ts:
// - "ship" GIFs added (was missing!)
// - "pat" GIFs added
// - "poke" GIFs added
// - "cry" GIFs added
// - More "kiss" and "hug" GIFs added
//
// Make sure your fun.ts imports and calls getGif() for all these commands.
// Share fun.ts if you need me to update it for you!
