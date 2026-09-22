const ADJ = [
  "Night",
  "Lost",
  "Gentle",
  "Silent",
  "Radiant",
  "Lazy",
  "Brave",
  "Sleepless",
  "Heart-stealing",
  "Strolling",
  "Tipsy",
  "Wind-chasing",
];
const NOUN = [
  "Cat",
  "Whale",
  "Deer",
  "Courier",
  "Cloud",
  "Traveler",
  "Star",
  "Bear",
  "Robin",
  "Moon",
  "Firefly",
  "Chime",
];

/** 取 [0, max) 的随机整数，用 CSPRNG：Math.random 输出可预测，匿名场景下可被枚举/关联 */
function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return Math.floor((buf[0] / 2 ** 32) * max);
}

export function randomCodename(): string {
  const a = ADJ[randomInt(ADJ.length)];
  const n = NOUN[randomInt(NOUN.length)];
  // 数字段从 10~99 扩到 100~999：三段空间 12×12×90=12960 太小，同名会把信件误归因到别人身上。
  // 「与已发放名单查重」在这里做不到——storage.ts 反向依赖本文件，查名单会形成循环依赖
  const num = randomInt(900) + 100;
  return `${a}${n}${num}`;
}
