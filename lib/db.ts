import "server-only";
import postgres from "postgres";
import type { LeadStatus, LeadRecord } from "./types";

export type { LeadStatus, LeadRecord } from "./types";

/**
 * Body Institut — PostgreSQL database layer (Supabase-compatible).
 *
 * Connection URL via env:
 *   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
 *
 * Works out-of-the-box with:
 *   - Supabase  (use the "Connection string → URI" from Project settings)
 *   - Neon      (neon.tech)
 *   - Render    (Postgres add-on)
 *   - Vercel    (Vercel Postgres / Neon integration)
 */

declare global {
  // eslint-disable-next-line no-var
  var __bi_sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __bi_migrated: boolean | undefined;
}

function getClient() {
  if (global.__bi_sql) return global.__bi_sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not defined. Set it to a PostgreSQL connection string (Supabase/Neon/Vercel Postgres)."
    );
  }

  // Determine SSL mode from URL params; fall back to a permissive config
  // that works with Render internal connections, Supabase, Neon, etc.
  const sslConfig = url.includes("sslmode=disable")
    ? false
    : url.includes("sslmode=no-verify")
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: false }; // works for Render, Supabase, Neon

  const sql = postgres(url, {
    ssl: sslConfig,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  });

  global.__bi_sql = sql;
  return sql;
}

/* ──────────────────────────────────────────────────────────────────
   MIGRATIONS — idempotent, runs once per cold start
   ────────────────────────────────────────────────────────────────── */

async function ensureMigrated() {
  if (global.__bi_migrated) return;
  const sql = getClient();

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS leads (
      id            TEXT PRIMARY KEY,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT NOT NULL,
      simulator     TEXT NOT NULL,
      goal          TEXT NOT NULL,
      zone          TEXT NOT NULL,
      intensity     TEXT,
      sport         TEXT,
      budget        INTEGER NOT NULL DEFAULT 0,
      protocol      TEXT,
      result        TEXT,
      ai_notes      TEXT,
      analysis      TEXT,
      status        TEXT NOT NULL DEFAULT 'nouveau',
      source_ip     TEXT
    );
  `);

  // Idempotent column additions (equivalent of ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
  const additions: { name: string; ddl: string }[] = [
    { name: "simulator_id",            ddl: "TEXT" },
    { name: "zone_tier",               ddl: "TEXT" },
    { name: "city",                    ddl: "TEXT" },
    { name: "age",                     ddl: "INTEGER" },
    { name: "sex",                     ddl: "TEXT" },
    { name: "height_cm",               ddl: "INTEGER" },
    { name: "weight_kg",               ddl: "INTEGER" },
    { name: "cellulite",               ddl: "TEXT" },
    { name: "budget_client",           ddl: "TEXT" },
    { name: "availability",            ddl: "TEXT" },
    { name: "message",                 ddl: "TEXT" },
    { name: "mode",                    ddl: "TEXT" },
    { name: "price_session",           ddl: "INTEGER" },
    { name: "price_cure",              ddl: "INTEGER" },
    { name: "price_total",             ddl: "INTEGER" },
    { name: "duo_applied",             ddl: "SMALLINT NOT NULL DEFAULT 0" },
    { name: "complementary_simulator", ddl: "TEXT" },
    { name: "complementary_reason",    ddl: "TEXT" },
    { name: "consent",                 ddl: "SMALLINT NOT NULL DEFAULT 0" },
    { name: "timeframe",               ddl: "TEXT" },
    { name: "source",                  ddl: "TEXT" },
  ];

  for (const c of additions) {
    await sql.unsafe(
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${c.name} ${c.ddl};`
    );
  }

  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);`
  );
  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);`
  );
  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS idx_leads_simulator ON leads(simulator);`
  );
  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);`
  );

  global.__bi_migrated = true;
}

/* ──────────────────────────────────────────────────────────────────
   Row mapper — converts Postgres TIMESTAMPTZ → ISO string (UI-friendly)
   ────────────────────────────────────────────────────────────────── */

function mapRow(r: Record<string, unknown>): LeadRecord {
  const asIso = (v: unknown) =>
    v instanceof Date ? v.toISOString() : (v as string | null) ?? "";
  return {
    ...(r as unknown as LeadRecord),
    created_at: asIso(r.created_at),
    updated_at: asIso(r.updated_at),
  };
}

/* ──────────────────────────────────────────────────────────────────
   Types — identical public API as v1 (SQLite)
   ────────────────────────────────────────────────────────────────── */

export interface LeadInsert {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string | null;
  age?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  simulator: string;
  simulatorId?: string | null;
  goal: string;
  zone: string;
  zoneTier?: string | null;
  intensity?: string | null;
  sport?: string | null;
  cellulite?: string | null;
  budgetClient?: string | null;
  availability?: string | null;
  timeframe?: string | null;
  source?: string | null;
  message?: string | null;
  mode?: string | null;
  priceSession?: number | null;
  priceCure?: number | null;
  priceTotal?: number | null;
  duoApplied?: boolean;
  complementarySimulator?: string | null;
  complementaryReason?: string | null;
  protocol: string | null;
  result: string | null;
  aiNotes: string | null;
  analysis: string | null;
  consent?: boolean;
  budget?: number;
  sourceIp?: string | null;
}

