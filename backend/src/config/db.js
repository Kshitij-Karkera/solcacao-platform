/**
 * Azure SQL Database connection pool (driver: mssql / tedious).
 *
 * Routes write queries with numbered placeholders ($1, $2 …). This module turns
 * them into named T-SQL parameters (@p1, @p2 …), so every value is always sent
 * as a parameter — never concatenated into SQL.
 * Objects/arrays are stored as JSON text (NVARCHAR(MAX)).
 */
import sql from "mssql";
import { env } from "./env.js";

let poolPromise = null;

/**
 * Connect lazily on first use. If the database is unreachable the error is
 * returned to the caller (the request fails with an error response) instead of
 * crashing the process, and the next request tries to connect again.
 */
function getPool() {
  if (!poolPromise) {
    const connecting = new sql.ConnectionPool({
      server: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      options: {
        encrypt: env.DB_ENCRYPT === "true",
        trustServerCertificate: env.DB_TRUST_CERT === "true",
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
      connectionTimeout: 15_000,
      requestTimeout: 30_000,
    })
      .connect()
      .catch((err) => {
        console.error("Could not connect to Azure SQL:", err.message);
        if (poolPromise === connecting) poolPromise = null; // allow a retry
        throw err;
      });
    poolPromise = connecting;
  }
  return poolPromise;
}

function bind(request, params = []) {
  params.forEach((v, i) => {
    let value = v;
    if (
      value !== null &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !Buffer.isBuffer(value)
    ) {
      value = JSON.stringify(value);
    }
    if (typeof value === "string") request.input(`p${i + 1}`, sql.NVarChar(sql.MAX), value);
    else request.input(`p${i + 1}`, value);
  });
}

const toTsql = (text) => text.replace(/\$(\d+)/g, "@p$1");

async function run(request, text, params) {
  bind(request, params);
  const result = await request.query(toTsql(text));
  return {
    rows: result.recordset ?? [],
    rowCount: result.rowsAffected?.reduce((a, b) => a + b, 0) ?? 0,
  };
}

/** Run a parameterised query. Returns { rows, rowCount }. */
export async function query(text, params) {
  const pool = await getPool();
  return run(pool.request(), text, params);
}

/** Run `fn(client)` inside a transaction; rolls back on any thrown error. */
export async function withTransaction(fn) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  const client = { query: (text, params) => run(new sql.Request(tx), text, params) };
  try {
    const result = await fn(client);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

/** Build "$n,$n+1,…" placeholders for an IN (...) list, appending values to params. */
export function inList(params, values) {
  return values.map((v) => (params.push(v), `$${params.length}`)).join(",");
}

/** Parse a JSON text column safely. */
export const parseJson = (v, fallback) => {
  if (v == null) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

export const pool = {
  query: (text, params) => query(text, params),
  end: async () => {
    if (!poolPromise) return;
    const p = poolPromise;
    poolPromise = null;
    await (await p.catch(() => null))?.close();
  },
};
