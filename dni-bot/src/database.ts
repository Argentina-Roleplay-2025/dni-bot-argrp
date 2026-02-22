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

  INSERT OR REPLACE INTO contador_documentos (id, ultimo) VALUES (1, 132);

  INSERT OR IGNORE INTO dnis (discord_user_id, numero_pj, nombre, apellido, nacionalidad, sexo, fecha_nacimiento, fecha_emision, documento, roblox_username, avatar_url) VALUES
  ('1439737121543032972',1,'Mateo','Martinez','Argentina','Hombre','07/03/2002','20/02/2026',126,'franchilisco8','https://tr.rbxcdn.com/30DAY-AvatarBust-7A139952E23DC6B85A56DD729BFA9849-Png/420/420/AvatarBust/Png/noFilter'),
  ('1358439055083311144',1,'Shadow','Mendez','Argentina','Hombre','04/03/2005','16/02/2026',11,'vladimir250426','https://tr.rbxcdn.com/30DAY-AvatarBust-60204AFC0EDD11E7795CC4BC3FA19519-Png/420/420/AvatarBust/Png/noFilter'),
  ('1129528286691725416',1,'Juan Carlos','Martinez','Argentina','Hombre','19/05/1974','16/02/2026',12,'xXvalenXx71','https://tr.rbxcdn.com/30DAY-AvatarBust-00183D46E2AF4FC6EEA15566A1741259-Png/420/420/AvatarBust/Png/noFilter'),
  ('519929216817561600',1,'María','Jiménez','Española','Mujer','14/05/1989','16/02/2026',14,'IJustKraositaESP','https://tr.rbxcdn.com/30DAY-AvatarBust-7DCBE75FF069D1E4371A00A2E47F4AE4-Png/420/420/AvatarBust/Png/noFilter'),
  ('1370583972643344520',1,'Bautista','Ezequiel','Argentina','Hombre','05/06/1995','17/02/2026',15,'elciberlux548','https://tr.rbxcdn.com/30DAY-AvatarBust-38348234A63728121ACEA602320FC4BD-Png/420/420/AvatarBust/Png/noFilter'),
  ('1389732344977428673',1,'Alexis','Ortiz','Argentina','Hombre','11/05/2000','18/02/2026',20,'neiwitoo','https://tr.rbxcdn.com/30DAY-AvatarBust-71126B4EC92AC3D8C1E9F6403724D825-Png/420/420/AvatarBust/Png/noFilter'),
  ('767515559767572511',1,'Pan','Chi','Argentina','Hombre','24/07/1999','18/02/2026',21,'Sr_Pan2407','https://tr.rbxcdn.com/30DAY-AvatarBust-3C01BFD517176D0F4A50CF79BFDAD761-Png/420/420/AvatarBust/Png/noFilter'),
  ('906728465523437599',1,'Rodrigo','Martinez','Mexicana','Hombre','16/04/2000','18/02/2026',22,'rodri9486','https://tr.rbxcdn.com/30DAY-AvatarBust-10BCD1CC368A4D995DA097147AD1C00B-Png/420/420/AvatarBust/Png/noFilter'),
  ('1121460467156664380',1,'Chicho','Shelby','Argentina','Hombre','05/05/2005','18/02/2026',25,'CacquitaDechicho','https://tr.rbxcdn.com/30DAY-AvatarBust-4AEF4DEBFE7B0988A0F013C3D92C5567-Png/420/420/AvatarBust/Png/noFilter'),
  ('1058497894342217758',1,'Gonzalo.','Avellaneda.','Argentina.','Hombre','13/02/1998','18/02/2026',26,'lucasoproas','https://tr.rbxcdn.com/30DAY-AvatarBust-9763AD16604DF181168E2E3CB911E57F-Png/420/420/AvatarBust/Png/noFilter'),
  ('1121460467156664380',2,'Arthur','Morgan','Alemana','Hombre','02/04/2001','18/02/2026',28,'CacquitaDechicho','https://tr.rbxcdn.com/30DAY-AvatarBust-8B1CC9A9FE8BEF59F7F3F518AB4392F3-Png/420/420/AvatarBust/Png/noFilter'),
  ('1243674294236614836',2,'Lucio','Friedenthal','Argentina','Hombre','01/01/2001','18/02/2026',29,'soyunraxes','https://tr.rbxcdn.com/30DAY-AvatarBust-6810FF08CF48B24C24CACE8CC35DFD59-Png/420/420/AvatarBust/Png/noFilter'),
  ('1327381737185214469',1,'Pipo','Fernández','Uruguaya','Hombre','04/02/1995','18/02/2026',31,'IJustPippasUY','https://tr.rbxcdn.com/30DAY-AvatarBust-CD8767B651F7092E264C3BE86789923D-Png/420/420/AvatarBust/Png/noFilter'),
  ('1003721868492157008',1,'Juan','Sosa','Argentino','Hombre','31/08/1999','18/02/2026',33,'pPanditGame56','https://tr.rbxcdn.com/30DAY-AvatarBust-A42AF21C4E244B51AF0DC6D0F28F1DCD-Png/420/420/AvatarBust/Png/noFilter'),
  ('1003721868492157008',2,'Pablo','Sandoval','Argentina','Hombre','28/01/2001','18/02/2026',36,'pPanditGame56','https://tr.rbxcdn.com/30DAY-AvatarBust-ECAB4FA480406896B0F0FA2427340C56-Png/420/420/AvatarBust/Png/noFilter'),
  ('1355335749867929901',1,'Lian','Fernandez','Colombia','Hombre','17/04/2000','18/02/2026',37,'Gruu7700','https://tr.rbxcdn.com/30DAY-AvatarBust-F143DBBBC31BE57AE3BB4B016A6C7DAF-Png/420/420/AvatarBust/Png/noFilter'),
  ('1355335749867929901',2,'Ernesto','Garcia','Colombiana','Hombre','26/09/1974','18/02/2026',38,'Gruu7700','https://tr.rbxcdn.com/30DAY-AvatarBust-1F0BBC29ED7F1EB84599DD923BCFD022-Png/420/420/AvatarBust/Png/noFilter'),
  ('1265159133531734076',1,'Agustin','Bordon','Argentina','Hombre','08/09/2002','18/02/2026',39,'tomaas_munozz',''),
  ('1222939276170231919',1,'Pedro','Bonav','argentina','Hombre','03/12/1990','18/02/2026',40,'PEDROBONAVETI','https://tr.rbxcdn.com/30DAY-AvatarBust-E0BBE6D258EF2DB40C40466A4AE8AC5F-Png/420/420/AvatarBust/Png/noFilter'),
  ('775781321716531200',1,'Francesco','Rossi','Italiana','Hombre','10/02/2001','18/02/2026',43,'zGARRAX','https://tr.rbxcdn.com/30DAY-AvatarBust-56CC0E9CE1133CFCCDB581DC926FB2C4-Png/420/420/AvatarBust/Png/noFilter'),
  ('1259708325696770120',1,'Alejandro','Guzmán','Argentina','Hombre','17/09/2000','18/02/2026',44,'Me_asaltaronenperu','https://tr.rbxcdn.com/30DAY-AvatarBust-012DC830ED725D3A19864AFFE1E4A33B-Png/420/420/AvatarBust/Png/noFilter'),
  ('1046958507280318474',1,'Santino','Salomón','Argentina','Hombre','18/10/2000','18/02/2026',48,'santijodiprooooooo','https://tr.rbxcdn.com/30DAY-AvatarBust-7197D312F565E2149F82822C273FAA1D-Png/420/420/AvatarBust/Png/noFilter'),
  ('775781321716531200',2,'Frederik','Hayha','Finlandesa','Hombre','11/07/1998','18/02/2026',49,'zGARRAX','https://tr.rbxcdn.com/30DAY-AvatarBust-127EA0852B7C4EA2708DEA8B270823B6-Png/420/420/AvatarBust/Png/noFilter'),
  ('770086705544822816',1,'Alexander','Lancaster','Argentina','Hombre','12/06/2003','18/02/2026',50,'Agustinesp_Roblox','https://tr.rbxcdn.com/30DAY-AvatarBust-36038EF1EBF9077188601857B6B2632D-Png/420/420/AvatarBust/Png/noFilter'),
  ('999355145819267095',1,'MAVERICK','LANDA','Argentina','Hombre','25/06/2000','18/02/2026',52,'SpiritDMC','https://tr.rbxcdn.com/30DAY-AvatarBust-C8D535FE03E8172CD7A7D84A9814BF05-Png/420/420/AvatarBust/Png/noFilter'),
  ('709599851314282547',1,'Tomas','Rodriguez','Argentina','Hombre','05/07/2000','18/02/2026',56,'nanojuega','https://tr.rbxcdn.com/30DAY-AvatarBust-7A510ED77E82AAD5A5D07F9E30B619BA-Png/420/420/AvatarBust/Png/noFilter'),
  ('1399510167883612160',1,'Rios Montoya','Richard','Colombiana','Hombre','10/02/2004','18/02/2026',57,'1029Andresgoat','https://tr.rbxcdn.com/30DAY-AvatarBust-46AE860A2AFC88A11F8AEB6BF7C3B3C2-Png/420/420/AvatarBust/Png/noFilter'),
  ('1087221787919663124',1,'ivan','mercedes','argentina','Hombre','01/03/2000','18/02/2026',58,'elyacarexd131','https://tr.rbxcdn.com/30DAY-AvatarBust-C091C38B2408B27088451EF6366D3B92-Png/420/420/AvatarBust/Png/noFilter'),
  ('640933313439072282',1,'Villalba','Tomás','Uruguaya','Hombre','20/02/2002','20/02/2026',127,'XXXFALOPAXXX123','https://tr.rbxcdn.com/30DAY-AvatarBust-07303A332B34A27ECD8EA6F86F002D47-Png/420/420/AvatarBust/Png/noFilter'),
  ('1120490727546306612',1,'Bulieri','Federico','Argentina','Hombre','15/04/1996','18/02/2026',63,'fedegpalma','https://tr.rbxcdn.com/30DAY-AvatarBust-694E0278FD67C13572F41282D1F94D03-Png/420/420/AvatarBust/Png/noFilter'),
  ('1298407586940588054',1,'Martial','Dacota Reina','Uruguaya','Hombre','03/03/2003','18/02/2026',64,'NyXoy_PvP','https://tr.rbxcdn.com/30DAY-AvatarBust-033BFF47B46178E0395491DE70FB3192-Png/420/420/AvatarBust/Png/noFilter'),
  ('1298407586940588054',2,'Lucas','Cepeda Moura','Chilena','Hombre','06/01/2003','18/02/2026',65,'NyXoy_PvP','https://tr.rbxcdn.com/30DAY-AvatarBust-49B32FBEFE1D90DFBFBF8325977D9D3B-Png/420/420/AvatarBust/Png/noFilter'),
  ('990694572592074832',2,'Pedro','Colapinto','Argentina','Hombre','12/12/2005','18/02/2026',66,'Pedrohnee','https://tr.rbxcdn.com/30DAY-AvatarBust-F9409894214364F3EA33F20873F29C2A-Png/420/420/AvatarBust/Png/noFilter'),
  ('1311530158867484692',1,'Brandon','Rodriguez','Mexicano','Hombre','15/06/2000','18/02/2026',67,'BrandonPr90','https://tr.rbxcdn.com/30DAY-AvatarBust-F27FE93AD3CB0E757FC733958449355F-Png/420/420/AvatarBust/Png/noFilter'),
  ('1045314073488789504',2,'Alexis','McKennedy','Britanica','Hombre','27/12/1967','18/02/2026',68,'Santiago827372','https://tr.rbxcdn.com/30DAY-AvatarBust-99478032EFC8366CF6D86074B62FC5E1-Png/420/420/AvatarBust/Png/noFilter'),
  ('831621757999251528',1,'José','Martínez','Argentina','Hombre','18/01/1964','18/02/2026',69,'TTVcjcool1','https://tr.rbxcdn.com/30DAY-AvatarBust-A7A844D24807F773D17146F119B74C65-Png/420/420/AvatarBust/Png/noFilter'),
  ('756278910588813385',2,'Martín','Fernandez Trucan','Uruguaya','Hombre','04/08/1999','20/02/2026',129,'Player_forOsu','https://tr.rbxcdn.com/30DAY-AvatarBust-718DEB1CF4B818BE1FDDD6DDDF26365F-Png/420/420/AvatarBust/Png/noFilter'),
  ('1343322304754618439',2,'Martinez','Santiago','Argentina','Hombre','12/10/2003','21/02/2026',132,'gyoraillh23','https://tr.rbxcdn.com/30DAY-AvatarBust-46F05BA03A61E74EA3C83DE3F6D32291-Png/420/420/AvatarBust/Png/noFilter'),
  ('1165738192033566723',1,'Iñaki','Carsaniga','Argentina','Hombre','21/05/2000','18/02/2026',73,'ikakigcy','https://tr.rbxcdn.com/30DAY-AvatarBust-B192CC27981DC60BBBBAC13FAB457002-Png/420/420/AvatarBust/Png/noFilter'),
  ('751542790667632811',1,'Juan','Rossi','Argentina','Hombre','06/07/2005','18/02/2026',74,'Santi_TM10','https://tr.rbxcdn.com/30DAY-AvatarBust-B56D4668B7560D65C691E8AB23A1A00A-Png/420/420/AvatarBust/Png/noFilter'),
  ('756278910588813385',1,'Máximo','Perez Brum','Uruguaya','Hombre','04/09/2001','18/02/2026',76,'Player_forOsu','https://tr.rbxcdn.com/30DAY-AvatarBust-C994ACCA5F6FA3BE45068DC81ECC17D5-Png/420/420/AvatarBust/Png/noFilter'),
  ('1259708325696770120',2,'Adolfo','Salem','Saudí','Hombre','31/08/1994','18/02/2026',77,'Me_asaltaronenperu','https://tr.rbxcdn.com/30DAY-AvatarBust-50F997F0B0D31A4C6AFB24D3C4C35F93-Png/420/420/AvatarBust/Png/noFilter'),
  ('1147887910411059261',1,'Gianluca','Bartolomeo','Argentina','Hombre','29/07/1981','19/02/2026',81,'ElGiANLUCAPro2323','https://tr.rbxcdn.com/30DAY-AvatarBust-1E53C9B5B8CBC3914500561AEA0B8A73-Png/420/420/AvatarBust/Png/noFilter'),
  ('888148263994277949',1,'Sebastián','Martinez','Española','Hombre','02/06/1983','19/02/2026',82,'cerdp415','https://tr.rbxcdn.com/30DAY-AvatarBust-50968BA6C9A910589D04A3092EC1CA64-Png/420/420/AvatarBust/Png/noFilter'),
  ('912492601201025045',1,'Fernando','Burlando','Argentina','Hombre','08/12/1975','19/02/2026',85,'valrroj_09','https://tr.rbxcdn.com/30DAY-AvatarBust-C2883B2C1EDA685D6A5308AB659DAD59-Png/420/420/AvatarBust/Png/noFilter'),
  ('1095152767703732224',1,'Christian Andrés','Vortex Salazar','colombiana','Hombre','02/01/1999','19/02/2026',87,'ByTomy_600','https://tr.rbxcdn.com/30DAY-AvatarBust-0128712AF103919B0D29DF930D2FF847-Png/420/420/AvatarBust/Png/noFilter'),
  ('1339741535440338944',1,'Nicolás','Gómez','Argentina','Hombre','15/07/2004','19/02/2026',91,'ByRamixz','https://tr.rbxcdn.com/30DAY-AvatarBust-D3E08B7ACB33CADE3D7E69EDF441F25B-Png/420/420/AvatarBust/Png/noFilter'),
  ('1358439055083311144',2,'Vladimir','Fernandez','Argentina','Hombre','04/03/2005','19/02/2026',92,'vladimir250426','https://tr.rbxcdn.com/30DAY-AvatarBust-46A6621BCD3025A5F12603F47EE67251-Png/420/420/AvatarBust/Png/noFilter'),
  ('1400931721947385898',1,'Benjamín Eliuth','Hinstz','Chileno','Hombre','12/10/1998','19/02/2026',94,'hinstzbenjamin1','https://tr.rbxcdn.com/30DAY-AvatarBust-7B9D73D080FDB05A4BB67EFEDCF8A860-Png/420/420/AvatarBust/Png/noFilter'),
  ('912492601201025045',2,'Rodolfo','Otero','Argentina','Hombre','15/03/1990','19/02/2026',96,'valrroj_09','https://tr.rbxcdn.com/30DAY-AvatarBust-17A9FCD4E75FE235D642334B7FDAC213-Png/420/420/AvatarBust/Png/noFilter'),
  ('1370583972643344520',2,'Hernán','García','Argentina','Hombre','10/12/1990','19/02/2026',99,'elciberlux548','https://tr.rbxcdn.com/30DAY-AvatarBust-6F6B84CD4390E22EF23D7A8326488D7D-Png/420/420/AvatarBust/Png/noFilter'),
  ('713028163646521406',1,'Salvador','Guarco','Argentina','Hombre','01/01/2000','19/02/2026',101,'salvapantera','https://tr.rbxcdn.com/30DAY-AvatarBust-BFC5EBA942CF8F957AB86350CDB1AC5E-Png/420/420/AvatarBust/Png/noFilter'),
  ('754033523782058017',2,'Juanchi','Banshee','Argentina','Hombre','20/12/2001','19/02/2026',103,'SANTINOOO234656','https://tr.rbxcdn.com/30DAY-AvatarBust-860AED816AC9E6D94C274662ADBC0F1A-Png/420/420/AvatarBust/Png/noFilter'),
  ('1244435069658206219',1,'Marcos','Chusco','Alemana','Hombre','15/01/2006','19/02/2026',104,'marcoschusco','https://tr.rbxcdn.com/30DAY-AvatarBust-D4C6C5B12ABC9F50A567D8A81E52D5DE-Png/420/420/AvatarBust/Png/noFilter'),
  ('1244435069658206219',2,'Roberto','Adolfo','Alemana','Hombre','15/03/1945','19/02/2026',107,'marcoschusco','https://tr.rbxcdn.com/30DAY-AvatarBust-FAC6DDEDFF2A1E7F2437142056CC2A8F-Png/420/420/AvatarBust/Png/noFilter'),
  ('1147887910411059261',2,'Hitlander','Mohamed','Alemania','Hombre','29/07/1961','19/02/2026',109,'ElGiANLUCAPro2323','https://tr.rbxcdn.com/30DAY-AvatarBust-4D5A2216E721A68C63D49E09FE057F5B-Png/420/420/AvatarBust/Png/noFilter'),
  ('1148800892406091818',1,'Martin','Garces','Argentina','Hombre','27/11/2001','19/02/2026',112,'Feli160113','https://tr.rbxcdn.com/30DAY-AvatarBust-E433D2CC72EA248D9B695E960B68D653-Png/420/420/AvatarBust/Png/noFilter'),
  ('1076327183108296734',2,'Ismael , Mario','Zambada','Mexico','Hombre','01/01/2001','20/02/2026',120,'Thekingoflegend81','https://tr.rbxcdn.com/30DAY-AvatarBust-5357A8E24171D4B4F263E9E4C04DE3D9-Png/420/420/AvatarBust/Png/noFilter');
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
