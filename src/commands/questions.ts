import {
  type Message,
  type Client,
  type ButtonInteraction,
  type Guild,
  type GuildEmoji,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { base, aesthetic, COLORS, rand, CUTE } from "../utils/embeds.js";
import { get, set } from "../data/storage.js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type QuestionOption = {
  roleId: string;
  emoji: string;
  label: string;
};

export type QuestionCategory = {
  name: string;
  emoji: string;
  options: QuestionOption[];
};

export type QuestionData = {
  channelId: string;
  messageId: string;
  categories: QuestionCategory[];
};

function dataKey(guildId: string) { return `questions:${guildId}`; }

function defaultData(): QuestionData {
  return {
    channelId: "",
    messageId: "",
    categories: [
      { name: "Age", emoji: "🎂", options: [] },
      { name: "Relationship", emoji: "💕", options: [] },
      { name: "Games", emoji: "🎮", options: [] },
      { name: "Country", emoji: "🌍", options: [] },
    ],
  };
}

// ─── PRESET ROLES ─────────────────────────────────────────────────────────────

const PRESETS: { category: string; label: string; color: number; searchEmoji: string; fallbackEmoji: string }[] = [
  // Age
  { category: "age",         label: "13 - 17",        color: 0xffd6e0, searchEmoji: "teen",         fallbackEmoji: "🧒" },
  { category: "age",         label: "18 - 21",        color: 0xffb3c6, searchEmoji: "young",         fallbackEmoji: "🧑" },
  { category: "age",         label: "22 - 25",        color: 0xff85a1, searchEmoji: "adult",         fallbackEmoji: "👤" },
  { category: "age",         label: "26+",            color: 0xc9184a, searchEmoji: "mature",        fallbackEmoji: "👴" },

  // Relationship
  { category: "relationship", label: "Single",         color: 0xffd6ff, searchEmoji: "single",       fallbackEmoji: "🕊️" },
  { category: "relationship", label: "Taken",          color: 0xff6b9d, searchEmoji: "couple",       fallbackEmoji: "💑" },
  { category: "relationship", label: "Complicated",    color: 0xc77dff, searchEmoji: "confused",     fallbackEmoji: "😵" },
  { category: "relationship", label: "Married",        color: 0xe040fb, searchEmoji: "wedding",      fallbackEmoji: "💍" },

  // Games
  { category: "games",       label: "Minecraft",      color: 0x5b8a00, searchEmoji: "minecraft",    fallbackEmoji: "⛏️" },
  { category: "games",       label: "Roblox",         color: 0xff0000, searchEmoji: "roblox",       fallbackEmoji: "🟥" },
  { category: "games",       label: "Valorant",       color: 0xff4655, searchEmoji: "valorant",     fallbackEmoji: "🔫" },
  { category: "games",       label: "Fortnite",       color: 0x00d4ff, searchEmoji: "fortnite",     fallbackEmoji: "🎯" },
  { category: "games",       label: "GTA V",          color: 0x0d7377, searchEmoji: "gta",          fallbackEmoji: "🚗" },
  { category: "games",       label: "Among Us",       color: 0x6c63ff, searchEmoji: "among",        fallbackEmoji: "🟣" },

  // Country
  { category: "country",     label: "India",          color: 0xff9933, searchEmoji: "india",        fallbackEmoji: "🇮🇳" },
  { category: "country",     label: "USA",            color: 0x3c3b6e, searchEmoji: "usa",          fallbackEmoji: "🇺🇸" },
  { category: "country",     label: "UK",             color: 0x012169, searchEmoji: "uk",           fallbackEmoji: "🇬🇧" },
  { category: "country",     label: "Philippines",    color: 0xfcd116, searchEmoji: "philippines",  fallbackEmoji: "🇵🇭" },
  { category: "country",     label: "Pakistan",       color: 0x01411c, searchEmoji: "pakistan",     fallbackEmoji: "🇵🇰" },
  { category: "country",     label: "Germany",        color: 0xffcc00, searchEmoji: "germany",      fallbackEmoji: "🇩🇪" },
  { category: "country",     label: "Other",          color: 0x888888, searchEmoji: "world",        fallbackEmoji: "🌐" },
];

