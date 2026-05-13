export function computeProgress(tasks: { done: boolean }[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
}

export function genHeatmap(seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < 30; i++) {
    s = (s * 9301 + 49297) % 233280;
    const v = s / 233280;
    out.push(v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.65 ? 2 : v < 0.85 ? 3 : 4);
  }
  return out;
}
