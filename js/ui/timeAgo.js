// Defensive Finnish "X aikaa sitten" formatter shared by dashboard +
// profile recent-activity lists. Earlier per-screen copies returned
// "NaN pv sitten" when the server sent an unexpected timestamp shape.
// This version accepts ISO with/without trailing Z, numeric epoch ms,
// and Date instances; falls back to "äskettäin" rather than ever
// emitting NaN.

export function timeAgo(input) {
  if (input == null || input === "") return "";

  let ms;
  if (input instanceof Date) {
    ms = input.getTime();
  } else if (typeof input === "number") {
    ms = input;
  } else {
    const s = String(input);
    // Already-Z (or +offset) ISO is fine; bare local-time strings get a Z
    // tacked on so the server's UTC payload doesn't drift by the local
    // offset. Belt-and-braces: try the original first; if it parses, use
    // it as-is; only fall back to the "+Z" form when necessary.
    let t = Date.parse(s);
    if (Number.isNaN(t)) t = Date.parse(s + "Z");
    ms = t;
  }

  if (!Number.isFinite(ms)) return "äskettäin";
  const diff = Date.now() - ms;
  if (!Number.isFinite(diff) || diff < 0) return "äskettäin";

  const mins = Math.floor(diff / 60000);
  if (mins < 2)   return "juuri äsken";
  if (mins < 60)  return `${mins} min sitten`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} t sitten`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days} pv sitten`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} kk sitten`;
  const years = Math.floor(months / 12);
  return `${years} v sitten`;
}
