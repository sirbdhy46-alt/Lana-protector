export interface ServerTemplate {
  id: string;
  name: string;
  vibe: string;
  emoji: string;
  primaryColor: number;
  accentColor: number;
  roleColors: {
    owner: number;
    admin: number;
    mod: number;
    vip: number;
    booster: number;
    member: number;
    jailed: number;
  };
  roleNames: {
    owner: string;
    admin: string;
    mod: string;
    vip: string;
    booster: string;
    member: string;
    jailed: string;
  };
  catSymbols: {
    info: string;
    welcome: string;
    general: string;
    lana: string;
    fun: string;
    events: string;
    support: string;
    logs: string;
  };
  channelPrefix: string;
  bannerText: string;
  description: string;
}

export const TEMPLATES: Record<string, ServerTemplate> = {
  classic: {
    id: "classic",
    name: "✿ Classic Lana Del Dey",
    vibe: "timeless purple aesthetic",
    emoji: "🌸",
    primaryColor: 0xc084fc,
    accentColor: 0x9333ea,
    roleColors: { owner: 0x9b59b6, admin: 0xe74c3c, mod: 0xe67e22, vip: 0xf1c40f, booster: 0xff6b9d, member: 0x2ecc71, jailed: 0x555555 },
    roleNames: { owner: "✦ owner", admin: "◈ admin", mod: "⟡ moderator", vip: "✿ vip", booster: "💜 booster", member: "♡ member", jailed: "🔒 jailed" },
    catSymbols: { info: "﹒⟡﹒", welcome: "﹒♡﹒", general: "﹒✿﹒", lana: "﹒🌹﹒", fun: "﹒⭔﹒", events: "﹒★﹒", support: "﹒◎﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "◈ ─────────────────────── ◈",
    description: "The original, timeless Lana Del Dey aesthetic. Purple hues, dreamy vibes ✿",
  },

  summertime: {
    id: "summertime",
    name: "🌊 Summertime Sadness",
    vibe: "ocean blue melancholy",
    emoji: "🌊",
    primaryColor: 0x38bdf8,
    accentColor: 0x0ea5e9,
    roleColors: { owner: 0x0369a1, admin: 0x06b6d4, mod: 0x0891b2, vip: 0xfbbf24, booster: 0xf472b6, member: 0x34d399, jailed: 0x475569 },
    roleNames: { owner: "🌊 ocean", admin: "☁️ clouds", mod: "🌙 moonlight", vip: "🌟 starlight", booster: "💙 waves", member: "🐚 shell", jailed: "⚓ anchor" },
    catSymbols: { info: "﹒🌊﹒", welcome: "﹒🏖️﹒", general: "﹒☁️﹒", lana: "﹒🌙﹒", fun: "﹒🐚﹒", events: "﹒⭐﹒", support: "﹒🌺﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "～ ─────────────────────── ～",
    description: "Inspired by Summertime Sadness. Ocean blue, sandy shores, late night drives 🌊",
  },

  borntoDie: {
    id: "borntoDie",
    name: "🥀 Born To Die",
    vibe: "dark roses and velvet",
    emoji: "🥀",
    primaryColor: 0x7c2d12,
    accentColor: 0xb91c1c,
    roleColors: { owner: 0x7c2d12, admin: 0xdc2626, mod: 0x9a3412, vip: 0xd97706, booster: 0xbe185d, member: 0x854d0e, jailed: 0x374151 },
    roleNames: { owner: "🥀 crimson", admin: "🖤 shadow", mod: "🌹 thorns", vip: "👑 royalty", booster: "💋 velvet", member: "🌑 moon", jailed: "⛓️ chains" },
    catSymbols: { info: "﹒🥀﹒", welcome: "﹒🌹﹒", general: "﹒🖤﹒", lana: "﹒💋﹒", fun: "﹒🎲﹒", events: "﹒👑﹒", support: "﹒🕯️﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "✦ ─────────────────────── ✦",
    description: "Inspired by Born To Die. Dark roses, velvet curtains, dramatic and moody 🥀",
  },

  ultraviolence: {
    id: "ultraviolence",
    name: "⚡ Ultraviolence",
    vibe: "dark grunge aesthetic",
    emoji: "⚡",
    primaryColor: 0x4a044e,
    accentColor: 0x7e22ce,
    roleColors: { owner: 0x4a044e, admin: 0x6d28d9, mod: 0x7c3aed, vip: 0xfbbf24, booster: 0xec4899, member: 0x10b981, jailed: 0x374151 },
    roleNames: { owner: "⚡ storm", admin: "🌩️ thunder", mod: "🔮 mystic", vip: "💫 electric", booster: "💜 voltage", member: "🌙 night", jailed: "⛓️ trapped" },
    catSymbols: { info: "﹒⚡﹒", welcome: "﹒🌩️﹒", general: "﹒🌑﹒", lana: "﹒🔮﹒", fun: "﹒🎯﹒", events: "﹒💫﹒", support: "﹒🕸️﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "⚡ ─────────────────────── ⚡",
    description: "Inspired by Ultraviolence. Dark purple, grunge, electric and intense ⚡",
  },

  honeymoon: {
    id: "honeymoon",
    name: "🍯 Honeymoon",
    vibe: "golden vintage romance",
    emoji: "🍯",
    primaryColor: 0xfbbf24,
    accentColor: 0xf59e0b,
    roleColors: { owner: 0x92400e, admin: 0xd97706, mod: 0xb45309, vip: 0xfbbf24, booster: 0xfda4af, member: 0x86efac, jailed: 0x4b5563 },
    roleNames: { owner: "🍯 golden", admin: "🌻 sunflower", mod: "🌾 harvest", vip: "✨ gilded", booster: "🌸 petal", member: "🌿 meadow", jailed: "🕸️ cobweb" },
    catSymbols: { info: "﹒🍯﹒", welcome: "﹒🌸﹒", general: "﹒🌻﹒", lana: "﹒🌹﹒", fun: "﹒🎠﹒", events: "﹒🌾﹒", support: "﹒🍃﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "✿ ─────────────────────── ✿",
    description: "Inspired by Honeymoon. Gold, vintage romance, warm summer evenings 🍯",
  },

  lustforlife: {
    id: "lustforlife",
    name: "💖 Lust For Life",
    vibe: "glam pink paradise",
    emoji: "💖",
    primaryColor: 0xf472b6,
    accentColor: 0xec4899,
    roleColors: { owner: 0x9d174d, admin: 0xdb2777, mod: 0xf472b6, vip: 0xfbbf24, booster: 0xfd8aac, member: 0xa78bfa, jailed: 0x4b5563 },
    roleNames: { owner: "💖 icon", admin: "🌟 glam", mod: "💅 fab", vip: "✨ lush", booster: "💕 sparkle", member: "🌸 dreamer", jailed: "🙅 grounded" },
    catSymbols: { info: "﹒💖﹒", welcome: "﹒🌟﹒", general: "﹒💅﹒", lana: "﹒✨﹒", fun: "﹒🎡﹒", events: "﹒🎊﹒", support: "﹒💌﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "💖 ─────────────────────── 💖",
    description: "Inspired by Lust For Life. Pink paradise, glitter, pure glam energy 💖",
  },

  nfr: {
    id: "nfr",
    name: "🌿 Norman Fucking Rockwell",
    vibe: "cali indie folk aesthetic",
    emoji: "🌿",
    primaryColor: 0x84cc16,
    accentColor: 0x65a30d,
    roleColors: { owner: 0x365314, admin: 0x4d7c0f, mod: 0x65a30d, vip: 0xfbbf24, booster: 0xf472b6, member: 0x34d399, jailed: 0x4b5563 },
    roleNames: { owner: "🌿 legend", admin: "🎸 rockwell", mod: "🌊 pacific", vip: "🌻 golden", booster: "🌺 bloom", member: "🍃 folk", jailed: "🪵 grounded" },
    catSymbols: { info: "﹒🌿﹒", welcome: "﹒🌊﹒", general: "﹒☀️﹒", lana: "﹒🎸﹒", fun: "﹒🎵﹒", events: "﹒🌅﹒", support: "﹒🍃﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "🌿 ─────────────────────── 🌿",
    description: "Inspired by NFR. California vibes, indie folk, warm sunsets and open roads 🌿",
  },

  chemtrails: {
    id: "chemtrails",
    name: "☁️ Chemtrails",
    vibe: "dreamy suburban pastel",
    emoji: "☁️",
    primaryColor: 0xa5b4fc,
    accentColor: 0x818cf8,
    roleColors: { owner: 0x3730a3, admin: 0x4f46e5, mod: 0x6366f1, vip: 0xfbbf24, booster: 0xf9a8d4, member: 0x6ee7b7, jailed: 0x4b5563 },
    roleNames: { owner: "☁️ sky", admin: "🌸 blossom", mod: "🦋 butterfly", vip: "✨ dreamer", booster: "💜 pastel", member: "🌱 sprout", jailed: "⛅ cloudy" },
    catSymbols: { info: "﹒☁️﹒", welcome: "﹒🌸﹒", general: "﹒🦋﹒", lana: "﹒🌷﹒", fun: "﹒🎪﹒", events: "﹒🌈﹒", support: "﹒🕊️﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "☁️ ─────────────────────── ☁️",
    description: "Inspired by Chemtrails Over the Country Club. Pastel lavender, soft and suburban ☁️",
  },

  bluebanisters: {
    id: "bluebanisters",
    name: "💙 Blue Banisters",
    vibe: "deep blue intimate",
    emoji: "💙",
    primaryColor: 0x1d4ed8,
    accentColor: 0x1e40af,
    roleColors: { owner: 0x1e3a8a, admin: 0x1d4ed8, mod: 0x2563eb, vip: 0xfbbf24, booster: 0x93c5fd, member: 0x34d399, jailed: 0x374151 },
    roleNames: { owner: "💙 sapphire", admin: "🔵 cobalt", mod: "🌀 indigo", vip: "⭐ dazzle", booster: "🐦 azure", member: "💎 crystal", jailed: "🪨 stone" },
    catSymbols: { info: "﹒💙﹒", welcome: "﹒🌊﹒", general: "﹒🔵﹒", lana: "﹒💎﹒", fun: "﹒🎱﹒", events: "﹒⭐﹒", support: "﹒🕊️﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "💙 ─────────────────────── 💙",
    description: "Inspired by Blue Banisters. Deep sapphire blue, raw and intimate 💙",
  },

  tunnel: {
    id: "tunnel",
    name: "🌊 Ocean Blvd",
    vibe: "teal ocean spiritual",
    emoji: "🌊",
    primaryColor: 0x0d9488,
    accentColor: 0x0f766e,
    roleColors: { owner: 0x134e4a, admin: 0x0f766e, mod: 0x0d9488, vip: 0xfbbf24, booster: 0xf9a8d4, member: 0x6ee7b7, jailed: 0x374151 },
    roleNames: { owner: "🌊 ocean", admin: "🐋 deep", mod: "🐠 current", vip: "🐚 pearl", booster: "🪸 coral", member: "💧 tide", jailed: "⚓ sunken" },
    catSymbols: { info: "﹒🌊﹒", welcome: "﹒🐚﹒", general: "﹒🐋﹒", lana: "﹒🪸﹒", fun: "﹒🐠﹒", events: "﹒⭐﹒", support: "﹒💧﹒", logs: "﹒📋﹒" },
    channelPrefix: "﹒",
    bannerText: "🌊 ─────────────────────── 🌊",
    description: "Inspired by Did You Know That There's A Tunnel Under Ocean Blvd. Teal, oceanic, spiritual 🌊",
  },
};

export function getTemplate(name: string): ServerTemplate | null {
  const lower = name.toLowerCase().replace(/[^a-z]/g, "");
  for (const [key, tpl] of Object.entries(TEMPLATES)) {
    if (key.toLowerCase() === lower || tpl.name.toLowerCase().includes(lower)) {
      return tpl;
    }
  }
  return null;
}

export function templateListEmbed(): string {
  return Object.values(TEMPLATES).map((t) =>
    `${t.emoji} **${t.name}** — \`!setup ${t.id} confirm\`\n﹒ *${t.description}*`
  ).join("\n\n");
}
