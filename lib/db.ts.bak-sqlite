import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { LeadStatus, LeadRecord } from "./types";

export type { LeadStatus, LeadRecord } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "bodyinstitut.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __bi_db: Database.Database | undefined;
}

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  bootstrap(db);
  return db;
}

export const db: Database.Database = global.__bi_db ?? createDb();
if (process.env.NODE_ENV !== "production") global.__bi_db = db;

function bootstrap(db: Database.Database) {
  // Base table — kept compatible with the original v1 schema.
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id            TEXT PRIMARY KEY,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
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

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_simulator  ON leads(simulator);
    CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads(email);
  `);

  // Idempotent v2 migrations (safe on existing rows).
  const cols = db
    .prepare<[], { name: string }>(`PRAGMA table_info(leads)`)
    .all()
    .map((r) => r.name);

  const addCol = (name: string, ddl: string) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE leads ADD COLUMN ${ddl}`);
  };

  addCol("simulator_id",            "simulator_id TEXT");
  addCol("zone_tier",               "zone_tier TEXT");
  addCol("city",                    "city TEXT");
  addCol("age",                     "age INTEGER");
  addCol("sex",                     "sex TEXT");
  addCol("height_cm",               "height_cm INTEGER");
  addCol("weight_kg",               "weight_kg INTEGER");
  addCol("cellulite",               "cellulite TEXT");
  addCol("budget_client",           "budget_client TEXT");
  addCol("availability",            "availability TEXT");
  addCol("message",                 "message TEXT");
  addCol("mode",                    "mode TEXT");
  addCol("price_session",           "price_session INTEGER");
  addCol("price_cure",              "price_cure INTEGER");
  addCol("price_total",             "price_total INTEGER");
  addCol("duo_applied",             "duo_applied INTEGER NOT NULL DEFAULT 0");
  addCol("complementary_simulator", "complementary_simulator TEXT");
  addCol("complementary_reason",    "complementary_reason TEXT");
  addCol("consent",                 "consent INTEGER NOT NULL DEFAULT 0");
  addCol("timeframe",               "timeframe TEXT");
  addCol("source",                  "source TEXT");
}

