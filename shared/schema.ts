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
  estatus: text("estatus").notNull().default('primer_contacto'), // 'primer_contacto', 'seguimiento', 'cita_agendada', 'inscrito', 'no_interesado'
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