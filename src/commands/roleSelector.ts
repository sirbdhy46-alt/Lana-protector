import {
  type Message, type Guild, type GuildMember,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, ComponentType,
} from "discord.js";
import { base, COLORS, rand, CUTE } from "../utils/embeds.js";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type RoleOption = {
  label: string;
  emoji: string;
  roleColor: string;
  roleName: string;
};

type QuestionPage = {
  title: string;
  description: string;
  color: number;
  options: RoleOption[];
  category: string;
};

// ─── EMOJI.GG FETCH ───────────────────────────────────────────────────────────

type EmojiGgItem = { title: string; image: string; slug: string };
let cachedEmojis: EmojiGgItem[] = [];

async function fetchEmojiGg(): Promise<EmojiGgItem[]> {
  if (cachedEmojis.length > 0) return cachedEmojis;
  try {
    const res = await fetch("https://emoji.gg/api/");
    if (!res.ok) return [];
    cachedEmojis = (await res.json()) as EmojiGgItem[];
    return cachedEmojis;
  } catch { return []; }
}

async function findEmoji(keyword: string): Promise<string | null> {
  const list = await fetchEmojiGg();
  const match = list.find(e => e.title.toLowerCase().includes(keyword.toLowerCase()));
  return match ? `https://emoji.gg/emoji/${match.slug}` : null;
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

const QUESTIONS: QuestionPage[] = [
  {
    title: "🎂 Age Verification",
    description: "**How old are you?**\n\nThis helps us keep the server safe for everyone ✿\nPick the one that applies to you!",
    color: 0xf9a8d4,
    category: "age",
    options: [
      { label: "18+", emoji: "🔞", roleColor: "#a78bfa", roleName: "🔞 18+" },
      { label: "Under 18", emoji: "🌸", roleColor: "#f9a8d4", roleName: "🌸 18-" },
    ],
  },
  {
    title: "💕 Relationship Status",
    description: "**What's your current status?**\n\nDon't be shy, we don't judge here ✿",
    color: 0xfb7185,
    category: "relationship",
    options: [
      { label: "Single", emoji: "💔", roleColor: "#f87171", roleName: "💔 Single" },
      { label: "Taken", emoji: "💕", roleColor: "#fb7185", roleName: "💕 Taken" },
      { label: "Mingling", emoji: "🔥", roleColor: "#fb923c", roleName: "🔥 Mingling" },
      { label: "It's complicated", emoji: "🥀", roleColor: "#a78bfa", roleName: "🥀 It's Complicated" },
    ],
  },
  {
    title: "🎯 What's Your Hobby?",
    description: "**Pick your main vibe!**\n\nYou can only pick one — choose wisely ✿",
    color: 0xa78bfa,
    category: "hobby",
    options: [
      { label: "Yapping", emoji: "🗣️", roleColor: "#fbbf24", roleName: "🗣️ Yapper" },
      { label: "Jamming", emoji: "🎵", roleColor: "#a78bfa", roleName: "🎵 Jammer" },
      { label: "Gaming", emoji: "🎮", roleColor: "#34d399", roleName: "🎮 Gamer" },
      { label: "Art & Edits", emoji: "🎨", roleColor: "#f472b6", roleName: "🎨 Artist" },
      { label: "Watching shows", emoji: "📺", roleColor: "#60a5fa", roleName: "📺 Watcher" },
    ],
  },
  {
    title: "🎮 Favourite Game Type?",
    description: "**What kind of games are you into?**\n\nOr just pick the vibe that fits most ✿",
    color: 0x34d399,
    category: "gametype",
    options: [
      { label: "FPS / Shooter", emoji: "🔫", roleColor: "#ef4444", roleName: "🔫 Shooter" },
      { label: "RPG / Story", emoji: "⚔️", roleColor: "#a78bfa", roleName: "⚔️ RPG Player" },
      { label: "Horror", emoji: "👻", roleColor: "#374151", roleName: "👻 Horror Fan" },
      { label: "Sports / Racing", emoji: "⚽", roleColor: "#22c55e", roleName: "⚽ Sports Fan" },
      { label: "Not a gamer", emoji: "😌", roleColor: "#94a3b8", roleName: "😌 Non-Gamer" },
    ],
  },
  {
    title: "✨ Pick Your Vibe",
    description: "**Which aesthetic fits you best?**\n\nThis is the most important question ✿",
    color: 0xc084fc,
    category: "vibe",
    options: [
      { label: "Dark Academia", emoji: "🖤", roleColor: "#1f2937", roleName: "🖤 Dark Academia" },
      { label: "Soft Girl", emoji: "🌸", roleColor: "#f9a8d4", roleName: "🌸 Soft Girl" },
      { label: "Aesthetic", emoji: "✨", roleColor: "#c084fc", roleName: "✨ Aesthetic" },
      { label: "Chaotic", emoji: "⚡", roleColor: "#fbbf24", roleName: "⚡ Chaotic" },
      { label: "Lana Era", emoji: "🌹", roleColor: "#9b59b6", roleName: "🌹 Lana Era" },
    ],
  },
];

// ─── SYMBOLS ─────────────────────────────────────────────────────────────────

const SYMS = ["⟡","✿","♡","⊹","✶","❀","★","◎","⭔","✦","◈","❋","꩜","⎊"];
const LINE = () => `${SYMS[Math.floor(Math.random() * SYMS.length)]} ─────────────────────── ${SYMS[Math.floor(Math.random() * SYMS.length)]}`;
const SYM = () => SYMS[Math.floor(Math.random() * SYMS.length)]!;

// ─── AUTO-CREATE ROLE ─────────────────────────────────────────────────────────

async function ensureRole(guild: Guild, option: RoleOption) {
  const existing = guild.roles.cache.find(r => r.name === option.roleName);
  if (existing) return existing;
  return guild.roles.create({
    name: option.roleName,
    color: option.roleColor as any,
    hoist: false,
    mentionable: false,
    reason: "Auto-created by Lana bot role selector",
  }).catch(() => null);
}

// ─── BUILD PAGE EMBED ─────────────────────────────────────────────────────────

function buildPageEmbed(page: QuestionPage, currentPage: number, totalPages: number, emojiGgUrl: string | null) {
  return new EmbedBuilder()
    .setColor(page.color)
    .setTitle(`${SYM()} ${page.title} ${SYM()}`)
    .setDescription(
      `${LINE()}\n\n` +
      `${page.description}\n\n` +
      `${LINE()}\n\n` +
      `${page.options.map(o => `${o.emoji}﹒**${o.label}**`).join("   ")}\n\n` +
      (emojiGgUrl ? `*Emoji sourced from emoji.gg ✿*\n\n` : "") +
      `${LINE()}`
    )
    .setFooter({ text: `${rand(CUTE)} Page ${currentPage}/${totalPages} • lana del dey bot ✿` })
    .setTimestamp();
}

// ─── BUILD BUTTONS ────────────────────────────────────────────────────────────

function buildButtons(page: QuestionPage, pageIndex: number): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const STYLES = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger, ButtonStyle.Primary];

  // Split into rows of max 5 buttons
  const chunks: RoleOption[][] = [];
  for (let i = 0; i < page.options.length; i += 5) {
    chunks.push(page.options.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    chunk.forEach((opt, i) => {
      const btn = new ButtonBuilder()
        .setCustomId(`role_${pageIndex}_${i}`)
        .setLabel(opt.label)
        .setStyle(STYLES[i % STYLES.length]!);
      try { btn.setEmoji(opt.emoji); } catch {}
      row.addComponents(btn);
    });
    rows.push(row);
  }

  return rows;
}

