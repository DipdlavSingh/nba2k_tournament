import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TableMap, TableName } from "./types";

/**
 * Minimal table storage. Uses Supabase when SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set, otherwise a local JSON file so the app
 * runs with zero setup in development. The data set is tiny (a few dozen
 * rows), so all filtering happens in memory.
 */
export class UserError extends Error {}

type Row<T extends TableName> = TableMap[T];

interface Store {
  list<T extends TableName>(table: T): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, row: Row<T>): Promise<void>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<void>;
  remove(table: TableName, id: string): Promise<void>;
}

function friendly(error: { code?: string; message: string }): Error {
  if (error.code === "23505") return new UserError("That value is already taken.");
  return new Error(error.message);
}

class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }
  async list<T extends TableName>(table: T) {
    const { data, error } = await this.db.from(table).select("*").order("created_at", { ascending: true });
    if (error) throw friendly(error);
    return (data ?? []) as Row<T>[];
  }
  async get<T extends TableName>(table: T, id: string) {
    const { data, error } = await this.db.from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw friendly(error);
    return (data ?? null) as Row<T> | null;
  }
  async insert<T extends TableName>(table: T, row: Row<T>) {
    const { error } = await this.db.from(table).insert(row);
    if (error) throw friendly(error);
  }
  async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
    const { error } = await this.db.from(table).update(patch as never).eq("id", id);
    if (error) throw friendly(error);
  }
  async remove(table: TableName, id: string) {
    const { error } = await this.db.from(table).delete().eq("id", id);
    if (error) throw friendly(error);
  }
}

type FileData = { [K in TableName]: Row<K>[] };

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "db.json");
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<FileData> {
    const empty: FileData = { players: [], teams: [], games: [], banners: [], settings: [] };
    try {
      return { ...empty, ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch {
      return empty;
    }
  }
  private mutate(fn: (data: FileData) => void): Promise<void> {
    const next = this.queue.then(async () => {
      const data = await this.read();
      fn(data);
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(data, null, 2));
    });
    this.queue = next.catch(() => {});
    return next;
  }
  async list<T extends TableName>(table: T) {
    await this.queue;
    return ((await this.read())[table] ?? []) as Row<T>[];
  }
  async get<T extends TableName>(table: T, id: string) {
    return (await this.list(table)).find((r) => r.id === id) ?? null;
  }
  insert<T extends TableName>(table: T, row: Row<T>) {
    return this.mutate((d) => {
      (d[table] as Row<T>[]).push(row);
    });
  }
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
    return this.mutate((d) => {
      const rows = d[table] as Row<T>[];
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows[i] = { ...rows[i], ...patch };
    });
  }
  remove(table: TableName, id: string) {
    return this.mutate((d) => {
      (d as Record<string, { id: string }[]>)[table] = d[table].filter((r) => r.id !== id);
      // Mirror the foreign keys in supabase/schema.sql.
      if (table === "teams") {
        d.games = d.games.filter((g) => g.home_team_id !== id && g.away_team_id !== id);
        d.players = d.players.map((p) => (p.team_id === id ? { ...p, team_id: null } : p));
      }
      if (table === "teams" || table === "games") {
        const gameIds = new Set(d.games.map((g) => g.id));
        d.banners = d.banners.filter((b) => gameIds.has(b.id));
      }
    });
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url && process.env.VERCEL) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production.");
}

export const store: Store = url && key ? new SupabaseStore(url, key) : new FileStore();
export const usingLocalStore = !(url && key);
