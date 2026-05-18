// One-off humanization pass: replace " — " (space-em-dash-space) with ", "
// in user-facing surfaces. Placeholders that use bare "—" (e.g. countdown
// data-unit slots like ">—<") are not touched because they have no spaces.
import fs from "node:fs";

const files = [
  "index.html",
  "pricing.html",
  "public/landing/espanja.html",
  "public/landing/saksa.html",
  "public/landing/ranska.html",
  "email.js",
  "terms.html",
  "refund.html",
  "privacy.html",
];

let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const orig = fs.readFileSync(f, "utf8");
  let out = orig.replace(/ — /g, ", ");
  out = out.replace(/ —([\.,\)])/g, "$1");
  const count = (orig.match(/ — /g) || []).length;
  if (count > 0) {
    fs.writeFileSync(f, out);
    console.log(`${f}: ${count} replaced`);
    total += count;
  }
}
console.log(`Total: ${total}`);
