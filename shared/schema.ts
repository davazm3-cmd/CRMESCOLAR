import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuarios del sistema (Directores, Gerentes, Asesores)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  rol: text("rol").notNull(), // 'director', 'gerente', 'asesor'
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Prospectos/Candidatos
export const prospectos = pgTable("prospectos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  telefono: text("telefono").notNull(),
  email: text("email").notNull(),
  nivelEducativo: text("nivel_educativo").notNull(), // 'primaria', 'secundaria', 'preparatoria', 'universidad'
  origen: text("origen").notNull(), // 'facebook', 'google', 'referencias', 'eventos', etc.
  estatus: text("estatus").notNull().default('nuevo'), // 'nuevo', 'primer_contacto', 'cita_agendada', 'documentos', 'admitido', 'matriculado', 'no_interesado'
  asesorId: varchar("asesor_id").references(() => users.id),
  prioridad: text("prioridad").notNull().default('media'), // 'alta', 'media', 'baja'
  valorInscripcion: decimal("valor_inscripcion", { precision: 10, scale: 2 }), // Valor económico cuando se inscribe
  notas: text("notas"),
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
  ultimaInteraccion: timestamp("ultima_interaccion").defaultNow(),
  fechaCita: timestamp("fecha_cita"),
  datosAdicionales: jsonb("datos_adicionales"), // Información extra personalizable
});

// Comunicaciones (llamadas, emails, WhatsApp, etc.)
export const comunicaciones = pgTable("comunicaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull(),
  usuarioId: varchar("usuario_id").references(() => users.id).notNull(),
  tipo: text("tipo").notNull(), // 'llamada', 'email', 'whatsapp', 'presencial'
  direccion: text("direccion").notNull(), // 'enviado', 'recibido'
  contenido: text("contenido").notNull(),
  resultado: text("resultado"), // Resultado de la comunicación
  duracion: integer("duracion"), // En minutos para llamadas
  fechaHora: timestamp("fecha_hora").defaultNow(),
  estado: text("estado").default('completado'), // 'completado', 'pendiente', 'fallido'
});

// Campañas de marketing
export const campanas = pgTable("campanas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  canal: text("canal").notNull(), // 'facebook', 'google', 'redes_sociales', 'eventos'
  presupuesto: decimal("presupuesto", { precision: 10, scale: 2 }).notNull(),
  gastado: decimal("gastado", { precision: 10, scale: 2 }).default('0'),
  estado: text("estado").notNull().default('activa'), // 'activa', 'pausada', 'finalizada'
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin").notNull(),
  metaProspectos: integer("meta_prospectos"),
  metaInscritos: integer("meta_inscritos"),
  configuracion: jsonb("configuracion"), // Configuración específica del canal
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Relación entre prospectos y campañas (un prospecto puede venir de múltiples campañas)
export const prospectosCampanas = pgTable("prospectos_campanas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull(),
  campanaId: varchar("campana_id").references(() => campanas.id).notNull(),
  fechaAsociacion: timestamp("fecha_asociacion").defaultNow(),
});

// Reportes programados
export const reportes = pgTable("reportes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull(), // 'ejecutivo', 'asesores', 'campanas', 'conversiones'
  frecuencia: text("frecuencia").notNull(), // 'diario', 'semanal', 'mensual'
  destinatarios: jsonb("destinatarios").notNull(), // Array de emails
  configuracion: jsonb("configuracion"), // Filtros y parámetros específicos
  activo: boolean("activo").default(true),
  ultimaEjecucion: timestamp("ultima_ejecucion"),
  proximaEjecucion: timestamp("proxima_ejecucion"),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Definir relaciones
export const usersRelations = relations(users, ({ many }) => ({
  prospectos: many(prospectos),
  comunicaciones: many(comunicaciones),
}));

export const prospectosRelations = relations(prospectos, ({ one, many }) => ({
  asesor: one(users, {
    fields: [prospectos.asesorId],
    references: [users.id],
  }),
  comunicaciones: many(comunicaciones),
  campanas: many(prospectosCampanas),
}));

export const comunicacionesRelations = relations(comunicaciones, ({ one }) => ({
  prospecto: one(prospectos, {
    fields: [comunicaciones.prospectoId],
    references: [prospectos.id],
  }),
  usuario: one(users, {
    fields: [comunicaciones.usuarioId],
    references: [users.id],
  }),
}));

export const campanasRelations = relations(campanas, ({ many }) => ({
  prospectos: many(prospectosCampanas),
}));

export const prospectosCampanasRelations = relations(prospectosCampanas, ({ one }) => ({
  prospecto: one(prospectos, {
    fields: [prospectosCampanas.prospectoId],
    references: [prospectos.id],
  }),
  campana: one(campanas, {
    fields: [prospectosCampanas.campanaId],
    references: [campanas.id],
  }),
}));

// Esquemas de inserción y tipos
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  fechaCreacion: true,
});

