/** Usage: node scripts/run-sql.js db/schema.sql — runs a T-SQL file (split on GO lines) against Azure SQL. */
import { readFile } from "node:fs/promises";
import { pool, query } from "../src/config/db.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql.js <file.sql>");
  process.exit(1);
}
try {
  const batches = (await readFile(file, "utf8"))
    .split(/^\s*GO\s*$/im)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const batch of batches) await query(batch);
  console.log(`Applied ${file} (${batches.length} batch${batches.length === 1 ? "" : "es"})`);
} catch (err) {
  console.error(`Failed applying ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
