export const GIFS: Record<string, string[]> = {
  ban: [
    "https://media.tenor.com/GnCa5YGsOjMAAAAC/ban-hammer.gif",
    "https://media.tenor.com/4Ic42JYUZQIAAAAC/banned-ban.gif",
    "https://media.tenor.com/deWpKiY6MVMAAAAC/ban-hammer-banned.gif",
  ],
  kick: [
    "https://media.tenor.com/aSe5ZbQRNJQAAAAC/kick-epic.gif",
    "https://media.tenor.com/a3WD_dVYBbYAAAAC/fry-kick.gif",
    "https://media.tenor.com/eGMnGrMcDhMAAAAC/sidekick-kick.gif",
  ],
  mute: [
    "https://media.tenor.com/dzHJJlMMK84AAAAC/shut-up.gif",
    "https://media.tenor.com/0lCrqKObBfgAAAAC/shush-shh.gif",
    "https://media.tenor.com/Fc2tIDqK8ywAAAAC/silence-shhh.gif",
  ],
  warn: [
    "https://media.tenor.com/Y5BxFuKFGSsAAAAC/warning.gif",
    "https://media.tenor.com/RyLc6VsLAV4AAAAC/warning-sign.gif",
    "https://media.tenor.com/VKoHoGvGmysAAAAC/warning-alert.gif",
  ],
  timeout: [
    "https://media.tenor.com/wOZFzXGVkCMAAAAC/timeout-minecraft.gif",
    "https://media.tenor.com/HA_kSVcPuJkAAAAC/timeout-time-out.gif",
    "https://media.tenor.com/XFHGt7pCIT4AAAAC/sit-down-sit.gif",
  ],
  jail: [
    "https://media.tenor.com/sK5LNDHkjscAAAAC/jail-prison.gif",
    "https://media.tenor.com/IVMrUtWPQD4AAAAC/prison-jail.gif",
    "https://media.tenor.com/y40-rbf1tW8AAAAC/jail-prison.gif",
  ],
  nuke: [
    "https://media.tenor.com/KvHiT-bHMOgAAAAC/explosion-nuke.gif",
    "https://media.tenor.com/1-VN5FdFjPkAAAAC/nuke-nuclear.gif",
    "https://media.tenor.com/2hL6d2MrdWwAAAAC/boom-explosion.gif",
  ],
  hug: [
    "https://media.tenor.com/NN0LQBWzHfgAAAAC/hug-cute.gif",
    "https://media.tenor.com/C_SiEVB5XrIAAAAC/hug-love.gif",
    "https://media.tenor.com/A7YhsO5HJMoAAAAC/hug-hugs.gif",
  ],
  slap: [
    "https://media.tenor.com/pQ76hMkHF_kAAAAC/slap-anime.gif",
    "https://media.tenor.com/LCVJCiHYr7AAAAAC/slap-anime.gif",
    "https://media.tenor.com/2wGi4-9X0K0AAAAC/slap.gif",
  ],
  kiss: [
    "https://media.tenor.com/VRl1SuGvwroAAAAC/kiss-anime.gif",
    "https://media.tenor.com/5dLOD0bBZGUAAAAC/anime-kiss.gif",
    "https://media.tenor.com/eEp7klRHDC8AAAAC/kiss-anime.gif",
  ],
  dance: [
    "https://media.tenor.com/UxpPPi5HFPIAAAAC/dance-moves.gif",
    "https://media.tenor.com/6CZHcUmk-GEAAAAC/dance-dancing.gif",
    "https://media.tenor.com/bXcnQAlaTRkAAAAC/dancing-dance.gif",
  ],
  fight: [
    "https://media.tenor.com/xHjzSRGqDtkAAAAC/anime-fight.gif",
    "https://media.tenor.com/Zg4ORaJesPkAAAAC/anime-fight.gif",
    "https://media.tenor.com/vvGiU7-Jh1cAAAAC/fight-anime.gif",
  ],
  rob: [
    "https://media.tenor.com/HV2-F5g5CdsAAAAC/stealing-thief.gif",
    "https://media.tenor.com/pItLfmIm3IMAAAAC/robbing.gif",
    "https://media.tenor.com/AZO3LfX0f04AAAAC/robbery-robbing.gif",
  ],
  welcome: [
    "https://media.tenor.com/7PdUaFKT7TUAAAAC/welcome-hello.gif",
    "https://media.tenor.com/OEGkFnMnAXcAAAAC/welcome.gif",
    "https://media.tenor.com/Fy3XhWIBnGIAAAAC/hello-welcome.gif",
  ],
  aesthetic: [
    "https://media.tenor.com/placeholder1.gif",
  ],
};

export const LANA_GIFS = [
  "https://media.tenor.com/MiMJrP-V5l0AAAAC/lana-del-rey-blue.gif",
  "https://media.tenor.com/vx1WnpWq8ZUAAAAC/lana-del-rey.gif",
  "https://media.tenor.com/WkJkwz0ADPQAAAAC/lana-del-rey-sad.gif",
  "https://media.tenor.com/WXVqDYNjN18AAAAC/lana-del-rey-ride.gif",
  "https://media.tenor.com/8kSMpZ8yDW0AAAAC/lana-del-rey-summertime-sadness.gif",
];

export function getGif(type: string): string {
  const list = GIFS[type];
  if (!list) return "";
  return list[Math.floor(Math.random() * list.length)];
}

export function getLanaGif(): string {
  return LANA_GIFS[Math.floor(Math.random() * LANA_GIFS.length)];
}
