// Render a 1080×1350 portrait PNG of a YO-koe writing result and trigger
// download. Pure frontend — no extra deps. Reads accent color from CSS
// custom properties when available, falls back to a fixed Puheo palette
// so the exported image looks the same in dark and light mode.

import { CRITERIA_LABELS } from "../state.js";

const W = 1080;
const H = 1350;
const PALETTE = {
  bgTop:    "#0F172A",
  bgBot:    "#1E293B",
  accent:   "#14B8A6",
  good:     "#22C55E",
  warn:     "#F59E0B",
  bad:      "#EF4444",
  text:     "#F8FAFC",
  muted:    "#94A3B8",
  surface:  "#1F2A3D",
  border:   "#334155",
};

function readAccent() {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    if (v && /^#|^rgb|^hsl/.test(v)) return v;
  } catch { /* CSS not available — fall through */ }
  return PALETTE.accent;
}

function barColorFor(score, accent) {
  if (score >= 4) return PALETTE.good;
  if (score >= 3) return accent;
  if (score >= 2) return PALETTE.warn;
  return PALETTE.bad;
}

function fillRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x,     y + h, rad);
  ctx.arcTo(x,     y + h, x,     y,     rad);
  ctx.arcTo(x,     y,     x + w, y,     rad);
  ctx.closePath();
  ctx.fill();
}

export async function generateWritingShareCard(result) {
  const accent = readAccent();
  const finalScore = Number(result?.finalScore) || 0;
  const maxScore   = Number(result?.maxScore) || 33;
  const grade      = String(result?.ytlGrade || "—");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PALETTE.bgTop);
  bg.addColorStop(1, PALETTE.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle accent glow top-right
  const glow = ctx.createRadialGradient(W * 0.85, 180, 50, W * 0.85, 180, 600);
  glow.addColorStop(0, accent + "55");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Wordmark
  ctx.fillStyle = PALETTE.text;
  ctx.font = "600 36px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Puheo", 80, 110);
  ctx.fillStyle = accent;
  ctx.fillRect(80, 122, 48, 4);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 22px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Espanjan YO-koe · lyhyt oppimäärä", W - 80, 110);

  // ── Eyebrow
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "600 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KIRJOITUSTEHTÄVÄ", W / 2, 240);

  // ── Grade badge
  const badgeR = 110;
  const badgeY = 410;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(W / 2, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.bgTop;
  ctx.font = "700 140px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(grade, W / 2, badgeY + 4);
  ctx.textBaseline = "alphabetic";

  // ── Score line
  ctx.fillStyle = PALETTE.text;
  ctx.font = "700 96px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${finalScore}`, W / 2 - 52, 640);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 56px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(` / ${maxScore} pistettä`, W / 2 - 28, 640);

  // ── Criteria block
  const blockX = 80;
  const blockY = 740;
  const blockW = W - 160;
  const blockH = 430;

  ctx.fillStyle = PALETTE.surface;
  fillRoundedRect(ctx, blockX, blockY, blockW, blockH, 28);

  ctx.fillStyle = PALETTE.text;
  ctx.font = "600 30px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("YTL-rubriikki", blockX + 36, blockY + 60);

  const rowGap = 78;
  let rowY = blockY + 110;
  for (const [key, label] of Object.entries(CRITERIA_LABELS)) {
    const c = result?.[key];
    if (!c) { rowY += rowGap; continue; }
    const score = Number(c.score) || 0;
    const pct = Math.max(0, Math.min(1, score / 5));

    ctx.fillStyle = PALETTE.text;
    ctx.font = "500 26px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, blockX + 36, rowY);

    ctx.fillStyle = PALETTE.muted;
    ctx.font = "600 26px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${score} / 5`, blockX + blockW - 36, rowY);

    // bar
    const barX = blockX + 36;
    const barY = rowY + 14;
    const barW = blockW - 72;
    const barH = 12;
    ctx.fillStyle = PALETTE.border;
    fillRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fillStyle = barColorFor(score, accent);
    fillRoundedRect(ctx, barX, barY, Math.max(barH, barW * pct), barH, barH / 2);

    rowY += rowGap;
  }

  // ── Footer
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 24px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("puheo.fi · oma harjoittelukaveri yo-kokeeseen", W / 2, H - 60);

  await downloadCanvas(canvas, `puheo-arvio-${grade}-${finalScore}-${maxScore}.png`);
}

async function downloadCanvas(canvas, filename) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Canvas export failed");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fmtElapsedShort(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}

const KIND_EYEBROW = {
  vocab:   "SANASTOHARJOITUS",
  grammar: "KIELIOPPIHARJOITUS",
  reading: "LUETUN YMMÄRTÄMINEN",
};

const KIND_TOPIC_LABEL = {
  vocab:   "Aihe",
  grammar: "Aihe",
  reading: "Teksti",
};

export async function generateExerciseShareCard({ kind = "vocab", correct = 0, total = 0, topicLabel = "", level = "", elapsedMs = 0 } = {}) {
  const accent = readAccent();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── Background gradient (same as writing card)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PALETTE.bgTop);
  bg.addColorStop(1, PALETTE.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.85, 180, 50, W * 0.85, 180, 600);
  glow.addColorStop(0, accent + "55");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Wordmark
  ctx.fillStyle = PALETTE.text;
  ctx.font = "600 36px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Puheo", 80, 110);
  ctx.fillStyle = accent;
  ctx.fillRect(80, 122, 48, 4);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 22px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Espanjan YO-koe · lyhyt oppimäärä", W - 80, 110);

  // ── Eyebrow
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "600 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(KIND_EYEBROW[kind] || "HARJOITUS", W / 2, 240);

  // ── Big percentage
  ctx.fillStyle = accent;
  ctx.font = "700 220px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${pct}`, W / 2 - 40, 500);
  ctx.fillStyle = PALETTE.text;
  ctx.font = "700 88px 'Inter', system-ui, sans-serif";
  ctx.fillText("%", W / 2 + 130, 500);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 38px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${correct} / ${total} oikein`, W / 2, 580);

  // ── Stat block
  const blockX = 80;
  const blockY = 740;
  const blockW = W - 160;
  const blockH = 380;

  ctx.fillStyle = PALETTE.surface;
  fillRoundedRect(ctx, blockX, blockY, blockW, blockH, 28);

  const rows = [
    [KIND_TOPIC_LABEL[kind] || "Aihe", String(topicLabel || "—")],
    ["Taso",   String(level || "—")],
    ["Oikein", `${correct} / ${total}`],
    ["Aikaa",  fmtElapsedShort(elapsedMs)],
  ];
  let rY = blockY + 70;
  const rowGap = 80;
  for (const [label, value] of rows) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "500 26px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, blockX + 36, rY);

    ctx.fillStyle = PALETTE.text;
    ctx.font = "600 30px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(value, blockX + blockW - 36, rY);

    // separator
    if (rY < blockY + blockH - rowGap) {
      ctx.fillStyle = PALETTE.border;
      ctx.fillRect(blockX + 36, rY + 28, blockW - 72, 1);
    }
    rY += rowGap;
  }

  // ── Footer
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "500 24px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("puheo.fi · oma harjoittelukaveri yo-kokeeseen", W / 2, H - 60);

  await downloadCanvas(canvas, `puheo-${kind}-${pct}prosenttia.png`);
}
