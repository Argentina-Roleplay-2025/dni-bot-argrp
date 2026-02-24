// ═══════════════════════════════════════════════════════════════════════════
// index.ts — Bot DNI Argentina Roleplay — Standalone para Railway
// ═══════════════════════════════════════════════════════════════════════════
import http from "http";
import {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, ActivityType, PermissionFlagsBits, ModalBuilder,
  TextInputBuilder, TextInputStyle, ActionRowBuilder, AttachmentBuilder,
  ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} from "discord.js";

import * as db      from "./database";
import { generateDniImage }    from "./generateDni";
import { getRobloxData, searchRobloxUsers } from "./roblox";

// ── Keep-alive HTTP para Railway / UptimeRobot ────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "3000");
http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("DNI Bot activo ✅");
}).listen(PORT, () => console.log(`[Keep-Alive] Puerto ${PORT} activo`));

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDocumento(num: number): string {
  return num < 1000 ? String(num).padStart(3, "0") : String(num);
}

// ── Constantes de canales ─────────────────────────────────────────────────────
const GUILD_ID          = process.env.GUILD_ID          ?? "1349870169056350270";
const CANAL_CREAR_DNI   = process.env.CANAL_CREAR_DNI   ?? "1472380283348062341";
const CANAL_VER_DNI     = process.env.CANAL_VER_DNI     ?? "1349870171564539968";
const CANAL_COMPROBAR   = process.env.CANAL_COMPROBAR   ?? "1472380033086652509";
const CANAL_LOGS_DNI    = process.env.CANAL_LOGS_DNI    ?? "1472380236246159601";

// ── Constantes de roles ───────────────────────────────────────────────────────
const ROL_MODERADOR = process.env.ROL_MODERADOR ?? "1349870169756930109";
const ROL_TERCER_PJ = process.env.ROL_TERCER_PJ ?? "1349870169111003338";

// ── Map de sesiones pendientes ────────────────────────────────────────────────
const pendingDnis = new Map<string, { numeroPj: number; robloxName: string; avatarUrl: string }>();

