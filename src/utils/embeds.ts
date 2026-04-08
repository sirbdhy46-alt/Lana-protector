import { EmbedBuilder, type ColorResolvable } from "discord.js";

export const COLORS = {
  moderation: 0xff4757 as ColorResolvable,
  economy: 0xffd700 as ColorResolvable,
  games: 0x2ed573 as ColorResolvable,
  fun: 0xff6b9d as ColorResolvable,
  relationships: 0xff1493 as ColorResolvable,
  court: 0x9b59b6 as ColorResolvable,
  music: 0x1db954 as ColorResolvable,
  leveling: 0x5865f2 as ColorResolvable,
  server: 0x3498db as ColorResolvable,
  admin: 0xe67e22 as ColorResolvable,
  info: 0x95a5a6 as ColorResolvable,
  success: 0x2ecc71 as ColorResolvable,
  error: 0xff4757 as ColorResolvable,
  warn: 0xf39c12 as ColorResolvable,
  lana: 0xc084fc as ColorResolvable,
};

export const SYM = {
  line: "◈ ─────────────────────── ◈",
  dot: "✦",
  star: "⋆˚✦",
  diamond: "◇",
  arrow: "➣",
  heart: "💜",
  crown: "👑",
  spark: "✨",
};

export const AESTHETIC_SYMBOLS = [
  "﹒ʬʬ﹒",
  "﹒⟡﹒",
  "﹒✿﹒",
  "﹒♡﹒",
  "﹒⊹﹒",
  "﹒✶﹒",
  "﹒❀﹒",
  "﹒★﹒",
  "﹒◎﹒",
  "﹒⭔﹒",
];

export const CUTE = [
  "🌸",
  "🌺",
  "🌻",
  "🌼",
  "🌷",
  "💮",
  "🍀",
  "🦋",
  "🌈",
  "✨",
];
export const ANIMATED = [
  "⚡",
  "🌪️",
  "💫",
  "🔥",
  "❄️",
  "🌊",
  "☄️",
  "🎆",
  "🎇",
  "💥",
];
export const HEARTS = [
  "💕",
  "💞",
  "💓",
  "💗",
  "💘",
  "💝",
  "🥰",
  "😍",
  "💑",
  "💏",
];
export const ROMANTIC = [
  "💕",
  "🌹",
  "😘",
  "💌",
  "🥰",
  "💍",
  "🌸",
  "✨",
  "💞",
  "🫦",
];

export function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function base(
  color: ColorResolvable,
  footer = "✿ lana del dey bot ✿ 24/7 online"
) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: `${rand(CUTE)} ${footer}` });
}

export function success(title: string, desc: string) {
  return base(COLORS.success).setTitle(`✅ ${title}`).setDescription(desc);
}

export function error(title: string, desc: string) {
  return base(COLORS.error).setTitle(`❌ ${title}`).setDescription(desc);
}

export function aesthetic(
  title: string,
  desc: string,
  color: ColorResolvable
) {
  return base(color)
    .setTitle(`${rand(ANIMATED)} ${title}`)
    .setDescription(`${SYM.line}\n${desc}\n${SYM.line}`);
}

export function lana(title: string, desc: string) {
  return base(COLORS.lana)
    .setTitle(`🌸 ${title}`)
    .setDescription(`${SYM.line}\n${desc}\n${SYM.line}`);
}

export function formatCoins(n: number): string {
  return `🪙 **${n.toLocaleString()}** coins`;
}

export function xpForLevel(lvl: number): number {
  return 100 * lvl * lvl + 100 * lvl;
}
