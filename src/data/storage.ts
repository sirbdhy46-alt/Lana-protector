import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./bot-data");
fs.mkdirSync(DATA_DIR, { recursive: true });

function fp(store: string) {
  return path.join(DATA_DIR, `${store}.json`);
}

export function getAll<T>(store: string): Record<string, T> {
  const f = fp(store);
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch {
    return {};
  }
}

export function saveAll<T>(store: string, data: Record<string, T>): void {
  fs.writeFileSync(fp(store), JSON.stringify(data, null, 2));
}

export function get<T>(store: string, key: string, def: T): T {
  const d = getAll<T>(store);
  return d[key] !== undefined ? d[key] : def;
}

export function set<T>(store: string, key: string, val: T): void {
  const d = getAll<T>(store);
  d[key] = val;
  saveAll(store, d);
}

export function update<T>(
  store: string,
  key: string,
  fn: (v: T) => T,
  def: T
): T {
  const current = get<T>(store, key, def);
  const next = fn(current);
  set(store, key, next);
  return next;
}

export function del(store: string, key: string): void {
  const d = getAll(store);
  delete d[key];
  saveAll(store, d);
}

export interface Economy {
  balance: number;
  bank: number;
  lastDaily: number;
  lastRob: number;
  shieldExpiry: number;
  inventory: string[];
  kidnapped: boolean;
}

export const defaultEconomy: Economy = {
  balance: 500,
  bank: 0,
  lastDaily: 0,
  lastRob: 0,
  shieldExpiry: 0,
  inventory: [],
  kidnapped: false,
};

export interface Warning {
  reason: string;
  mod: string;
  timestamp: number;
}

export interface UserWarnings {
  warnings: Warning[];
  muted: boolean;
  jailed: boolean;
  jailReason: string;
}

export const defaultWarnings: UserWarnings = {
  warnings: [],
  muted: false,
  jailed: false,
  jailReason: "",
};

export interface Level {
  xp: number;
  level: number;
  messages: number;
  lastXp: number;
}

export const defaultLevel: Level = {
  xp: 0,
  level: 0,
  messages: 0,
  lastXp: 0,
};

export interface GuildSettings {
  prefix: string;
  welcomeChannel: string;
  leaveChannel: string;
  logsChannel: string;
  levelChannel: string;
  jailChannel: string;
  starboardChannel: string;
  ticketCategory: string;
  badwords: string[];
  antispam: boolean;
  levelroles: Record<number, string>;
  jailedRole: string;
  memberRole: string;
  starboardMin: number;
  template: string;
}

export const defaultSettings: GuildSettings = {
  prefix: "!",
  welcomeChannel: "",
  leaveChannel: "",
  logsChannel: "",
  levelChannel: "",
  jailChannel: "",
  starboardChannel: "",
  ticketCategory: "",
  badwords: [],
  antispam: false,
  levelroles: {},
  jailedRole: "",
  memberRole: "",
  starboardMin: 3,
  template: "classic",
};

export interface Giveaway {
  channelId: string;
  messageId: string;
  prize: string;
  winnersCount: number;
  endsAt: number;
  hostId: string;
  ended: boolean;
  participants: string[];
}

export interface SnipedMessage {
  content: string;
  author: string;
  authorId: string;
  avatar: string;
  timestamp: number;
}

export interface AfkEntry {
  reason: string;
  timestamp: number;
}

export interface Ticket {
  channelId: string;
  userId: string;
  guildId: string;
  createdAt: number;
  open: boolean;
  subject: string;
}

export interface StarboardEntry {
  originalId: string;
  starboardId: string;
  stars: number;
  channelId: string;
}

export interface Reminder {
  userId: string;
  channelId: string;
  message: string;
  fireAt: number;
}
