const SR_KEY = "kielio_sr_queue";
const SR_MAX = 20;

export function srLoad() {
  try { return JSON.parse(localStorage.getItem(SR_KEY)) || []; }
  catch { return []; }
}

export function srSave(queue) {
  localStorage.setItem(SR_KEY, JSON.stringify(queue.slice(0, SR_MAX)));
}

export function srAddWrong(ex) {
  const queue = srLoad();
  if (queue.some((q) => q.question === ex.question)) return;
  queue.unshift({ ...ex, _sr: true });
  srSave(queue);
}

export function srMarkCorrect(ex) {
  if (!ex._sr) return;
  const queue = srLoad().filter((q) => q.question !== ex.question);
  srSave(queue);
}

export function srPop(n = 2) {
  const queue = srLoad();
  const items = queue.splice(0, n);
  srSave(queue);
  return items;
}