// ─── EMOJI.GG INTEGRATION ────────────────────────────────────────────────────

type EmojiGgEntry = {
  id: string;
  title: string;
  slug: string;
  image: string;
};

let emojiGgCache: EmojiGgEntry[] | null = null;
let emojiGgCacheTime = 0;

async function fetchEmojiGgList(): Promise<EmojiGgEntry[]> {
  const now = Date.now();
  if (emojiGgCache && now - emojiGgCacheTime < 10 * 60 * 1000) return emojiGgCache;
  try {
    const res = await fetch("https://emoji.gg/api/");
    if (!res.ok) return [];
    emojiGgCache = (await res.json()) as EmojiGgEntry[];
    emojiGgCacheTime = now;
    return emojiGgCache;
  } catch {
    return [];
  }
}

async function searchEmojiGg(term: string): Promise<string | null> {
  const list = await fetchEmojiGgList();
  if (list.length === 0) return null;
  const t = term.toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = term.toLowerCase().split(/\s+/);

  const exact = list.find(e => e.title.toLowerCase().replace(/[^a-z0-9]/g, "") === t);
  if (exact) return exact.image;

  const partial = list.find(e => e.title.toLowerCase().includes(t) || t.includes(e.title.toLowerCase().replace(/[^a-z0-9]/g, "")));
  if (partial) return partial.image;

  const wordMatch = list.find(e => words.some(w => w.length > 2 && e.title.toLowerCase().includes(w)));
  if (wordMatch) return wordMatch.image;

  return null;
}

async function uploadEmojiToGuild(guild: Guild, imageUrl: string, name: string): Promise<GuildEmoji | null> {
  try {
    const safeName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32) || "custom_emoji";
    const emoji = await guild.emojis.create({ attachment: imageUrl, name: safeName });
    return emoji;
  } catch {
    return null;
  }
}

async function autoEmoji(guild: Guild, searchTerm: string, fallback: string): Promise<string> {
  const imageUrl = await searchEmojiGg(searchTerm);
  if (!imageUrl) return fallback;
  const uploaded = await uploadEmojiToGuild(guild, imageUrl, searchTerm);
  if (!uploaded) return fallback;
  return uploaded.toString();
}

// ─── PANEL UI ────────────────────────────────────────────────────────────────

const DIVIDER = "✦ ·────────────────────────· ✦";

