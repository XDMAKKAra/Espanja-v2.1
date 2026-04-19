import fs from "node:fs";
const file = process.argv[2] || "migrations/013_prewarm_bank_b_c.sql";
const sql = fs.readFileSync(file, "utf8");
console.log(`Validating ${file}`);
const re = /\$json\$([\s\S]*?)\$json\$/g;
let m, i = 0, ok = 0, fail = 0;
while ((m = re.exec(sql)) !== null) {
  i++;
  try {
    const arr = JSON.parse(m[1]);
    if (!Array.isArray(arr) || arr.length !== 4) {
      fail++; console.log(`batch ${i}: not a 4-item array (got ${arr?.length})`); continue;
    }
    for (const ex of arr) {
      if (!ex.question || !ex.context || !Array.isArray(ex.options) || ex.options.length !== 4 || !ex.correct || !ex.explanation) {
        fail++; console.log(`batch ${i}: item missing fields`); break;
      }
    }
    ok++;
  } catch (e) {
    fail++; console.log(`batch ${i} parse fail:`, e.message.slice(0, 100));
  }
}
console.log(`\nTotal batches: ${i}, OK: ${ok}, FAIL: ${fail}`);
