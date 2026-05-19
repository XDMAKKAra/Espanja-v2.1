/**
 * markdownLite.js — tiny markdown → HTML renderer scoped to the
 * teaching.intro_md content shape used by Puheo lesson JSONs.
 *
 * Supported syntax:
 *   # H1            → <h2 class="dk__page-title">  (caller controls level)
 *   ## H2           → <h3 class="dk__teoria-h2">
 *   ### H3          → <h4 class="dk__teoria-h3">
 *   **bold**        → <strong>
 *   *italic* / _i_  → <em>
 *   `code`          → <code class="dk__teoria-code">
 *   - item / * item → <ul class="dk__teoria-ul"><li>
 *   > paragraph     → InfoBox ("Obs!") — adjacent > lines merge
 *   | a | b |       → BilingualTable (first row is header)
 *   blank line      → paragraph break
 *
 * Why not a real parser: the source material is hand-authored and
 * predictable, and a tiny renderer avoids the 30kB micromark/marked
 * dep. The output is intentionally Puheo-specific markup so the
 * styling is fully under digikirja.css's control.
 */

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Inline formatting: bold, italic, code. Escape first, then apply
// transforms on the escaped string so the markdown tokens survive
// the escape pass.
function renderInline(raw) {
  let s = escapeHtml(raw);
  // Code spans first so they don't get mangled by bold/italic passes.
  s = s.replace(/`([^`]+)`/g, '<code class="dk__teoria-code">$1</code>');
  // Bold — `**text**`. Run before italic so `**bold**` doesn't
  // partially match the single-asterisk italic pattern.
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic — `*text*` or `_text_` (single underscore only between
  // word boundaries to avoid eating snake_case identifiers).
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?]|$)/g, "$1<em>$2</em>");
  return s;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line) {
  // Strip leading/trailing pipes, then split on |. Trim each cell.
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function renderTable(headerLine, rowLines) {
  const head = parseTableRow(headerLine);
  const rows = rowLines.map(parseTableRow);
  const ths = head.map((c) => `<th>${renderInline(c)}</th>`).join("");
  const trs = rows.map((cells) => {
    const tds = cells.map((c) => `<td>${renderInline(c)}</td>`).join("");
    return `<tr>${tds}</tr>`;
  }).join("");
  // Two-column tables become a BilingualTable (es | fi pairing); wider
  // tables keep the same class so the styling still applies.
  const variant = head.length === 2 ? " dk__bilingual--2col" : "";
  return `<div class="dk__bilingual${variant}"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function renderObs(lines) {
  // Strip the leading "> " from each line, then join with paragraph breaks.
  const body = lines.map((l) => l.replace(/^>\s?/, "")).join(" ").trim();
  const paragraphs = body.split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${renderInline(p)}</p>`)
    .join("");
  return `
    <aside class="dk__obs" role="note" aria-label="Huomio">
      <span class="dk__obs-label">Obs!</span>
      <div class="dk__obs-body">${paragraphs}</div>
    </aside>`;
}

function renderList(items) {
  const lis = items.map((it) => `<li>${renderInline(it.replace(/^[-*]\s+/, ""))}</li>`).join("");
  return `<ul class="dk__teoria-ul">${lis}</ul>`;
}

/**
 * Render a markdown string to Puheo-flavoured HTML for the digikirja
 * teoria sivu. The first H1 is stripped (the caller already prints the
 * page title) — every subsequent block becomes prose.
 */
export function renderTeoriaMarkdown(md) {
  if (!md || typeof md !== "string") return "";
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let h1Stripped = false;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip.
    if (/^\s*$/.test(line)) { i++; continue; }

    // Headings.
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1 && !h1Stripped) {
        h1Stripped = true; // caller renders the page title separately
        i++;
        continue;
      }
      if (level === 2) out.push(`<h3 class="dk__teoria-h2">${renderInline(text)}</h3>`);
      else if (level === 3) out.push(`<h4 class="dk__teoria-h3">${renderInline(text)}</h4>`);
      else out.push(`<h${Math.min(level + 1, 6)} class="dk__teoria-h">${renderInline(text)}</h${Math.min(level + 1, 6)}>`);
      i++;
      continue;
    }

    // Blockquote → InfoBox. Consume consecutive `> ` lines.
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      out.push(renderObs(buf));
      continue;
    }

    // Table — header row + separator + body rows.
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = line;
      const body = [];
      i += 2; // skip header + separator
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      out.push(renderTable(header, body));
      continue;
    }

    // List — consume contiguous `-` / `*` lines.
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      out.push(renderList(buf));
      continue;
    }

    // Paragraph — consume until blank line / header / table / list / quote.
    const para = [line];
    i++;
    while (i < lines.length
      && !/^\s*$/.test(lines[i])
      && !/^(#{1,6})\s+/.test(lines[i])
      && !/^\s*>\s?/.test(lines[i])
      && !/^\s*[-*]\s+/.test(lines[i])
      && !(/^\s*\|/.test(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p class="dk__teoria-p">${renderInline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}
