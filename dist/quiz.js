export function normalize(value, kind = 'name') {
  let result = String(value).normalize('NFKC').replace(/[−⁻]/g, '-').replace(/[⁺]/g, '+').replace(/[‐‑–]/g, '-').trim();
  if (kind === 'formula') return result.replace(/\s/g, '').replace(/\(aq\)$/i, '');
  return result.toLowerCase().replace(/[’‘]/g, "'").replace(/\s*\(\s*([ivx]+)\s*\)\s*/g, '($1)').replace(/\s+/g, ' ').replace(/[.!]$/, '');
}
export const isCorrect = (q, value) => [q.answer, ...q.aliases].some(answer => normalize(answer, q.kind) === normalize(value, q.kind));
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function selectQuestions(bank, scope, count, random = Math.random) {
  const pool = bank.filter(q => scope === 'all' || scope === `unit-${q.unit}` || q.topic === scope);
  return shuffle(pool, random).slice(0, count === 'all' ? pool.length : Number(count));
}
export const scoreQuiz = answers => ({correct: answers.filter(a => a.correct).length, total: answers.length, missed: answers.filter(a => !a.correct).map(a => a.id)});