export interface LeadInsert {
  id: string;
  // Identity
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string | null;
  age?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  // Simulator
  simulator: string;          // display name
  simulatorId?: string | null;
  goal: string;
  zone: string;
  zoneTier?: string | null;
  intensity?: string | null;
  sport?: string | null;
  cellulite?: string | null;
  budgetClient?: string | null;
  availability?: string | null;
  message?: string | null;
  // Pricing & recommendation
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
  /** legacy alias kept so old callers writing `budget` still work */
  budget?: number;
  sourceIp?: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO leads (
    id, created_at, updated_at,
    first_name, last_name, email, phone, city, age, sex, height_cm, weight_kg,
    simulator, simulator_id, goal, zone, zone_tier, intensity, sport, cellulite,
    budget, budget_client, availability, message,
    mode, price_session, price_cure, price_total,
    duo_applied, complementary_simulator, complementary_reason,
    protocol, result, ai_notes, analysis,
    consent, status, source_ip
  ) VALUES (
    @id, @now, @now,
    @firstName, @lastName, @email, @phone, @city, @age, @sex, @heightCm, @weightKg,
    @simulator, @simulatorId, @goal, @zone, @zoneTier, @intensity, @sport, @cellulite,
    @budget, @budgetClient, @availability, @message,
    @mode, @priceSession, @priceCure, @priceTotal,
    @duoApplied, @complementarySimulator, @complementaryReason,
    @protocol, @result, @aiNotes, @analysis,
    @consent, 'nouveau', @sourceIp
  )
`);

export function insertLead(lead: LeadInsert) {
  const now = new Date().toISOString();
  insertStmt.run({
    id: lead.id,
    now,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    city: lead.city ?? null,
    age: lead.age ?? null,
    sex: lead.sex ?? null,
    heightCm: lead.heightCm ?? null,
    weightKg: lead.weightKg ?? null,
    simulator: lead.simulator,
    simulatorId: lead.simulatorId ?? null,
    goal: lead.goal,
    zone: lead.zone,
    zoneTier: lead.zoneTier ?? null,
    intensity: lead.intensity ?? null,
    sport: lead.sport ?? null,
    cellulite: lead.cellulite ?? null,
    budget: lead.budget ?? lead.priceTotal ?? 0,
    budgetClient: lead.budgetClient ?? null,
    availability: lead.availability ?? null,
    message: lead.message ?? null,
    mode: lead.mode ?? null,
    priceSession: lead.priceSession ?? null,
    priceCure: lead.priceCure ?? null,
    priceTotal: lead.priceTotal ?? null,
    duoApplied: lead.duoApplied ? 1 : 0,
    complementarySimulator: lead.complementarySimulator ?? null,
    complementaryReason: lead.complementaryReason ?? null,
    protocol: lead.protocol,
    result: lead.result,
    aiNotes: lead.aiNotes,
    analysis: lead.analysis,
    consent: lead.consent ? 1 : 0,
    sourceIp: lead.sourceIp ?? null,
  });
  return getLead(lead.id);
}

export function getLead(id: string): LeadRecord | null {
  return (
    (db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRecord) ||
    null
  );
}

export interface LeadFilters {
  q?: string;
  status?: LeadStatus | "all";
  simulator?: string | "all";
  minBudget?: number;
  maxBudget?: number;
  from?: string; // ISO date inclusive
  to?: string;   // ISO date inclusive
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "budget" | "last_name";
  order?: "asc" | "desc";
}

export function listLeads(f: LeadFilters = {}) {
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (f.q && f.q.trim()) {
    where.push(
      `(first_name LIKE @q OR last_name LIKE @q OR email LIKE @q OR phone LIKE @q OR goal LIKE @q OR zone LIKE @q)`
    );
    params.q = `%${f.q.trim()}%`;
  }
  if (f.status && f.status !== "all") {
    where.push("status = @status");
    params.status = f.status;
  }
  if (f.simulator && f.simulator !== "all") {
    where.push("simulator = @simulator");
    params.simulator = f.simulator;
  }
  if (typeof f.minBudget === "number") {
    where.push("COALESCE(price_total, budget) >= @minBudget");
    params.minBudget = f.minBudget;
  }
  if (typeof f.maxBudget === "number") {
    where.push("COALESCE(price_total, budget) <= @maxBudget");
    params.maxBudget = f.maxBudget;
  }
  if (f.from) {
    where.push("created_at >= @from");
    params.from = f.from;
  }
  if (f.to) {
    where.push("created_at <= @to");
    params.to = f.to;
  }

  const orderByMap: Record<string, string> = {
    created_at: "created_at",
    budget: "COALESCE(price_total, budget)",
    last_name: "last_name",
  };
  const orderBy = orderByMap[f.orderBy ?? "created_at"] ?? "created_at";
  const order = f.order === "asc" ? "ASC" : "DESC";
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);

  const sql = `
    SELECT * FROM leads
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${orderBy} ${order}
    LIMIT @limit OFFSET @offset
  `;
  const rows = db
    .prepare(sql)
    .all({ ...params, limit, offset }) as LeadRecord[];

  const totalSql = `SELECT COUNT(*) AS total FROM leads ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`;
  const { total } = db.prepare(totalSql).get(params) as { total: number };

  return { rows, total };
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  const stmt = db.prepare(
    "UPDATE leads SET status = ?, updated_at = ? WHERE id = ?"
  );
  const res = stmt.run(status, new Date().toISOString(), id);
  return res.changes > 0;
}

/** Partial update used by the 2-step flow (start → complete). */
export interface LeadSimulationUpdate {
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

const updateSimStmt = db.prepare(`
  UPDATE leads SET
    updated_at              = @now,
    goal                    = @goal,
    zone                    = @zone,
    zone_tier               = @zoneTier,
    intensity               = @intensity,
    sport                   = @sport,
    cellulite               = @cellulite,
    budget_client           = @budgetClient,
    availability            = @availability,
    timeframe               = @timeframe,
    source                  = @source,
    message                 = @message,
    mode                    = @mode,
    price_session           = @priceSession,
    price_cure              = @priceCure,
    price_total             = @priceTotal,
    duo_applied             = @duoApplied,
    complementary_simulator = @complementarySimulator,
    complementary_reason    = @complementaryReason,
    protocol                = @protocol,
    result                  = @result,
    analysis                = @analysis,
    ai_notes                = @aiNotes,
    budget                  = @budget
  WHERE id = @id
`);

export function updateLeadSimulation(id: string, u: LeadSimulationUpdate) {
  const res = updateSimStmt.run({
    id,
    now: new Date().toISOString(),
    goal: u.goal,
    zone: u.zone,
    zoneTier: u.zoneTier ?? null,
    intensity: u.intensity ?? null,
    sport: u.sport ?? null,
    cellulite: u.cellulite ?? null,
    budgetClient: u.budgetClient ?? null,
    availability: u.availability ?? null,
    timeframe: u.timeframe ?? null,
    source: u.source ?? null,
    message: u.message ?? null,
    mode: u.mode ?? null,
    priceSession: u.priceSession ?? null,
    priceCure: u.priceCure ?? null,
    priceTotal: u.priceTotal ?? null,
    duoApplied: u.duoApplied ? 1 : 0,
    complementarySimulator: u.complementarySimulator ?? null,
    complementaryReason: u.complementaryReason ?? null,
    protocol: u.protocol ?? null,
    result: u.result ?? null,
    analysis: u.analysis ?? null,
    aiNotes: u.aiNotes ?? null,
    budget: u.priceTotal ?? 0,
  });
  if (res.changes === 0) return null;
  return getLead(id);
}

export function deleteLead(id: string) {
  return db.prepare("DELETE FROM leads WHERE id = ?").run(id).changes > 0;
}

export function leadStats() {
  const totals = db
    .prepare(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    )
    .all() as { status: LeadStatus; count: number }[];

  const bySim = db
    .prepare(
      `SELECT COALESCE(simulator_id, simulator, 'inconnu') AS sid,
              COALESCE(simulator, 'Inconnu') AS name,
              COUNT(*) AS count,
              COALESCE(SUM(COALESCE(price_total, budget)), 0) AS pipeline
       FROM leads
       GROUP BY sid
       ORDER BY count DESC`
    )
    .all() as { sid: string; name: string; count: number; pipeline: number }[];

  const last7 = db
    .prepare(
      `SELECT COUNT(*) AS c FROM leads WHERE created_at >= datetime('now','-7 days')`
    )
    .get() as { c: number };

  const last24h = db
    .prepare(
      `SELECT COUNT(*) AS c FROM leads WHERE created_at >= datetime('now','-1 day')`
    )
    .get() as { c: number };

  const allTime = db
    .prepare(
      `SELECT COUNT(*) AS c,
              COALESCE(SUM(COALESCE(price_total, budget)), 0) AS pipeline
       FROM leads`
    )
    .get() as { c: number; pipeline: number };

  return {
    byStatus: Object.fromEntries(totals.map((r) => [r.status, r.count])),
    bySimulator: bySim,
    last7Days: last7.c,
    last24h: last24h.c,
    total: allTime.c,
    pipeline: allTime.pipeline,
  };
}