// ─── START BUTTON ─────────────────────────────────────────────────────────────

function buildStartEmbed() {
  return new EmbedBuilder()
    .setColor(0xc084fc)
    .setTitle(`${SYM()} Welcome to Role Setup! ${SYM()}`)
    .setDescription(
      `${LINE()}\n\n` +
      `Hey gorgeous! Let's find the perfect roles for you 🌹\n\n` +
      `${SYM()}﹒You'll answer **${QUESTIONS.length} quick questions**\n` +
      `${SYM()}﹒Roles are **automatically created** for your server\n` +
      `${SYM()}﹒Emojis are fetched from **emoji.gg** ✿\n` +
      `${SYM()}﹒Takes about **30 seconds** to complete\n\n` +
      `Hit **Start** when you're ready! ✨\n\n` +
      `${LINE()}`
    )
    .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
    .setTimestamp();
}

// ─── MAIN FLOW ────────────────────────────────────────────────────────────────

export async function handleRoleSelector(message: Message) {
  if (!message.guild || !message.member) return;

  const guild = message.guild;
  const member = message.member as GuildMember;

  // Fetch emoji.gg in background
  let emojiGgUrl: string | null = null;
  fetchEmojiGg().then(async () => {
    emojiGgUrl = await findEmoji("star");
  }).catch(() => {});

  // ── Send start message ────────────────────────────────────────────────────
  const startRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("role_start")
      .setLabel("Start ✨")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🌹")
  );

  const startMsg = await message.channel.send({
    embeds: [buildStartEmbed()],
    components: [startRow],
  });

  // Wait for start click
  let startInteraction;
  try {
    startInteraction = await startMsg.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i => i.user.id === message.author.id && i.customId === "role_start",
      time: 60_000,
    });
    await startInteraction.deferUpdate();
  } catch {
    await startMsg.edit({ embeds: [base(COLORS.error).setDescription("⏰ Timed out! Run `!getroles` again.")], components: [] }).catch(() => {});
    return;
  }

  // ── Run through each question page ───────────────────────────────────────
  const assignedRoles: string[] = [];

  for (let pageIdx = 0; pageIdx < QUESTIONS.length; pageIdx++) {
    const page = QUESTIONS[pageIdx]!;
    const embed = buildPageEmbed(page, pageIdx + 1, QUESTIONS.length, emojiGgUrl);
    const rows = buildButtons(page, pageIdx);

    await startMsg.edit({ embeds: [embed], components: rows });

    // Wait for user to click a button on this page
    let interaction;
    try {
      interaction = await startMsg.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: i => i.user.id === message.author.id && i.customId.startsWith(`role_${pageIdx}_`),
        time: 90_000,
      });
      await interaction.deferUpdate();
    } catch {
      // Timed out on this page — skip it, continue to next
      continue;
    }

    // Get which option was chosen
    const optionIdx = parseInt(interaction.customId.split("_")[2] ?? "0", 10);
    const chosen = page.options[optionIdx];
    if (!chosen) continue;

    // Auto-create role and assign
    const role = await ensureRole(guild, chosen);
    if (role) {
      await member.roles.add(role).catch(() => {});
      assignedRoles.push(`${chosen.emoji} **${chosen.label}**`);
    }

    // Brief "moving to next page" flash
    if (pageIdx < QUESTIONS.length - 1) {
      await startMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x86efac)
            .setDescription(
              `${LINE()}\n\n` +
              `${chosen.emoji} Got it! You chose **${chosen.label}**\n\n` +
              `Loading next question... ✨\n\n` +
              `${LINE()}`
            ),
        ],
        components: [],
      }).catch(() => {});
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  // ── Final result page ─────────────────────────────────────────────────────
  await startMsg.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(0xc084fc)
        .setTitle(`${SYM()} All Done! ${SYM()}`)
        .setDescription(
          `${LINE()}\n\n` +
          `You're all set, gorgeous! 🌹 Here are your new roles:\n\n` +
          (assignedRoles.length > 0
            ? assignedRoles.map(r => `${SYM()}﹒${r}`).join("\n")
            : "*No roles were assigned.*"
          ) +
          `\n\n${LINE()}\n\n` +
          `Your roles have been added! Welcome to the server ✨`
        )
        .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
        .setTimestamp(),
    ],
    components: [],
  }).catch(() => {});

  // Auto-delete after 15 seconds
  setTimeout(() => startMsg.delete().catch(() => {}), 15_000);
}

// ─── ADMIN: POST ROLE SELECTOR PANEL ─────────────────────────────────────────

export async function postRoleSelectorPanel(message: Message) {
  if (!message.member?.permissions.has(BigInt(0x8)))
    return message.reply({ embeds: [base(COLORS.error).setDescription("❌ Admin only!")] });

  const embed = new EmbedBuilder()
    .setColor(0xc084fc)
    .setTitle(`${SYM()} Get Your Roles! ${SYM()}`)
    .setDescription(
      `${LINE()}\n\n` +
      `${SYM()}﹒Click the button below to start the **role setup**!\n` +
      `${SYM()}﹒Answer **${QUESTIONS.length} quick questions**\n` +
      `${SYM()}﹒Roles assigned **automatically** ✿\n` +
      `${SYM()}﹒Age • Relationship • Hobby • Games • Vibe\n\n` +
      `${LINE()}`
    )
    .setFooter({ text: `${rand(CUTE)} lana del dey bot ✿` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("open_role_selector")
      .setLabel("Get My Roles!")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🌹")
  );

  await message.channel.send({ embeds: [embed], components: [row] });
  await message.delete().catch(() => {});
}
