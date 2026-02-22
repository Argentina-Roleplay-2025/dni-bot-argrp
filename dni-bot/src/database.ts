import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// En Railway los archivos persisten en /data si configurás un volumen,
// o en el directorio del proyecto si no. Para simplicidad usamos ./data/
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "dnis.sqlite"));

// ── Crear tablas si no existen ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS dnis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_user_id TEXT    NOT NULL,
    numero_pj       INTEGER NOT NULL,
    nombre          TEXT    NOT NULL,
    apellido        TEXT    NOT NULL,
    nacionalidad    TEXT    NOT NULL,
    sexo            TEXT    NOT NULL,
    fecha_nacimiento TEXT   NOT NULL,
    fecha_emision   TEXT    NOT NULL,
    documento       INTEGER NOT NULL UNIQUE,
    roblox_username TEXT    NOT NULL,
    avatar_url      TEXT    NOT NULL DEFAULT '',
    UNIQUE(discord_user_id, numero_pj)
  );

  CREATE TABLE IF NOT EXISTS calificaciones (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_user_id       TEXT    NOT NULL,
    calificador_user_id TEXT    NOT NULL,
    estrellas           INTEGER NOT NULL,
    nota                TEXT    NOT NULL,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contador_documentos (
    id      INTEGER PRIMARY KEY CHECK (id = 1),
    ultimo  INTEGER NOT NULL DEFAULT 1000
  );

  INSERT OR IGNORE INTO contador_documentos (id, ultimo) VALUES (1, 1000);
`);

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface DniRecord {
  id:              number;
  discordUserId:   string;
  numeroPj:        number;
  nombre:          string;
  apellido:        string;
  nacionalidad:    string;
  sexo:            string;
  fechaNacimiento: string;
  fechaEmision:    string;
  documento:       number;
  robloxUsername:  string;
  avatarUrl:       string;
}

// ── Helpers de mapeo ──────────────────────────────────────────────────────────
function rowToDni(row: any): DniRecord {
  return {
    id:              row.id,
    discordUserId:   row.discord_user_id,
    numeroPj:        row.numero_pj,
    nombre:          row.nombre,
    apellido:        row.apellido,
    nacionalidad:    row.nacionalidad,
    sexo:            row.sexo,
    fechaNacimiento: row.fecha_nacimiento,
    fechaEmision:    row.fecha_emision,
    documento:       row.documento,
    robloxUsername:  row.roblox_username,
    avatarUrl:       row.avatar_url ?? "",
  };
}

// ── Operaciones ───────────────────────────────────────────────────────────────

export function getNextDocumento(): number {
  const update = db.prepare("UPDATE contador_documentos SET ultimo = ultimo + 1 WHERE id = 1");
  const select = db.prepare("SELECT ultimo FROM contador_documentos WHERE id = 1");
  const trx    = db.transaction(() => { update.run(); return (select.get() as any).ultimo as number; });
  return trx();
}

export function createDni(data: Omit<DniRecord, "id">): void {
  db.prepare(`
    INSERT INTO dnis
      (discord_user_id, numero_pj, nombre, apellido, nacionalidad, sexo,
       fecha_nacimiento, fecha_emision, documento, roblox_username, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.discordUserId, data.numeroPj, data.nombre, data.apellido,
    data.nacionalidad, data.sexo, data.fechaNacimiento, data.fechaEmision,
    data.documento, data.robloxUsername, data.avatarUrl,
  );
}

export function getDniByDiscordIdAndSlot(discordUserId: string, numeroPj: number): DniRecord | null {
  const row = db.prepare("SELECT * FROM dnis WHERE discord_user_id = ? AND numero_pj = ?").get(discordUserId, numeroPj);
  return row ? rowToDni(row) : null;
}

export function getAllDnis(): DniRecord[] {
  return (db.prepare("SELECT * FROM dnis ORDER BY documento ASC").all() as any[]).map(rowToDni);
}

export function countDnisByDiscordId(discordUserId: string): number {
  const row = db.prepare("SELECT COUNT(*) as c FROM dnis WHERE discord_user_id = ?").get(discordUserId) as any;
  return row.c as number;
}

export function deleteDniByDiscordIdAndSlot(discordUserId: string, numeroPj: number): void {
  db.prepare("DELETE FROM dnis WHERE discord_user_id = ? AND numero_pj = ?").run(discordUserId, numeroPj);
}

export function countAllDnis(): number {
  const row = db.prepare("SELECT COUNT(*) as c FROM dnis").get() as any;
  return row.c as number;
}

export function createCalificacion(data: { staffUserId: string; calificadorUserId: string; estrellas: number; nota: string }): void {
  db.prepare(`
    INSERT INTO calificaciones (staff_user_id, calificador_user_id, estrellas, nota)
    VALUES (?, ?, ?, ?)
  `).run(data.staffUserId, data.calificadorUserId, data.estrellas, data.nota);
}

export function countCalificacionesByStaff(staffUserId: string): number {
  const row = db.prepare("SELECT COUNT(*) as c FROM calificaciones WHERE staff_user_id = ?").get(staffUserId) as any;
  return row.c as number;
}

export function getPromedioEstrellasByStaff(staffUserId: string): string {
  const row = db.prepare("SELECT AVG(estrellas) as avg FROM calificaciones WHERE staff_user_id = ?").get(staffUserId) as any;
  return row.avg ? Number(row.avg).toFixed(1) : "0.0";
}
