import "server-only";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const isPostgres =
  DATABASE_URL.startsWith("postgresql://") ||
  DATABASE_URL.startsWith("postgres://");

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type LeadStatus = "Nouveau" | "Contacté" | "RDV pris" | "Pas répondu";

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  message: string | null;
  status: LeadStatus;
  created_at: string;
}

function mapRow(r: Record<string, unknown>): Lead {
  return {
    ...(r as unknown as Lead),
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at ?? ""),
  };
}

// ─────────────────────────────────────────────────────────────
// SQLite (dev local)
// ─────────────────────────────────────────────────────────────
import type BetterSqlite3 from "better-sqlite3";
declare global { var __bi_lite: BetterSqlite3.Database | undefined; }

function getSqlite(): BetterSqlite3.Database {
  if (global.__bi_lite) return global.__bi_lite;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const dbPath = path.join(process.cwd(), "data", "bodyinstitut.db");
  global.__bi_lite = new Database(dbPath) as BetterSqlite3.Database;
  return global.__bi_lite!;
}

function sqliteInitDb() {
  const db = getSqlite();
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT NOT NULL,
      message    TEXT,
      status     TEXT NOT NULL DEFAULT 'Nouveau',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
  `);
}

function sqliteInsertLead(data: { firstName: string; lastName: string; phone: string; email: string; message?: string | null }): Lead {
  sqliteInitDb();
  const db = getSqlite();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO leads (id, first_name, last_name, phone, email, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.firstName, data.lastName, data.phone, data.email, data.message ?? null);
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Record<string, unknown>;
  return mapRow(row);
}

function sqliteListLeads(): Lead[] {
  sqliteInitDb();
  const db = getSqlite();
  const rows = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(mapRow);
}

function sqliteUpdateStatus(id: string, status: LeadStatus): boolean {
  sqliteInitDb();
  const db = getSqlite();
  const res = db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  return res.changes > 0;
}

function sqliteDelete(id: string): boolean {
  sqliteInitDb();
  const db = getSqlite();
  const res = db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  return res.changes > 0;
}

// ─────────────────────────────────────────────────────────────
// Postgres (production)
// ─────────────────────────────────────────────────────────────
import type { Sql } from "postgres";
declare global { var __bi_sql: Sql | undefined; }

function getPg(): Sql {
  if (global.__bi_sql) return global.__bi_sql;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres");
  global.__bi_sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    prepare: false,
  }) as Sql;
  return global.__bi_sql!;
}

async function pgInitDb() {
  const db = getPg();
  await db.unsafe(`
    CREATE TABLE IF NOT EXISTS leads (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT NOT NULL,
      message    TEXT,
      status     TEXT NOT NULL DEFAULT 'Nouveau',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  `);
}

// ─────────────────────────────────────────────────────────────
// API unifiée
// ─────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  if (isPostgres) return pgInitDb();
  sqliteInitDb();
}

export async function insertLead(data: {
  firstName: string; lastName: string; phone: string; email: string; message?: string | null;
}): Promise<Lead> {
  if (!isPostgres) return sqliteInsertLead(data);
  await pgInitDb();
  const db = getPg();
  const rows = await db<Record<string, unknown>[]>`
    INSERT INTO leads (first_name, last_name, phone, email, message)
    VALUES (${data.firstName}, ${data.lastName}, ${data.phone}, ${data.email}, ${data.message ?? null})
    RETURNING *
  `;
  return mapRow(rows[0]);
}

export async function listLeads(): Promise<Lead[]> {
  if (!isPostgres) return sqliteListLeads();
  await pgInitDb();
  const db = getPg();
  const rows = await db<Record<string, unknown>[]>`SELECT * FROM leads ORDER BY created_at DESC`;
  return rows.map(mapRow);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  if (!isPostgres) return sqliteUpdateStatus(id, status);
  await pgInitDb();
  const db = getPg();
  const res = await db`UPDATE leads SET status = ${status} WHERE id = ${id}`;
  return res.count > 0;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!isPostgres) return sqliteDelete(id);
  await pgInitDb();
  const db = getPg();
  const res = await db`DELETE FROM leads WHERE id = ${id}`;
  return res.count > 0;
}
