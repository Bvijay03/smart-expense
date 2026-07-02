/**
 * Smart Expense — Group Data CSV Exporter
 * Run from inside backend/ folder:  node export-groups-csv.mjs
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from script dir or parent (backend/.env)
function loadDotEnv() {
  const candidates = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      }
      return true;
    }
  }
  return false;
}

loadDotEnv();

// Parse DATABASE_URL robustly to avoid pg SASL/credential parsing issues
function buildClientFromDatabaseUrl(dbUrl) {
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  // strip outer quotes if present
  dbUrl = dbUrl.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  try {
    const u = new URL(dbUrl);
    const config = {
      host: u.hostname,
      port: u.port ? Number(u.port) : undefined,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname ? u.pathname.replace(/^\//, '') : undefined,
    };
    return new pg.Client(config);
  } catch (err) {
    // fallback to connectionString
    return new pg.Client({ connectionString: dbUrl });
  }
}

const client = buildClientFromDatabaseUrl(process.env.DATABASE_URL);

function toCSV(rows) {
  if (!rows.length) return "(no data)\n";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

function write(filename, rows) {
  const out = path.join(__dirname, filename);
  fs.writeFileSync(out, toCSV(rows), "utf8");
  console.log(`✅  ${filename}  (${rows.length} rows)  →  ${out}`);
}

async function main() {
  await client.connect();
  console.log("🔌  Connected\n");

  // 1. Groups
  const { rows: groups } = await client.query(`
    SELECT
      g.id,
      g.name,
      g.description,
      u.name   AS created_by,
      u.email  AS created_by_email,
      g.created_at,
      g.updated_at,
      g.deleted_at
    FROM groups g
    JOIN users u ON u.id = g.created_by
    ORDER BY g.created_at
  `);
  write("groups.csv", groups);

  // 2. Group Members
  const { rows: members } = await client.query(`
    SELECT
      gm.group_id,
      g.name        AS group_name,
      u.id          AS user_id,
      u.name        AS member_name,
      u.email       AS member_email,
      gm.role,
      gm.joined_at
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    JOIN users  u ON u.id = gm.user_id
    ORDER BY g.name, gm.joined_at
  `);
  write("group_members.csv", members);

  // 3. Shared Expenses (flattened — one row per split)
  const { rows: expenses } = await client.query(`
    SELECT
      se.id             AS expense_id,
      g.name            AS group_name,
      se.description,
      se.amount         AS total_amount,
      se.category,
      se.expense_date,
      se.split_type,
      payer.name        AS paid_by_name,
      payer.email       AS paid_by_email,
      member.name       AS split_member_name,
      member.email      AS split_member_email,
      es.amount_owed    AS amount_owed_by_member,
      se.created_at
    FROM shared_expenses se
    JOIN groups         g      ON g.id     = se.group_id
    JOIN users          payer  ON payer.id = se.paid_by
    JOIN expense_splits es     ON es.shared_expense_id = se.id
    JOIN users          member ON member.id = es.user_id
    WHERE se.deleted_at IS NULL
    ORDER BY g.name, se.expense_date DESC, member.name
  `);
  write("shared_expenses.csv", expenses);

  // 4. Settlements
  const { rows: settlements } = await client.query(`
    SELECT
      s.id,
      g.name      AS group_name,
      fu.name     AS from_user,
      fu.email    AS from_email,
      tu.name     AS to_user,
      tu.email    AS to_email,
      s.amount,
      s.status,
      s.settled_at,
      s.created_at
    FROM settlements s
    JOIN groups g  ON g.id  = s.group_id
    JOIN users  fu ON fu.id = s.from_user_id
    JOIN users  tu ON tu.id = s.to_user_id
    ORDER BY g.name, s.created_at DESC
  `);
  write("settlements.csv", settlements);

  await client.end();
  console.log("\n🎉  Done. Open the CSV files in Excel or Google Sheets.");
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  client.end();
  process.exit(1);
});