function buildPanelEmbed(guildName: string, categories: QuestionCategory[]) {
  const catLines = categories
    .map(c => `${c.emoji} **${c.name}** — ${c.options.length === 0 ? "*Not configured yet*" : c.options.map(o => `${o.emoji} ${o.label}`).join("  ·  ")}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(COLORS.lana)
    .setTitle(`✿ ── Get Your Roles ── ✿`)
    .setDescription(
      `> *Welcome to **${guildName}**!*\n` +
      `> Tell us a little about yourself by picking your roles below.\n\n` +
      `${DIVIDER}\n\n` +
      `${catLines}\n\n` +
      `${DIVIDER}\n\n` +
      `*Click a category button · Roles update instantly · All private*`
    )
    .setFooter({ text: `${rand(CUTE)} lana del dey bot  ✦  roles are yours to keep!` })
    .setTimestamp();
}

function buildCategoryRows(categories: QuestionCategory[]) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let row = new ActionRowBuilder<ButtonBuilder>();
  let count = 0;
  const styles = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger];

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]!;
    if (count > 0 && count % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder<ButtonBuilder>();
    }
    const btn = new ButtonBuilder()
      .setCustomId(`qcat:${cat.name.toLowerCase()}`)
      .setLabel(cat.name)
      .setStyle(styles[i % styles.length]!);
    if (!cat.emoji.startsWith("<")) btn.setEmoji(cat.emoji);
    row.addComponents(btn);
    count++;
  }
  if (count > 0) rows.push(row);
  return rows;
}

function buildRoleRows(options: QuestionOption[], memberRoleIds: Set<string>) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let row = new ActionRowBuilder<ButtonBuilder>();
  let count = 0;

  for (const opt of options) {
    if (count > 0 && count % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder<ButtonBuilder>();
    }
    const hasRole = memberRoleIds.has(opt.roleId);
    const btn = new ButtonBuilder()
      .setCustomId(`qrole:${opt.roleId}`)
      .setLabel(opt.label)
      .setStyle(hasRole ? ButtonStyle.Success : ButtonStyle.Secondary);
    try { if (opt.emoji) btn.setEmoji(opt.emoji); } catch {}
    row.addComponents(btn);
    count++;
  }
  if (count > 0) rows.push(row);
  return rows;
}

// ─── POST / REFRESH PANEL ─────────────────────────────────────────────────────

export async function postQuestionPanel(client: Client, guildId: string, channelId: string): Promise<boolean> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return false;
  const ch = client.channels.cache.get(channelId);
  if (!ch?.isTextBased()) return false;

  const data = get<QuestionData>(dataKey(guildId), "data", defaultData());

  // Delete old panel message if exists
  if (data.messageId && data.channelId) {
    try {
      const oldCh = client.channels.cache.get(data.channelId);
      if (oldCh?.isTextBased()) {
        const oldMsg = await (oldCh as any).messages.fetch(data.messageId).catch(() => null);
        if (oldMsg) await oldMsg.delete().catch(() => {});
      }
    } catch {}
  }

  const embed = buildPanelEmbed(guild.name, data.categories);
  const rows = buildCategoryRows(data.categories);
  if (rows.length === 0) return false;

  const msg = await (ch as any).send({ embeds: [embed], components: rows });
  set(dataKey(guildId), "data", { ...data, channelId, messageId: msg.id });
  return true;
}

async function refreshPanel(client: Client, guildId: string) {
  const data = get<QuestionData>(dataKey(guildId), "data", defaultData());
  if (!data.messageId || !data.channelId) return;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const ch = client.channels.cache.get(data.channelId);
  if (!ch?.isTextBased()) return;
  try {
    const msg = await (ch as any).messages.fetch(data.messageId).catch(() => null);
    if (!msg) return;
    await msg.edit({ embeds: [buildPanelEmbed(guild.name, data.categories)], components: buildCategoryRows(data.categories) });
  } catch {}
}

// ─── REGISTER BUTTON HANDLER ──────────────────────────────────────────────────

export function registerQuestionButtons(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.guild) return;

    const btn = interaction as ButtonInteraction;
    const guildId = interaction.guild.id;
    const data = get<QuestionData>(dataKey(guildId), "data", defaultData());

    if (btn.customId.startsWith("qcat:")) {
      const catName = btn.customId.slice(5);
      const category = data.categories.find(c => c.name.toLowerCase() === catName);

      if (!category) { await btn.reply({ content: "❌ Category not found.", ephemeral: true }); return; }
      if (category.options.length === 0) {
        await btn.reply({ content: `> ❌ **${category.name}** has no roles yet. Ask an admin!`, ephemeral: true });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return;

      const memberRoleIds = new Set(member.roles.cache.keys());
      const rows = buildRoleRows(category.options, memberRoleIds);
      const haveList = category.options.filter(o => memberRoleIds.has(o.roleId)).map(o => `${o.emoji} **${o.label}**`).join("  ·  ") || "*none yet*";

      const embed = new EmbedBuilder()
        .setColor(COLORS.lana)
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(
          `${DIVIDER}\n\nPick your **${category.name}** roles!\n🟢 Green = you already have it — click to remove.\n\n**Your current:** ${haveList}\n\n${DIVIDER}`
        )
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` });

      await btn.reply({ embeds: [embed], components: rows, ephemeral: true });
      return;
    }

    if (btn.customId.startsWith("qrole:")) {
      const roleId = btn.customId.slice(6);
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return;
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) { await btn.reply({ content: "❌ Role not found. Ask an admin!", ephemeral: true }); return; }

      const hasRole = member.roles.cache.has(roleId);
      if (hasRole) {
        await member.roles.remove(role).catch(() => {});
        await btn.reply({ embeds: [new EmbedBuilder().setColor(0xff6b6b).setDescription(`🗑️ Removed **${role.name}**!`)], ephemeral: true });
      } else {
        await member.roles.add(role).catch(() => {});
        await btn.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✅ Got you the **${role.name}** role!`)], ephemeral: true });
      }
      return;
    }
  });
}

// ─── COMMANDS ─────────────────────────────────────────────────────────────────

export async function handleQuestions(cmd: string, message: Message, args: string[]) {
  if (!message.guild) return;
  const gid = message.guildId!;
  const guild = message.guild;
  const isAdmin = message.member?.permissions.has(BigInt(0x8));

  // ── !autosetup [#channel] ─────────────────────────────────────────────────
  // Creates all roles, fetches emojis, uploads them, builds & posts the panel.
  if (cmd === "autosetup") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });

    const channel = message.mentions.channels.first() ?? message.channel;

    const status = await message.reply({
      embeds: [base(COLORS.lana).setTitle("⏳ Auto Setup Starting...").setDescription(
        "This will:\n✦ Create Discord roles for all categories\n✦ Fetch emojis from emoji.gg\n✦ Upload emojis to this server\n✦ Post the panel automatically\n\n*Please wait — this may take a minute!*"
      )],
    });

    const data = get<QuestionData>(dataKey(gid), "data", defaultData());
    const updatedCats = [...data.categories];
    let done = 0;
    const total = PRESETS.length;

    for (const preset of PRESETS) {
      const catIndex = updatedCats.findIndex(c => c.name.toLowerCase() === preset.category);
      if (catIndex === -1) continue;

      // Create Discord role if it doesn't already exist
      let discordRole = guild.roles.cache.find(r => r.name === preset.label);
      if (!discordRole) {
        discordRole = await guild.roles.create({
          name: preset.label,
          color: preset.color,
          reason: "Auto setup by question panel",
        }).catch(() => undefined);
      }
      if (!discordRole) { done++; continue; }

      // Fetch emoji from emoji.gg + upload
      const emojiStr = await autoEmoji(guild, preset.searchEmoji, preset.fallbackEmoji);

      const option: QuestionOption = { roleId: discordRole.id, emoji: emojiStr, label: preset.label };
      updatedCats[catIndex] = {
        ...updatedCats[catIndex]!,
        options: [
          ...updatedCats[catIndex]!.options.filter(o => o.roleId !== discordRole!.id),
          option,
        ],
      };

      done++;

      // Update progress every 5 roles
      if (done % 5 === 0) {
        await status.edit({
          embeds: [base(COLORS.lana).setTitle(`⏳ Setting up... ${done}/${total}`).setDescription(
            `Progress: ${"▓".repeat(Math.floor((done / total) * 20))}${"░".repeat(20 - Math.floor((done / total) * 20))} ${Math.floor((done / total) * 100)}%`
          )],
        }).catch(() => {});
      }
    }

    set(dataKey(gid), "data", { ...data, categories: updatedCats });

    // Post the panel
    await status.edit({
      embeds: [base(COLORS.lana).setTitle("⏳ Posting panel...").setDescription("All roles created! Posting the panel now...")],
    }).catch(() => {});

    const posted = await postQuestionPanel(message.client, gid, channel.id);

    await status.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success ?? 0x57f287)
          .setTitle("✅ Auto Setup Complete!")
          .setDescription(
            `${DIVIDER}\n\n` +
            `**${total} roles** created across all categories!\n` +
            `Emojis fetched from emoji.gg and uploaded.\n` +
            `Panel posted in <#${channel.id}>!\n\n` +
            `${DIVIDER}\n\n` +
            `You can customize further:\n` +
            `\`!addq <category> @role <label>\` — add more roles\n` +
            `\`!removeq <category> @role\` — remove a role\n` +
            `\`!qlist\` — see all configured roles`
          )
          .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` }),
      ],
    }).catch(() => {});
    return;
  }

  // ── !questionpanel [#channel] ─────────────────────────────────────────────
  if (cmd === "questionpanel") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const channel = message.mentions.channels.first() ?? message.channel;
    const pending = await message.reply({ embeds: [base(COLORS.lana).setDescription("⏳ Posting panel...")] });
    const success = await postQuestionPanel(message.client, gid, channel.id);
    if (!success) {
      await pending.edit({ embeds: [base(COLORS.error).setDescription("❌ Failed to post panel!")] });
      return;
    }
    await pending.edit({ embeds: [aesthetic("✅ Panel Posted!", `Posted in <#${channel.id}>!`, COLORS.success)] });
    return;
  }

  // ── !addq <category> @role <label> ───────────────────────────────────────
  if (cmd === "addq") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const catName = args[0]?.toLowerCase();
    const role = message.mentions.roles.first();
    const label = args.slice(2).join(" ").trim();

    if (!catName || !role || !label) {
      return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!addq <category> @role <label>`\nExample: `!addq age @Teen 13-17`")] });
    }

    const data = get<QuestionData>(dataKey(gid), "data", defaultData());
    const catIndex = data.categories.findIndex(c => c.name.toLowerCase() === catName);
    if (catIndex === -1) {
      const names = data.categories.map(c => c.name.toLowerCase()).join(", ");
      return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Category \`${catName}\` not found.\nAvailable: \`${names}\``)] });
    }

    const pending = await message.reply({ embeds: [base(COLORS.lana).setDescription(`⏳ Fetching emoji for **${label}**...`)] });
    const emojiStr = await autoEmoji(guild, label, "🎭");

    const updatedCats = [...data.categories];
    updatedCats[catIndex] = {
      ...updatedCats[catIndex]!,
      options: [...updatedCats[catIndex]!.options.filter(o => o.roleId !== role.id), { roleId: role.id, emoji: emojiStr, label }],
    };
    set(dataKey(gid), "data", { ...data, categories: updatedCats });
    await refreshPanel(message.client, gid);
    await pending.edit({ embeds: [aesthetic("✅ Added!", `${emojiStr} **${label}** added to **${updatedCats[catIndex]!.name}**! Panel updated.`, COLORS.success)] });
    return;
  }

  // ── !removeq <category> @role ─────────────────────────────────────────────
  if (cmd === "removeq") {
    if (!isAdmin) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });
    const catName = args[0]?.toLowerCase();
    const role = message.mentions.roles.first();
    if (!catName || !role) return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Usage: `!removeq <category> @role`")] });

    const data = get<QuestionData>(dataKey(gid), "data", defaultData());
    const catIndex = data.categories.findIndex(c => c.name.toLowerCase() === catName);
    if (catIndex === -1) return message.reply({ embeds: [base(COLORS.error).setDescription(`❌ Category \`${catName}\` not found.`)] });

    const updatedCats = [...data.categories];
    updatedCats[catIndex] = { ...updatedCats[catIndex]!, options: updatedCats[catIndex]!.options.filter(o => o.roleId !== role.id) };
    set(dataKey(gid), "data", { ...data, categories: updatedCats });
    await refreshPanel(message.client, gid);
    return message.reply({ embeds: [aesthetic("🗑️ Removed!", `<@&${role.id}> removed from **${updatedCats[catIndex]!.name}**. Panel updated!`, COLORS.success)] });
  }

  // ── !qlist ────────────────────────────────────────────────────────────────
  if (cmd === "qlist") {
    const data = get<QuestionData>(dataKey(gid), "data", defaultData());
    const desc = data.categories.map(cat => {
      const opts = cat.options.length === 0
        ? "*No options yet*"
        : cat.options.map(o => `${o.emoji} **${o.label}** — <@&${o.roleId}>`).join("\n");
      return `${cat.emoji} **${cat.name}**\n${opts}`;
    }).join("\n\n");
    return message.reply({ embeds: [base(COLORS.lana).setTitle("📋 Question Panel Config").setDescription(`${DIVIDER}\n\n${desc}\n\n${DIVIDER}`)] });
  }
}
