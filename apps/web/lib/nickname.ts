const surnames = [
  'Li',
  'Wang',
  'Zhang',
  'Liu',
  'Chen',
  'Yang',
  'Zhao',
  'Huang',
  'Wu',
  'Zhou',
];

const givenNames = [
  'Wei',
  'Fang',
  'Jun',
  'Ming',
  'Yan',
  'Lei',
  'Tao',
  'Qing',
  'Lan',
  'Hao',
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateRandomChineseName(): string {
  const surname = pickRandom(surnames);
  const given = pickRandom(givenNames);
  return `${surname} ${given}`;
}
