import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(process.argv[2], "utf8");
const u = new URL(process.env.POSTGRES_URL_NON_POOLING);
const client = new Client({
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("SCHEMA_APPLIED_OK");
} finally {
  await client.end();
}
