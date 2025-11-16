export function shufflePair<T>(list: T[]) {
  const shuffled = [...list];

  if (Math.random() < 0.5) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}