// ── Slash commands ────────────────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("crear-dni")
    .setDescription("Crea tu Documento Nacional de Identidad.")
    .addIntegerOption((o) =>
      o.setName("numero_pj").setDescription("Slot de personaje (1 o 2).").setRequired(true)
        .addChoices({ name: "Personaje 1", value: 1 }, { name: "Personaje 2", value: 2 }),
    )
    .addStringOption((o) =>
      o.setName("usuario_roblox").setDescription("Tu usuario de Roblox.").setRequired(true).setAutocomplete(true),
    ),

  new SlashCommandBuilder()
    .setName("crear-3pj")
    .setDescription("Crea el DNI de tu 3er personaje. (Solo usuarios con acceso especial)")
    .addStringOption((o) =>
      o.setName("usuario_roblox").setDescription("Tu usuario de Roblox.").setRequired(true).setAutocomplete(true),
    ),

  new SlashCommandBuilder()
    .setName("ver-dni")
    .setDescription("Visualiza tu Documento Nacional de Identidad.")
    .addIntegerOption((o) =>
      o.setName("personaje").setDescription("Qué personaje querés ver.").setRequired(true)
        .addChoices(
          { name: "Personaje 1", value: 1 },
          { name: "Personaje 2", value: 2 },
          { name: "Personaje 3", value: 3 },
        ),
    ),

  new SlashCommandBuilder()
    .setName("comprobar-dni")
    .setDescription("Comprueba el DNI de cualquier usuario.")
    .addIntegerOption((o) =>
      o.setName("personaje").setDescription("Qué personaje querés ver.").setRequired(true)
        .addChoices(
          { name: "Personaje 1", value: 1 },
          { name: "Personaje 2", value: 2 },
          { name: "Personaje 3", value: 3 },
        ),
    )
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuario del que querés ver el DNI.").setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("eliminar-pj")
    .setDescription("Elimina el personaje de un usuario. (Solo administradores)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuario al que se le eliminará el personaje.").setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName("numero_pj").setDescription("Número de personaje a eliminar.").setRequired(true)
        .addChoices(
          { name: "Personaje 1", value: 1 },
          { name: "Personaje 2", value: 2 },
          { name: "Personaje 3", value: 3 },
        ),
    )
    .addStringOption((o) =>
      o.setName("motivo").setDescription("Motivo de la eliminación.").setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("todos-los-dni")
    .setDescription("Ve y gestioná todos los DNIs registrados. (Solo moderadores)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("ayuda-dni")
    .setDescription("Muestra todos los comandos del bot de DNI."),
];

// ── Cliente Discord ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN no está configurado en las variables de entorno.");
  process.exit(1);
}

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅ Bot conectado como ${client.user?.tag}`);

  const statuses = [
    { name: "/ayuda-dni",  type: ActivityType.Playing  },
  ];
  let si = 0;
  const tick = () => {
    const s = statuses[si++ % statuses.length];
    client.user?.setPresence({ activities: [{ name: s.name, type: s.type }], status: "online" });
  };
  tick();
  setInterval(tick, 15_000);

  try {
    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!);
    await rest.put(Routes.applicationCommands(client.user!.id), { body: commands });
    console.log("✅ Slash commands registrados.");
  } catch (e) {
    console.error("Error registrando comandos:", e);
  }
});

// ── Interactions ──────────────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {

  // ── Autocomplete ────────────────────────────────────────────────────────
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "usuario_roblox") { await interaction.respond([]); return; }
    const query = focused.value?.trim() ?? "";
    if (query.length < 2) { await interaction.respond([]); return; }
    try {
      const results = await searchRobloxUsers(query);
      await interaction.respond(results.slice(0, 10).map((u) => ({ name: `${u.name} (${u.id})`, value: u.name })));
    } catch { await interaction.respond([]); }
    return;
  }

  // ── Modal Submit ─────────────────────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith("dni_modal_")) {
    await interaction.deferReply({ ephemeral: true });
    const numeroPj = parseInt(interaction.customId.split("_")[2]);
    const pending  = pendingDnis.get(interaction.user.id);
    if (!pending) return interaction.editReply({ content: "<a:Reprobado:1399874121055076372> | La sesión expiró. Volvé a ejecutar el comando." });
    pendingDnis.delete(interaction.user.id);

    const apellido     = interaction.fields.getTextInputValue("apellido").trim();
    const nombre       = interaction.fields.getTextInputValue("nombre").trim();
    const nacionalidad = interaction.fields.getTextInputValue("nacionalidad").trim();
    const sexoRaw      = interaction.fields.getTextInputValue("sexo").trim().toLowerCase();
    const fechaNac     = interaction.fields.getTextInputValue("fecha_nacimiento").trim();
    const sexo         = sexoRaw === "hombre" ? "Hombre" : sexoRaw === "mujer" ? "Mujer" : null;

    if (!sexo) return interaction.editReply({ content: "<:adv:1468761911821602947> | El campo **Sexo** debe ser `Hombre` o `Mujer`." });
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaNac)) return interaction.editReply({ content: "<:adv:1468761911821602947> | La **Fecha de Nacimiento** debe tener el formato `DD/MM/AAAA`." });

    const fechaEmision = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

    try {
      const documento = db.getNextDocumento();
      db.createDni({
        discordUserId: interaction.user.id, numeroPj, nombre, apellido, nacionalidad,
        sexo, fechaNacimiento: fechaNac, fechaEmision, documento,
        robloxUsername: pending.robloxName, avatarUrl: pending.avatarUrl,
      });

      const imgBuffer  = await generateDniImage(apellido, nombre, nacionalidad, sexo, fechaNac, fechaEmision, documento, pending.avatarUrl);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "dni.png" });

      const logsChannel = await client.channels.fetch(CANAL_LOGS_DNI).catch(() => null);
      if (logsChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder().setColor(0x00c851)
          .setTitle("<a:Aprobado:1399874076402778122> | DNI Creado")
          .addFields(
            { name: "<:Miembro:1473969750139994112> | Usuario",     value: `${interaction.user} (${interaction.user.tag})`, inline: false },
            { name: "<:chik:1473970031489454100> | Personaje",      value: `Personaje ${numeroPj}`,                         inline: true  },
            { name: "<a:check1:1468762093741412553> | Nombre",      value: `${nombre} ${apellido}`,                         inline: true  },
            { name: "<a:cargando:1456888296381874207> | Documento", value: `N° ${formatDocumento(documento)}`,              inline: true  },
          ).setImage("attachment://dni.png").setTimestamp()
          .setFooter({ text: "Argentina Roleplay — Sistema de DNI" });
        await logsChannel.send({ embeds: [logEmbed], files: [new AttachmentBuilder(imgBuffer, { name: "dni.png" })] });
      }

      return interaction.editReply({ content: `<a:Aprobado:1399874076402778122> | Tu DNI ha sido registrado exitosamente. Podés visualizarlo en https://discord.com/channels/${GUILD_ID}/${CANAL_VER_DNI}.` });
    } catch (error: any) {
      console.error("Error creando DNI:", error);
      return interaction.editReply({ content: `<a:Reprobado:1399874121055076372> | Error al crear el DNI: \`${error?.message ?? String(error)}\`` });
    }
  }

  // ── Select Menus ─────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === "seleccionar_dni_eliminar") {
    await interaction.deferUpdate();
    try {
      const [discordUserId, numeroPjStr] = interaction.values[0].split("_");
      const numeroPj = parseInt(numeroPjStr);
      const dni      = db.getDniByDiscordIdAndSlot(discordUserId, numeroPj);
      if (!dni) return interaction.editReply({ content: "DNI no encontrado.", components: [] });
      db.deleteDniByDiscordIdAndSlot(discordUserId, numeroPj);
      return interaction.editReply({ content: `<a:Aprobado:1399874076402778122> | El DNI N° ${formatDocumento(dni.documento)} de <@${discordUserId}> ha sido eliminado.`, components: [] });
    } catch (error: any) {
      return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\``, components: [] });
    }
  }

  // ── Buttons ──────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (interaction.customId === "eliminar_todos_dnis") {
      await interaction.deferUpdate();
      try {
        const allDnis = db.getAllDnis();
        if (allDnis.length === 0) return interaction.editReply({ content: "No hay DNIs para eliminar.", components: [] });
        // No eliminamos directamente, pedimos confirmación
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("confirmar_eliminar_todos").setLabel("⚠️ Confirmar eliminación").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("cancelar_eliminar_todos").setLabel("↩️ Cancelar").setStyle(ButtonStyle.Success),
        );
        return interaction.editReply({ content: `⚠️ | ¿Estás seguro que querés eliminar **${allDnis.length} DNIs**? Esta acción no se puede deshacer.`, components: [row] });
      } catch (error: any) {
        return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\``, components: [] });
      }
    }

    if (interaction.customId === "confirmar_eliminar_todos") {
      await interaction.deferUpdate();
      const allDnis = db.getAllDnis();
      for (const dni of allDnis) db.deleteDniByDiscordIdAndSlot(dni.discordUserId, dni.numeroPj);
      return interaction.editReply({ content: `<a:Aprobado:1399874076402778122> | Se eliminaron **${allDnis.length} DNIs** exitosamente.`, components: [] });
    }

    if (interaction.customId === "cancelar_eliminar_todos") {
      return interaction.update({ content: "Operación cancelada.", components: [] });
    }

    if (interaction.customId === "eliminar_un_dni") {
      await interaction.deferUpdate();
      try {
        const allDnis = db.getAllDnis();
        if (allDnis.length === 0) return interaction.editReply({ content: "No hay DNIs para eliminar.", components: [] });
        const options = allDnis.slice(0, 25).map((dni) => ({
          label:       `DNI ${formatDocumento(dni.documento)} — ${dni.nombre} ${dni.apellido}`,
          description: `PJ ${dni.numeroPj} | ID: ${dni.discordUserId}`,
          value:       `${dni.discordUserId}_${dni.numeroPj}`,
        }));
        const selectMenu = new StringSelectMenuBuilder().setCustomId("seleccionar_dni_eliminar").setPlaceholder("Seleccioná un DNI").addOptions(options);
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        return interaction.editReply({ content: "Seleccioná el DNI a eliminar:", components: [row] });
      } catch (error: any) {
        return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\``, components: [] });
      }
    }

    return;
  }

  // ── Slash Commands ────────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  // /ayuda-dni
  if (interaction.commandName === "ayuda-dni") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("<:config:1473970137089445909> | Comandos — Bot DNI Argentina RP")
      .addFields(
        {
          name: "📄 Sistema de DNI",
          value: [
            `\`/crear-dni\` — Crea tu DNI en https://discord.com/channels/${GUILD_ID}/${CANAL_CREAR_DNI}`,
            `\`/crear-3pj\` — Crea el DNI de tu 3er personaje *(requiere acceso especial)*`,
            `\`/ver-dni\` — Visualizá tu DNI en https://discord.com/channels/${GUILD_ID}/${CANAL_VER_DNI}`,
            `\`/comprobar-dni\` — Comprobá el DNI de otro usuario en https://discord.com/channels/${GUILD_ID}/${CANAL_COMPROBAR}`,
            `\`/eliminar-pj\` — Elimina el personaje de un usuario *(Solo Administradores)*`,
            `\`/todos-los-dni\` — Gestioná todos los DNIs registrados *(Solo Moderadores)*`,
          ].join("\n"),
          inline: false,
        },
      )
      .setFooter({ text: "© 2026 Argentina RP┊ER:LC | Dev: @vladimirfernan.", iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // /crear-dni
  if (interaction.commandName === "crear-dni") {
    if (interaction.channelId !== CANAL_CREAR_DNI) return interaction.reply({ content: `<:adv:1468761911821602947> | Este comando se usa en <#${CANAL_CREAR_DNI}>`, ephemeral: true });
    const numeroPj       = interaction.options.getInteger("numero_pj", true);
    const robloxUsername = interaction.options.getString("usuario_roblox", true);
    const totalSlots     = db.countDnisByDiscordId(interaction.user.id);
    if (totalSlots >= 2) return interaction.reply({ content: "<a:Reprobado:1399874121055076372> | Ya tenés 2 DNIs registrados. Contactá a un administrador si necesitás eliminar uno.", ephemeral: true });
    const slotExistente = db.getDniByDiscordIdAndSlot(interaction.user.id, numeroPj);
    if (slotExistente) return interaction.reply({ content: `<a:cargando:1456888296381874207> | Tu **Personaje ${numeroPj}** ya tiene un DNI. Usá \`/ver-dni\` para verlo.`, ephemeral: true });
    const roblox = await getRobloxData(robloxUsername);
    if (!roblox) return interaction.reply({ content: `<:equiz:1468761969518706708> | No se encontró el usuario de Roblox: **${robloxUsername}**.`, ephemeral: true });
    pendingDnis.set(interaction.user.id, { numeroPj, robloxName: roblox.name, avatarUrl: roblox.avatarUrl });
    setTimeout(() => pendingDnis.delete(interaction.user.id), 10 * 60 * 1000);
    const modal = new ModalBuilder().setCustomId(`dni_modal_${numeroPj}`).setTitle(`DNI — Personaje ${numeroPj}`);
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("apellido").setLabel("Apellido").setStyle(TextInputStyle.Short).setPlaceholder("Ej: García").setRequired(true).setMaxLength(40)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("nombre").setLabel("Nombre").setStyle(TextInputStyle.Short).setPlaceholder("Ej: Juan Carlos").setRequired(true).setMaxLength(60)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("nacionalidad").setLabel("Nacionalidad").setStyle(TextInputStyle.Short).setPlaceholder("Ej: Argentina").setRequired(true).setMaxLength(40)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("sexo").setLabel("Sexo (Hombre / Mujer)").setStyle(TextInputStyle.Short).setPlaceholder("Hombre o Mujer").setRequired(true).setMaxLength(6)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("fecha_nacimiento").setLabel("Fecha de Nacimiento (DD/MM/AAAA)").setStyle(TextInputStyle.Short).setPlaceholder("Ej: 15/03/1995").setRequired(true).setMaxLength(10)),
    );
    return interaction.showModal(modal);
  }

  // /crear-3pj
  if (interaction.commandName === "crear-3pj") {
    const member = interaction.member;
    if (!member || !("roles" in member) || !(member.roles as any).cache.has(ROL_TERCER_PJ)) {
      return interaction.reply({ content: "<:equiz:1468761969518706708> | No tenés acceso a crear un 3er personaje.", ephemeral: true });
    }
    const robloxUsername = interaction.options.getString("usuario_roblox", true);
    const numeroPj       = 3;
    const slotExistente  = db.getDniByDiscordIdAndSlot(interaction.user.id, numeroPj);
    if (slotExistente) return interaction.reply({ content: "<a:fijado:1468193352439824384> | Tu **Personaje 3** ya tiene un DNI. Usá `/ver-dni` para verlo.", ephemeral: true });
    const roblox = await getRobloxData(robloxUsername);
    if (!roblox) return interaction.reply({ content: `<a:Nerd:1357113815623536791> | No se encontró el usuario de Roblox: **${robloxUsername}**.`, ephemeral: true });
    pendingDnis.set(interaction.user.id, { numeroPj, robloxName: roblox.name, avatarUrl: roblox.avatarUrl });
    setTimeout(() => pendingDnis.delete(interaction.user.id), 10 * 60 * 1000);
    const modal = new ModalBuilder().setCustomId(`dni_modal_3`).setTitle(`DNI — Personaje 3`);
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("apellido").setLabel("Apellido").setStyle(TextInputStyle.Short).setPlaceholder("Ej: García").setRequired(true).setMaxLength(40)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("nombre").setLabel("Nombre").setStyle(TextInputStyle.Short).setPlaceholder("Ej: Juan Carlos").setRequired(true).setMaxLength(60)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("nacionalidad").setLabel("Nacionalidad").setStyle(TextInputStyle.Short).setPlaceholder("Ej: Argentina").setRequired(true).setMaxLength(40)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("sexo").setLabel("Sexo (Hombre / Mujer)").setStyle(TextInputStyle.Short).setPlaceholder("Hombre o Mujer").setRequired(true).setMaxLength(6)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("fecha_nacimiento").setLabel("Fecha de Nacimiento (DD/MM/AAAA)").setStyle(TextInputStyle.Short).setPlaceholder("Ej: 15/03/1995").setRequired(true).setMaxLength(10)),
    );
    return interaction.showModal(modal);
  }

  // /ver-dni
  if (interaction.commandName === "ver-dni") {
    if (interaction.channelId !== CANAL_VER_DNI) return interaction.reply({ content: `<a:Nerd:1357113815623536791> | Este comando se usa en <#${CANAL_VER_DNI}>`, ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const numeroPj = interaction.options.getInteger("personaje", true);
    try {
      const dni = db.getDniByDiscordIdAndSlot(interaction.user.id, numeroPj);
      if (!dni) return interaction.editReply({ content: `<:adv:1468761911821602947> | No tenés un DNI en el **Personaje ${numeroPj}**. Usá \`/crear-dni\` para generarlo.` });
      const roblox     = await getRobloxData(dni.robloxUsername);
      const profileUrl = roblox ? `https://www.roblox.com/users/${roblox.id}/profile` : "#";
      const imgBuffer  = await generateDniImage(dni.apellido, dni.nombre, dni.nacionalidad, dni.sexo, dni.fechaNacimiento, dni.fechaEmision, dni.documento, dni.avatarUrl);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "dni.png" });
      const embed      = new EmbedBuilder().setColor(0x0099ff)
        .setTitle("<a:check1:1468762093741412553> | Documento Nacional de Identidad")
        .setDescription(`<:chik:1473970031489454100> | **Documento N° ${formatDocumento(dni.documento)}**\n<:roblox:1468196317514956905> | Roblox: [${dni.robloxUsername}](${profileUrl})`)
        .setImage("attachment://dni.png")
        .setFooter({ text: "© 2026 Argentina RP┊ER:LC", iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error: any) {
      return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\`` });
    }
  }

  // /comprobar-dni
  if (interaction.commandName === "comprobar-dni") {
    if (interaction.channelId !== CANAL_COMPROBAR) return interaction.reply({ content: `<a:Nerd:1357113815623536791> | Este comando se usa en <#${CANAL_COMPROBAR}>`, ephemeral: true });
    await interaction.deferReply();
    const numeroPj   = interaction.options.getInteger("personaje", true);
    const targetUser = interaction.options.getUser("usuario", true);
    try {
      const dni = db.getDniByDiscordIdAndSlot(targetUser.id, numeroPj);
      if (!dni) return interaction.editReply({ content: `<:equiz:1468761969518706708> | **${targetUser.username}** no tiene DNI en el **Personaje ${numeroPj}**.` });
      const roblox     = await getRobloxData(dni.robloxUsername);
      const profileUrl = roblox ? `https://www.roblox.com/users/${roblox.id}/profile` : "#";
      const imgBuffer  = await generateDniImage(dni.apellido, dni.nombre, dni.nacionalidad, dni.sexo, dni.fechaNacimiento, dni.fechaEmision, dni.documento, dni.avatarUrl);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "dni.png" });
      const embed      = new EmbedBuilder().setColor(0x0099ff)
        .setTitle("<a:check1:1468762093741412553> | Documento Nacional de Identidad")
        .setDescription(`<:Miembro:1473969750139994112> | **Usuario:** ${targetUser}\n<:chik:1473970031489454100> | **Documento N° ${formatDocumento(dni.documento)}**\n<:roblox:1468196317514956905> | Roblox: [${dni.robloxUsername}](${profileUrl})`)
        .setImage("attachment://dni.png")
        .setFooter({ text: "© 2026 Argentina RP┊ER:LC", iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error: any) {
      return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\`` });
    }
  }

  // /eliminar-pj
  if (interaction.commandName === "eliminar-pj") {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.member;
    if (!member || !("permissions" in member) || !(member.permissions as any).has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({ content: "<a:Nerd:1357113815623536791> | No tenés permisos de Administrador." });
    }
    const targetUser = interaction.options.getUser("usuario", true);
    const numeroPj   = interaction.options.getInteger("numero_pj", true);
    const motivo     = interaction.options.getString("motivo", true);
    try {
      const dni = db.getDniByDiscordIdAndSlot(targetUser.id, numeroPj);
      if (!dni) return interaction.editReply({ content: `**${targetUser.username}** no tiene DNI en el **Personaje ${numeroPj}**.` });
      const imgBuffer = await generateDniImage(dni.apellido, dni.nombre, dni.nacionalidad, dni.sexo, dni.fechaNacimiento, dni.fechaEmision, dni.documento, dni.avatarUrl);
      db.deleteDniByDiscordIdAndSlot(targetUser.id, numeroPj);
      const logsChannel = await client.channels.fetch(CANAL_LOGS_DNI).catch(() => null);
      if (logsChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder().setColor(0xff6600)
          .setTitle("<a:fijado:1468193352439824384> | DNI Eliminado")
          .addFields(
            { name: "<:Miembro:1473969750139994112> | Usuario",         value: `${targetUser} (${targetUser.tag})`,             inline: false },
            { name: "<a:Nerd:1357113815623536791> | Personaje",         value: `Personaje ${numeroPj}`,                         inline: true  },
            { name: "<a:check1:1468762093741412553> | Nombre",          value: `${dni.nombre} ${dni.apellido}`,                 inline: true  },
            { name: "<:chik:1473970031489454100> | Documento",          value: `N° ${formatDocumento(dni.documento)}`,          inline: true  },
            { name: "<:Ehh:1457908929504870475> | Motivo",              value: motivo,                                          inline: false },
            { name: "<a:Aprobado:1399874076402778122> | Eliminado por", value: `${interaction.user} (${interaction.user.tag})`, inline: false },
          ).setImage("attachment://dni_eliminado.png").setTimestamp()
          .setFooter({ text: "Argentina Roleplay — Sistema de DNI" });
        await logsChannel.send({ embeds: [logEmbed], files: [new AttachmentBuilder(imgBuffer, { name: "dni_eliminado.png" })] });
      }
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00c851)
        .setTitle("<a:Aprobado:1399874076402778122> | Personaje eliminado con éxito")
        .addFields(
          { name: "<:Miembro:1473969750139994112> | Usuario",           value: `${targetUser} (${targetUser.username})`, inline: false },
          { name: "<a:Nerd:1357113815623536791> | Personaje",           value: `Personaje ${numeroPj}`,                  inline: true  },
          { name: "<a:check1:1468762093741412553> | Nombre del PJ",     value: `${dni.nombre} ${dni.apellido}`,          inline: true  },
          { name: "<:chik:1473970031489454100> | Documento",            value: `N° ${formatDocumento(dni.documento)}`,   inline: true  },
          { name: "<:Ehh:1457908929504870475> | Motivo",                value: motivo,                                   inline: false },
          { name: "<:Moderadores:1473981745689923728> | Ejecutado por", value: `${interaction.user}`,                    inline: true  },
        ).setFooter({ text: "Argentina Roleplay — Sistema de DNI", iconURL: interaction.user.displayAvatarURL() }).setTimestamp()] });
      try { await targetUser.send({ embeds: [new EmbedBuilder().setColor(0xff6600).setTitle("Tu personaje fue eliminado").setDescription(`Un administrador eliminó tu **Personaje ${numeroPj}** en **Argentina Roleplay**.`).addFields({ name: "Personaje", value: `${dni.nombre} ${dni.apellido}`, inline: true }, { name: "Motivo", value: motivo, inline: false }).setFooter({ text: "Si creés que es un error, contactá al staff." }).setTimestamp()] }); }
      catch { console.log(`No se pudo enviar DM a ${targetUser.username}.`); }
    } catch (error: any) {
      return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\`` });
    }
  }

  // /todos-los-dni
  if (interaction.commandName === "todos-los-dni") {
    const member = interaction.member;
    if (!member || !("roles" in member) || !(member.roles as any).cache.has(ROL_MODERADOR)) {
      return interaction.reply({ content: "<a:Nerd:1357113815623536791> | No tenés los permisos necesarios.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const allDnis = db.getAllDnis();
      if (allDnis.length === 0) return interaction.editReply({ content: "No hay DNIs registrados en el sistema." });
      const dniList = allDnis.map((d, i) => `**${i + 1}.** DNI N° ${formatDocumento(d.documento)} | ${d.nombre} ${d.apellido} | <@${d.discordUserId}> (PJ ${d.numeroPj})`).join("\n");
      const embed   = new EmbedBuilder().setColor(0x0099ff)
        .setTitle("<a:Aprobado:1399874076402778122> | Todos los DNIs Registrados")
        .setDescription(dniList.length > 4000 ? dniList.substring(0, 3990) + "\n..." : dniList)
        .setFooter({ text: `Total: ${allDnis.length} DNIs` }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("eliminar_todos_dnis").setLabel("Eliminar todos").setStyle(ButtonStyle.Danger).setEmoji("🗑️"),
        new ButtonBuilder().setCustomId("eliminar_un_dni").setLabel("Eliminar uno").setStyle(ButtonStyle.Secondary).setEmoji("❌"),
      );
      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      return interaction.editReply({ content: `Error: \`${error?.message ?? String(error)}\`` });
    }
  }

});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN).catch((e) => {
  console.error("❌ Error al conectar el bot:", e);
  process.exit(1);
});