export const insertProspectoSchema = createInsertSchema(prospectos).omit({
  id: true,
  fechaRegistro: true,
  ultimaInteraccion: true,
});

export const insertComunicacionSchema = createInsertSchema(comunicaciones).omit({
  id: true,
  fechaHora: true,
}).extend({
  tipo: z.enum(["llamada", "email", "whatsapp", "presencial"]),
  direccion: z.enum(["enviado", "recibido"]),
  estado: z.enum(["completado", "pendiente", "fallido"]).optional(),
  resultado: z.string().optional().nullable(),
  duracion: z.number().int().positive().optional().nullable(),
}).refine((data) => {
  // Si es una llamada, la duración debe ser un número positivo cuando se proporcione
  if (data.tipo === "llamada" && data.duracion !== null && data.duracion !== undefined) {
    return data.duracion > 0;
  }
  return true;
}, {
  message: "La duración de las llamadas debe ser mayor que 0",
  path: ["duracion"]
});

// Schema específico para actualizar comunicaciones
export const updateComunicacionSchema = z.object({
  contenido: z.string().min(1).optional(),
  resultado: z.string().optional().nullable(),
  duracion: z.number().int().positive().optional().nullable(),
  estado: z.enum(["completado", "pendiente", "fallido"]).optional(),
}).refine((data) => {
  // Si se proporciona duración, debe ser positiva
  if (data.duracion !== null && data.duracion !== undefined) {
    return data.duracion > 0;
  }
  return true;
}, {
  message: "La duración debe ser mayor que 0",
  path: ["duracion"]
});

export const insertCampanaSchema = createInsertSchema(campanas).omit({
  id: true,
  fechaCreacion: true,
}).extend({
  canal: z.enum(["facebook", "google", "redes_sociales", "eventos", "referencias", "telefono", "email"]),
  estado: z.enum(["activa", "pausada", "finalizada"]).optional(),
  presupuesto: z.string().regex(/^\d+(\.\d{1,2})?$/, "Presupuesto debe ser un número válido"),
  gastado: z.string().regex(/^\d+(\.\d{1,2})?$/, "Gastado debe ser un número válido").optional(),
  fechaInicio: z.date(),
  fechaFin: z.date(),
  metaProspectos: z.number().int().positive().optional(),
  metaInscritos: z.number().int().positive().optional(),
}).refine((data) => {
  // Fecha fin debe ser después de fecha inicio
  return data.fechaFin > data.fechaInicio;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fechaFin"]
}).refine((data) => {
  // Presupuesto debe ser mayor que gastado si se proporciona
  if (data.gastado) {
    return parseFloat(data.presupuesto) >= parseFloat(data.gastado);
  }
  return true;
}, {
  message: "El presupuesto debe ser mayor o igual al monto gastado",
  path: ["presupuesto"]
});

// Schema para actualizar campañas
export const updateCampanaSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  canal: z.enum(["facebook", "google", "redes_sociales", "eventos", "referencias", "telefono", "email"]).optional(),
  estado: z.enum(["activa", "pausada", "finalizada"]).optional(),
  presupuesto: z.string().regex(/^\d+(\.\d{1,2})?$/, "Presupuesto debe ser un número válido").optional(),
  gastado: z.string().regex(/^\d+(\.\d{1,2})?$/, "Gastado debe ser un número válido").optional(),
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
  metaProspectos: z.number().int().positive().optional(),
  metaInscritos: z.number().int().positive().optional(),
  configuracion: z.any().optional(),
}).refine((data) => {
  // Si se proporcionan ambas fechas, validar orden
  if (data.fechaInicio && data.fechaFin) {
    return data.fechaFin > data.fechaInicio;
  }
  return true;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fechaFin"]
}).refine((data) => {
  // Si se proporcionan presupuesto y gastado, validar que presupuesto >= gastado
  if (data.presupuesto && data.gastado) {
    return parseFloat(data.presupuesto) >= parseFloat(data.gastado);
  }
  return true;
}, {
  message: "El presupuesto debe ser mayor o igual al monto gastado",
  path: ["presupuesto"]
});

export const insertReporteSchema = createInsertSchema(reportes).omit({
  id: true,
  fechaCreacion: true,
  ultimaEjecucion: true,
});

