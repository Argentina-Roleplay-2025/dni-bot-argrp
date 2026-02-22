// ═══════════════════════════════════════════════════════════════════════════
// generateDni.ts — ACTUALIZADO con fuentes via nixpacks.toml
// ═══════════════════════════════════════════════════════════════════════════
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

const TEMPLATE_PATH = path.join(process.cwd(), "assets", "dni_template.png");
const FONT_PATH = path.join(process.cwd(), "assets", "font.ttf");

// ── Posiciones exactas del template ──────────────────────────────────────────
const POS = {
  foto:             { x: 25,  y: 93,  w: 220, h: 230 },
  apellido:         { x: 280, y: 150 },
  nombre:           { x: 280, y: 215 },
  nacionalidad:     { x: 565, y: 181 },
  sexo:             { x: 280, y: 273 },
  fecha_nacimiento: { x: 280, y: 345 },
  fecha_emision:    { x: 565, y: 283 },
  documento:        { x: 119, y: 405 },
};

/**
 * Descarga el avatar de Roblox desde su URL y lo retorna como imagen canvas.
 * Elimina el fondo blanco/gris claro típico de Roblox.
 */
async function fetchAndProcessAvatar(avatarUrl: string) {
  try {
    const res  = await fetch(avatarUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const buf  = Buffer.from(await res.arrayBuffer());
    const img  = await loadImage(buf);

    const tmp  = createCanvas(img.width, img.height);
    const ctx  = tmp.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, tmp.width, tmp.height);
    const data      = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 220 && g > 220 && b > 220) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    return tmp;
  } catch (e) {
    console.error("Error al cargar avatar:", e);
    return null;
  }
}

/**
 * Genera la imagen del DNI y retorna un Buffer PNG.
 */
export async function generateDniImage(
  apellido:     string,
  nombre:       string,
  nacionalidad: string,
  sexo:         string,
  fechaNac:     string,
  fechaEmision: string,
  documento:    number,
  avatarUrl:    string,
): Promise<Buffer> {

  // Descargar fuente si no existe
  if (!fs.existsSync(FONT_PATH)) {
    console.log("Descargando fuente...");
    const res = await fetch("https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf");
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(FONT_PATH, buf);
    console.log("Fuente descargada correctamente.");
  }
  GlobalFonts.registerFromPath(FONT_PATH, "DNIFont");

  // Cargar template
  const template = await loadImage(TEMPLATE_PATH);
  const canvas   = createCanvas(template.width, template.height);
  const ctx      = canvas.getContext("2d");

  // Dibujar template base
  ctx.drawImage(template, 0, 0);

  // Pegar avatar si hay URL
  if (avatarUrl) {
    const avatar = await fetchAndProcessAvatar(avatarUrl);
    if (avatar) {
      const { x, y, w, h } = POS.foto;
      const MARGIN = 5;
      const scale  = Math.min((w - MARGIN * 2) / avatar.width, (h - MARGIN * 2) / avatar.height);
      const nw     = Math.floor(avatar.width  * scale);
      const nh     = Math.floor(avatar.height * scale);
      const ox     = x + Math.floor((w - nw) / 2);
      const oy     = y + Math.floor((h - nh) / 2);
      ctx.drawImage(avatar, ox, oy, nw, nh);
    }
  }

  // Configurar fuente y color de texto
  ctx.fillStyle = "#000000";

  // Textos normales (24px bold)
  ctx.font = "bold 24px DNIFont, Arial, sans-serif";
  ctx.fillText(apellido,     POS.apellido.x,         POS.apellido.y);
  ctx.fillText(nombre,       POS.nombre.x,           POS.nombre.y);
  ctx.fillText(nacionalidad, POS.nacionalidad.x,      POS.nacionalidad.y);
  ctx.fillText(sexo,         POS.sexo.x,             POS.sexo.y);
  ctx.fillText(fechaNac,     POS.fecha_nacimiento.x,  POS.fecha_nacimiento.y);
  ctx.fillText(fechaEmision, POS.fecha_emision.x,     POS.fecha_emision.y);

  // Documento (28px bold)
  ctx.font = "bold 28px DNIFont, Arial, sans-serif";
  ctx.fillText(String(documento), POS.documento.x, POS.documento.y);

  return canvas.toBuffer("image/png");
}