export async function insertLead(lead: LeadInsert): Promise<LeadRecord | null> {
  await ensureMigrated();
  const sql = getClient();
  const now = new Date();

  await sql`
    INSERT INTO leads (
      id, created_at, updated_at,
      first_name, last_name, email, phone, city, age, sex, height_cm, weight_kg,
      simulator, simulator_id, goal, zone, zone_tier, intensity, sport, cellulite,
      budget, budget_client, availability, timeframe, source, message,
      mode, price_session, price_cure, price_total,
      duo_applied, complementary_simulator, complementary_reason,
      protocol, result, ai_notes, analysis,
      consent, status, source_ip
    ) VALUES (
      ${lead.id}, ${now}, ${now},
      ${lead.firstName}, ${lead.lastName}, ${lead.email}, ${lead.phone},
      ${lead.city ?? null}, ${lead.age ?? null}, ${lead.sex ?? null},
      ${lead.heightCm ?? null}, ${lead.weightKg ?? null},
      ${lead.simulator}, ${lead.simulatorId ?? null}, ${lead.goal}, ${lead.zone},
      ${lead.zoneTier ?? null}, ${lead.intensity ?? null}, ${lead.sport ?? null},
      ${lead.cellulite ?? null},
      ${lead.budget ?? lead.priceTotal ?? 0}, ${lead.budgetClient ?? null},
      ${lead.availability ?? null}, ${lead.timeframe ?? null}, ${lead.source ?? null},
      ${lead.message ?? null},
      ${lead.mode ?? null}, ${lead.priceSession ?? null}, ${lead.priceCure ?? null},
      ${lead.priceTotal ?? null},
      ${lead.duoApplied ? 1 : 0}, ${lead.complementarySimulator ?? null},
      ${lead.complementaryReason ?? null},
      ${lead.protocol}, ${lead.result}, ${lead.aiNotes}, ${lead.analysis},
      ${lead.consent ? 1 : 0}, 'nouveau', ${lead.sourceIp ?? null}
    )
  `;

  return getLead(lead.id);
}