// Tipos TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProspecto = z.infer<typeof insertProspectoSchema>;
export type Prospecto = typeof prospectos.$inferSelect;

export type InsertComunicacion = z.infer<typeof insertComunicacionSchema>;
export type Comunicacion = typeof comunicaciones.$inferSelect;

export type InsertCampana = z.infer<typeof insertCampanaSchema>;
export type Campana = typeof campanas.$inferSelect;

export type InsertReporte = z.infer<typeof insertReporteSchema>;
export type Reporte = typeof reportes.$inferSelect;

// ====== NUEVAS TABLAS PARA FUNCIONALIDADES AVANZADAS ======

// Formularios públicos para captura de leads
export const formulariosPublicos = pgTable("formularios_publicos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  enlace: text("enlace").notNull().unique(), // URL única generada
  nivelEducativo: text("nivel_educativo").notNull(), // Para filtrar el tipo de prospectos
  origen: text("origen").notNull().default('formulario_publico'),
  activo: boolean("activo").default(true),
  configuracion: jsonb("configuracion"), // Campos personalizados del formulario
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaExpiracion: timestamp("fecha_expiracion"), // Opcional para formularios temporales
});

// Documentos de admisión cargados por prospectos
export const documentosAdmision = pgTable("documentos_admision", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull(),
  tipoDocumento: text("tipo_documento").notNull(), // 'identificacion', 'certificados', 'fotografias', etc.
  nombreArchivo: text("nombre_archivo").notNull(),
  rutaArchivo: text("ruta_archivo").notNull(),
  tamano: integer("tamano"), // En bytes
  estado: text("estado").notNull().default('pendiente'), // 'pendiente', 'aprobado', 'rechazado'
  comentarios: text("comentarios"),
  fechaCarga: timestamp("fecha_carga").defaultNow(),
  fechaRevision: timestamp("fecha_revision"),
  revisadoPor: varchar("revisado_por").references(() => users.id),
});

// Estudiantes (prospectos que completaron el proceso de admisión)
export const estudiantes = pgTable("estudiantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull().unique(),
  matricula: text("matricula").notNull().unique(),
  nivelEducativo: text("nivel_educativo").notNull(),
  programa: text("programa").notNull(),
  modalidad: text("modalidad").notNull(), // 'presencial', 'virtual', 'hibrida'
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaMatricula: timestamp("fecha_matricula").defaultNow(),
  estado: text("estado").notNull().default('activo'), // 'activo', 'suspendido', 'graduado', 'retirado'
  datosAcademicos: jsonb("datos_academicos"), // Información académica adicional
});

// Pagos y transacciones
export const pagos = pgTable("pagos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull(),
  estudianteId: varchar("estudiante_id").references(() => estudiantes.id),
  concepto: text("concepto").notNull(), // 'cuota_admision', 'matricula', 'mensualidad', etc.
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  moneda: text("moneda").notNull().default('MXN'),
  metodoPago: text("metodo_pago").notNull(), // 'stripe', 'paypal', 'transferencia', 'efectivo'
  estado: text("estado").notNull().default('pendiente'), // 'pendiente', 'procesando', 'completado', 'fallido', 'cancelado'
  transactionId: text("transaction_id"), // ID de la transacción del proveedor de pago
  datosPago: jsonb("datos_pago"), // Información adicional de la transacción
  fechaPago: timestamp("fecha_pago").defaultNow(),
  fechaVencimiento: timestamp("fecha_vencimiento"),
});

// Formularios de admisión llenados
export const formulariosAdmision = pgTable("formularios_admision", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectoId: varchar("prospecto_id").references(() => prospectos.id).notNull(),
  datosPersonales: jsonb("datos_personales").notNull(), // Información personal del prospecto
  datosAcademicos: jsonb("datos_academicos"), // Historial académico
  datosContacto: jsonb("datos_contacto").notNull(), // Información de contacto de emergencia
  preferenciasEstudio: jsonb("preferencias_estudio"), // Horarios, modalidad, etc.
  estado: text("estado").notNull().default('borrador'), // 'borrador', 'enviado', 'aprobado', 'rechazado'
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaEnvio: timestamp("fecha_envio"),
  fechaRevision: timestamp("fecha_revision"),
  revisadoPor: varchar("revisado_por").references(() => users.id),
});

// ====== RELACIONES PARA LAS NUEVAS TABLAS ======

export const formulariosPublicosRelations = relations(formulariosPublicos, ({ many }) => ({
  prospectos: many(prospectos),
}));

