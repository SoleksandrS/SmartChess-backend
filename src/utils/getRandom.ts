export function getRandomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomInRangeWithout(
  min: number,
  max: number,
  list: number[],
) {
  while (true) {
    const res = getRandomInRange(min, max);
    if (!list.includes(res)) return res;
  }
}