export async function getLead(id: string): Promise<LeadRecord | null> {
  await ensureMigrated();
  const sql = getClient();
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM leads WHERE id = ${id} LIMIT 1
  `;
  if (!rows.length) return null;
  return mapRow(rows[0]);
}

export interface LeadFilters {
  q?: string;
  status?: LeadStatus | "all";
  simulator?: string | "all";
  minBudget?: number;
  maxBudget?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "budget" | "last_name";
  order?: "asc" | "desc";
}

export async function listLeads(
  f: LeadFilters = {}
): Promise<{ rows: LeadRecord[]; total: number }> {
  await ensureMigrated();
  const sql = getClient();

  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, ...values: unknown[]) => {
    clauses.push(clause);
    params.push(...values);
  };

  if (f.q && f.q.trim()) {
    const like = `%${f.q.trim()}%`;
    add(
      `(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${
        params.length + 1
      } OR email ILIKE $${params.length + 1} OR phone ILIKE $${
        params.length + 1
      } OR goal ILIKE $${params.length + 1} OR zone ILIKE $${
        params.length + 1
      })`,
      like
    );
  }
  if (f.status && f.status !== "all") {
    add(`status = $${params.length + 1}`, f.status);
  }
  if (f.simulator && f.simulator !== "all") {
    add(`simulator = $${params.length + 1}`, f.simulator);
  }
  if (typeof f.minBudget === "number") {
    add(
      `COALESCE(price_total, budget) >= $${params.length + 1}`,
      f.minBudget
    );
  }
  if (typeof f.maxBudget === "number") {
    add(
      `COALESCE(price_total, budget) <= $${params.length + 1}`,
      f.maxBudget
    );
  }
  if (f.from) {
    add(`created_at >= $${params.length + 1}`, new Date(f.from));
  }
  if (f.to) {
    add(`created_at <= $${params.length + 1}`, new Date(f.to));
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const orderByMap: Record<string, string> = {
    created_at: "created_at",
    budget: "COALESCE(price_total, budget)",
    last_name: "last_name",
  };
  const orderBy = orderByMap[f.orderBy ?? "created_at"] ?? "created_at";
  const order = f.order === "asc" ? "ASC" : "DESC";
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);

  const listSql = `
    SELECT * FROM leads
    ${where}
    ORDER BY ${orderBy} ${order}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*)::int AS total FROM leads ${where}`;

  const [rows, countRows] = await Promise.all([
    sql.unsafe<Record<string, unknown>[]>(listSql, params as never[]),
    sql.unsafe<{ total: number }[]>(countSql, params as never[]),
  ]);

  return {
    rows: (rows as Record<string, unknown>[]).map(mapRow),
    total: (countRows[0]?.total as number) ?? 0,
  };
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<boolean> {
  await ensureMigrated();
  const sql = getClient();
  const res = await sql`
    UPDATE leads
    SET status = ${status}, updated_at = ${new Date()}
    WHERE id = ${id}
  `;
  return res.count > 0;
}

/** Partial update used by the 2-step flow (start → complete). */
export interface LeadSimulationUpdate {
  simulator?: string | null;
  simulatorId?: string | null;
  goal: string;
  zone: string;
  zoneTier?: string | null;
  intensity?: string | null;
  sport?: string | null;
  cellulite?: string | null;
  budgetClient?: string | null;
  availability?: string | null;
  timeframe?: string | null;
  source?: string | null;
  message?: string | null;
  mode?: string | null;
  priceSession?: number | null;
  priceCure?: number | null;
  priceTotal?: number | null;
  duoApplied?: boolean;
  complementarySimulator?: string | null;
  complementaryReason?: string | null;
  protocol?: string | null;
  result?: string | null;
  analysis?: string | null;
  aiNotes?: string | null;
}

export async function updateLeadSimulation(
  id: string,
  u: LeadSimulationUpdate
): Promise<LeadRecord | null> {
  await ensureMigrated();
  const sql = getClient();
  const res = await sql`
    UPDATE leads SET
      updated_at              = ${new Date()},
      simulator               = COALESCE(${u.simulator ?? null}, simulator),
      simulator_id            = COALESCE(${u.simulatorId ?? null}, simulator_id),
      goal                    = ${u.goal},
      zone                    = ${u.zone},
      zone_tier               = ${u.zoneTier ?? null},
      intensity               = ${u.intensity ?? null},
      sport                   = ${u.sport ?? null},
      cellulite               = ${u.cellulite ?? null},
      budget_client           = ${u.budgetClient ?? null},
      availability            = ${u.availability ?? null},
      timeframe               = ${u.timeframe ?? null},
      source                  = ${u.source ?? null},
      message                 = ${u.message ?? null},
      mode                    = ${u.mode ?? null},
      price_session           = ${u.priceSession ?? null},
      price_cure              = ${u.priceCure ?? null},
      price_total             = ${u.priceTotal ?? null},
      duo_applied             = ${u.duoApplied ? 1 : 0},
      complementary_simulator = ${u.complementarySimulator ?? null},
      complementary_reason    = ${u.complementaryReason ?? null},
      protocol                = ${u.protocol ?? null},
      result                  = ${u.result ?? null},
      analysis                = ${u.analysis ?? null},
      ai_notes                = ${u.aiNotes ?? null},
      budget                  = ${u.priceTotal ?? 0}
    WHERE id = ${id}
  `;
  if (res.count === 0) return null;
  return getLead(id);
}

/** Quick update for simulator label (used by /api/leads/complete). */
export async function updateLeadSimulator(
  id: string,
  simulator: string,
  simulatorId: string
): Promise<boolean> {
  await ensureMigrated();
  const sql = getClient();
  const res = await sql`
    UPDATE leads SET
      updated_at   = ${new Date()},
      simulator    = ${simulator},
      simulator_id = ${simulatorId}
    WHERE id = ${id}
  `;
  return res.count > 0;
}

export async function deleteLead(id: string): Promise<boolean> {
  await ensureMigrated();
  const sql = getClient();
  const res = await sql`DELETE FROM leads WHERE id = ${id}`;
  return res.count > 0;
}

export async function leadStats() {
  await ensureMigrated();
  const sql = getClient();

  const [totals, bySim, last7, last24h, allTime] = await Promise.all([
    sql<{ status: LeadStatus; count: number }[]>`
      SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status
    `,
    sql<
      { sid: string; name: string; count: number; pipeline: number }[]
    >`
      SELECT COALESCE(simulator_id, simulator, 'inconnu') AS sid,
             COALESCE(simulator, 'Inconnu') AS name,
             COUNT(*)::int AS count,
             COALESCE(SUM(COALESCE(price_total, budget)), 0)::int AS pipeline
      FROM leads
      GROUP BY sid, name
      ORDER BY count DESC
    `,
    sql<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'
    `,
    sql<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM leads WHERE created_at >= NOW() - INTERVAL '1 day'
    `,
    sql<{ c: number; pipeline: number }[]>`
      SELECT COUNT(*)::int AS c,
             COALESCE(SUM(COALESCE(price_total, budget)), 0)::int AS pipeline
      FROM leads
    `,
  ]);

  return {
    byStatus: Object.fromEntries(totals.map((r) => [r.status, r.count])),
    bySimulator: bySim,
    last7Days: last7[0]?.c ?? 0,
    last24h: last24h[0]?.c ?? 0,
    total: allTime[0]?.c ?? 0,
    pipeline: allTime[0]?.pipeline ?? 0,
  };
}

/* Back-compat export — some old callers used `db.prepare(...)`.
   Now exposes the raw postgres.js tagged-template client. */
export const db = {
  /** @deprecated — use the named async helpers instead. */
  sql: getClient,
};