export const documentosAdmisionRelations = relations(documentosAdmision, ({ one }) => ({
  prospecto: one(prospectos, {
    fields: [documentosAdmision.prospectoId],
    references: [prospectos.id],
  }),
  revisor: one(users, {
    fields: [documentosAdmision.revisadoPor],
    references: [users.id],
  }),
}));

export const estudiantesRelations = relations(estudiantes, ({ one, many }) => ({
  prospecto: one(prospectos, {
    fields: [estudiantes.prospectoId],
    references: [prospectos.id],
  }),
  pagos: many(pagos),
}));

export const pagosRelations = relations(pagos, ({ one }) => ({
  prospecto: one(prospectos, {
    fields: [pagos.prospectoId],
    references: [prospectos.id],
  }),
  estudiante: one(estudiantes, {
    fields: [pagos.estudianteId],
    references: [estudiantes.id],
  }),
}));

export const formulariosAdmisionRelations = relations(formulariosAdmision, ({ one }) => ({
  prospecto: one(prospectos, {
    fields: [formulariosAdmision.prospectoId],
    references: [prospectos.id],
  }),
  revisor: one(users, {
    fields: [formulariosAdmision.revisadoPor],
    references: [users.id],
  }),
}));

// Actualizar relaciones de prospectos para incluir las nuevas tablas
export const prospectosRelationsExtended = relations(prospectos, ({ one, many }) => ({
  asesor: one(users, {
    fields: [prospectos.asesorId],
    references: [users.id],
  }),
  comunicaciones: many(comunicaciones),
  campanas: many(prospectosCampanas),
  documentos: many(documentosAdmision),
  estudiante: one(estudiantes),
  pagos: many(pagos),
  formularioAdmision: one(formulariosAdmision),
}));

// ====== ESQUEMAS DE INSERCIÓN Y VALIDACIÓN ======

export const insertFormularioPublicoSchema = createInsertSchema(formulariosPublicos).omit({
  id: true,
  enlace: true,
  fechaCreacion: true,
}).extend({
  nivelEducativo: z.enum(["primaria", "secundaria", "preparatoria", "universidad"]),
  origen: z.string().default('formulario_publico'),
});

export const insertDocumentoAdmisionSchema = createInsertSchema(documentosAdmision).omit({
  id: true,
  fechaCarga: true,
  fechaRevision: true,
}).extend({
  tipoDocumento: z.enum(["identificacion", "certificados", "fotografias", "comprobante_domicilio", "otros"]),
  estado: z.enum(["pendiente", "aprobado", "rechazado"]).optional(),
});

export const insertEstudianteSchema = createInsertSchema(estudiantes).omit({
  id: true,
  fechaMatricula: true,
}).extend({
  nivelEducativo: z.enum(["primaria", "secundaria", "preparatoria", "universidad"]),
  modalidad: z.enum(["presencial", "virtual", "hibrida"]),
  estado: z.enum(["activo", "suspendido", "graduado", "retirado"]).optional(),
});

export const insertPagoSchema = createInsertSchema(pagos).omit({
  id: true,
  fechaPago: true,
}).extend({
  concepto: z.enum(["cuota_admision", "matricula", "mensualidad", "otros"]),
  metodoPago: z.enum(["stripe", "paypal", "transferencia", "efectivo"]),
  estado: z.enum(["pendiente", "procesando", "completado", "fallido", "cancelado"]).optional(),
  monto: z.string().regex(/^\d+(\.\d{1,2})?$/, "Monto debe ser un número válido"),
});

export const insertFormularioAdmisionSchema = createInsertSchema(formulariosAdmision).omit({
  id: true,
  fechaCreacion: true,
  fechaEnvio: true,
  fechaRevision: true,
}).extend({
  estado: z.enum(["borrador", "enviado", "aprobado", "rechazado"]).optional(),
});

// ====== TIPOS TYPESCRIPT PARA LAS NUEVAS TABLAS ======

export type InsertFormularioPublico = z.infer<typeof insertFormularioPublicoSchema>;
export type FormularioPublico = typeof formulariosPublicos.$inferSelect;

export type InsertDocumentoAdmision = z.infer<typeof insertDocumentoAdmisionSchema>;
export type DocumentoAdmision = typeof documentosAdmision.$inferSelect;

export type InsertEstudiante = z.infer<typeof insertEstudianteSchema>;
export type Estudiante = typeof estudiantes.$inferSelect;

export type InsertPago = z.infer<typeof insertPagoSchema>;
export type Pago = typeof pagos.$inferSelect;

export type InsertFormularioAdmision = z.infer<typeof insertFormularioAdmisionSchema>;
export type FormularioAdmision = typeof formulariosAdmision.$inferSelect;