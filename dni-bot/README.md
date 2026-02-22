# Bot DNI — Argentina Roleplay ER:LC

Bot especializado en el sistema de DNI, completamente independiente y listo para Railway.

## ✅ Diferencias clave vs Replit
- **Sin Python** — La imagen del DNI se genera con Node.js puro (@napi-rs/canvas)
- **Sin dependencias externas** — Base de datos SQLite incluida
- **Railway-ready** — railway.toml ya configurado

---

## 📁 Estructura de archivos

```
dni-bot/
├── src/
│   ├── index.ts          ← Bot principal (comandos, interacciones)
│   ├── database.ts       ← Base de datos SQLite
│   ├── generateDni.ts    ← Generador de imagen DNI (reemplaza Python)
│   └── roblox.ts         ← APIs de Roblox
├── assets/
│   └── dni_template.png  ← ⚠️ COPIÁ TU PLANTILLA AQUÍ
├── package.json
├── tsconfig.json
├── railway.toml
└── .gitignore
```

---

## 🚀 Pasos para subir a Railway

### Paso 1 — Copiar la plantilla del DNI
Copiá tu archivo `dni_template.png` a la carpeta `assets/` del proyecto.
Esta carpeta SÍ se sube a GitHub (no está en .gitignore).

### Paso 2 — Subir a GitHub
```bash
git init
git add .
git commit -m "Bot DNI inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/dni-bot-argrp.git
git push -u origin main
```

### Paso 3 — Crear proyecto en Railway
1. railway.app → New Project → Deploy from GitHub repo
2. Seleccioná el repositorio
3. Railway detecta automáticamente Node.js

### Paso 4 — Variables de entorno en Railway
En Railway → pestaña **Variables**, agregá:

| Variable | Valor |
|---|---|
| `DISCORD_TOKEN` | Token de tu bot de Discord |
| `GUILD_ID` | `1349870169056350270` |
| `CANAL_CREAR_DNI` | `1472380283348062341` |
| `CANAL_VER_DNI` | `1349870171564539968` |
| `CANAL_COMPROBAR` | `1472380033086652509` |
| `CANAL_LOGS_DNI` | `1472380236246159601` |
| `ROL_MODERADOR` | `1349870169756930109` |
| `ROL_TERCER_PJ` | `1349870169111003338` |

### Paso 5 — Deploy
Railway hace el build automáticamente. En los logs vas a ver:
```
✅ Bot conectado como NombreBot#0000
✅ Slash commands registrados.
[Keep-Alive] Puerto 3000 activo
```

---

## ✏️ Cómo editar el código después

1. Editá los archivos en tu computadora o en GitHub directamente
2. Hacé `git add . && git commit -m "cambio" && git push`
3. Railway redeploya automáticamente en segundos

---

## ⚠️ Importante sobre la base de datos

Railway por defecto **no persiste datos entre deploys** a menos que configures un volumen.

Para persistir los DNIs:
1. En Railway → tu proyecto → **Add Volume**
2. Mount path: `/app/data`
3. Eso es todo, los DNIs se guardan ahí permanentemente

Sin volumen, los DNIs se pierden cada vez que Railway redeploya.

---

## 🛠️ Comandos disponibles

| Comando | Descripción |
|---|---|
| `/crear-dni` | Crea DNI (PJ1 o PJ2) |
| `/crear-3pj` | Crea DNI del 3er personaje |
| `/ver-dni` | Ve tu DNI |
| `/comprobar-dni` | Ve el DNI de otro usuario |
| `/eliminar-pj` | Elimina un personaje (Admin) |
| `/todos-los-dni` | Gestiona todos los DNIs (Mod) |
| `/ayuda-dni` | Lista de comandos |
