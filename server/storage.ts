import { 
  users, prospectos, comunicaciones, campanas, prospectosCampanas, reportes,
  type User, type InsertUser, type Prospecto, type InsertProspecto,
  type Comunicacion, type InsertComunicacion, type Campana, type InsertCampana
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, and, desc, count, sum, avg, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import * as ExcelJS from "exceljs";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs-extra";
import path from "path";

const PostgresSessionStore = connectPg(session);

// Interfaz actualizada para todas las operaciones del CRM
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  // Usuarios
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  validateUserPassword(username: string, password: string): Promise<boolean>;
  
  // Prospectos
  getProspecto(id: string): Promise<Prospecto | undefined>;
  createProspecto(prospecto: InsertProspecto): Promise<Prospecto>;
  updateProspecto(id: string, prospecto: Partial<InsertProspecto>): Promise<Prospecto>;
  deleteProspecto(id: string): Promise<boolean>;
  getProspectos(filters?: {
    asesorId?: string;
    estatus?: string;
    origen?: string;
    nivelEducativo?: string;
    search?: string;
  }): Promise<Prospecto[]>;
  getProspectosStats(asesorId?: string): Promise<{
    total: number;
    porEstatus: any[];
    porOrigen: any[];
    porPrioridad: any[];
    prospectosMes: number;
  }>;
  
  // Comunicaciones
  getComunicacion(id: string): Promise<Comunicacion | undefined>;
  createComunicacion(comunicacion: InsertComunicacion): Promise<Comunicacion>;
  updateComunicacion(id: string, comunicacion: Partial<InsertComunicacion>): Promise<Comunicacion>;
  deleteComunicacion(id: string): Promise<boolean>;
  getComunicacionesByProspecto(prospectoId: string): Promise<Comunicacion[]>;
  getComunicacionesByAsesor(usuarioId: string): Promise<Comunicacion[]>;
  getComunicacionesConFiltros(filters?: {
    asesorId?: string;
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<Comunicacion[]>;
  getComunicacionesStats(asesorId?: string, fechaDesde?: string, fechaHasta?: string): Promise<{
    total: number;
    porTipo: any[];
    porResultado: any[];
    duracionPromedio: number;
    comunicacionesSemana: number;
  }>;
  
  // Campañas
  getCampana(id: string): Promise<Campana | undefined>;
  createCampana(campana: InsertCampana): Promise<Campana>;
  getCampanas(activas?: boolean): Promise<Campana[]>;
  updateCampana(id: string, campana: Partial<InsertCampana>): Promise<Campana>;
  deleteCampana(id: string): Promise<boolean>;
  linkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean>;
  unlinkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean>;
  getProspectosByCampana(campanaId: string): Promise<Prospecto[]>;
  getCampanasStats(fechaDesde?: string, fechaHasta?: string, canal?: string): Promise<{
    totalCampanas: number;
    campanasActivas: number;
    presupuestoTotal: number;
    gastadoTotal: number;
    roi: number;
    porCanal: any[];
    prospectosPorCampana: any[];
    conversionPorCampana: any[];
  }>;
  getCampanaStats(campanaId: string): Promise<{
    prospectos: number;
    inscripciones: number;
    tasaConversion: number;
    costoProspecto: number;
    roi: number;
    gastado: number;
    presupuesto: number;
  }>;
  
  // Reportes
  getReporte(id: string): Promise<any>;
  getReportes(): Promise<any[]>;
  createReporte(reporte: any): Promise<any>;
  updateReporte(id: string, reporte: any): Promise<any>;
  deleteReporte(id: string): Promise<boolean>;
  ejecutarReporte(id: string): Promise<boolean>;
  generarDatosReporte(tipo: string, filtros?: any): Promise<any>;
  exportarReporte(datos: any, formato: string, tipoReporte: string): Promise<string>;
  getDashboardReportes(): Promise<{
    totalReportes: number;
    reportesActivos: number;
    ultimasEjecuciones: any[];
    reportesPendientes: number;
  }>;

  // Métricas y reportes
  getMetricasDirector(): Promise<{
    totalProspectos: number;
    totalInscritos: number;
    tasaConversion: number;
    costoPromedio: number;
    prospectosPorSemana: any[];
    inscritosPorAsesor: any[];
    origenesData: any[];
  }>;
  
  getMetricasGerente(): Promise<{
    asesoresPerformance: any[];
    actividadSemanal: any[];
  }>;
  
  getMetricasAsesor(asesorId: string): Promise<{
    misProspectos: Prospecto[];
    proximasCitas: any[];
    metricsPersonales: any;
  }>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  // Métodos de usuarios
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword
      })
      .returning();
    return user;
  }

  async validateUserPassword(username: string, password: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return false;
    }
    
    return await bcrypt.compare(password, user.password);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.rol, role));
  }

  // Métodos de prospectos
  async getProspecto(id: string): Promise<Prospecto | undefined> {
    const [prospecto] = await db.select().from(prospectos).where(eq(prospectos.id, id));
    return prospecto || undefined;
  }

  async createProspecto(insertProspecto: InsertProspecto): Promise<Prospecto> {
    const [prospecto] = await db
      .insert(prospectos)
      .values(insertProspecto)
      .returning();
    return prospecto;
  }

  async updateProspecto(id: string, updateData: Partial<InsertProspecto>): Promise<Prospecto> {
    const [prospecto] = await db
      .update(prospectos)
      .set({ ...updateData, ultimaInteraccion: new Date() })
      .where(eq(prospectos.id, id))
      .returning();
    return prospecto;
  }

  async deleteProspecto(id: string): Promise<boolean> {
    try {
      // First delete related communications
      await db.delete(comunicaciones).where(eq(comunicaciones.prospectoId, id));
      
      // Delete prospect-campaign relationships
      await db.delete(prospectosCampanas).where(eq(prospectosCampanas.prospectoId, id));
      
      // Finally delete the prospect
      const result = await db.delete(prospectos).where(eq(prospectos.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting prospect:', error);
      return false;
    }
  }

  async getProspectos(filters: {
    asesorId?: string;
    estatus?: string;
    origen?: string;
    nivelEducativo?: string;
    search?: string;
  } = {}): Promise<Prospecto[]> {
    let query = db.select().from(prospectos);
    
    const conditions = [];
    
    if (filters.asesorId) {
      conditions.push(eq(prospectos.asesorId, filters.asesorId));
    }
    
    if (filters.estatus) {
      conditions.push(eq(prospectos.estatus, filters.estatus));
    }
    
    if (filters.origen) {
      conditions.push(eq(prospectos.origen, filters.origen));
    }
    
    if (filters.nivelEducativo) {
      conditions.push(eq(prospectos.nivelEducativo, filters.nivelEducativo));
    }
    
    if (filters.search) {
      conditions.push(
        sql`(${prospectos.nombre} ILIKE ${'%' + filters.search + '%'} OR 
             ${prospectos.email} ILIKE ${'%' + filters.search + '%'})`
      );
    }
    
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(prospectos.ultimaInteraccion));
    }
    
    return query.orderBy(desc(prospectos.ultimaInteraccion));
  }

  async getProspectosStats(asesorId?: string): Promise<{
    total: number;
    porEstatus: any[];
    porOrigen: any[];
    porPrioridad: any[];
    prospectosMes: number;
  }> {
    const baseCondition = asesorId ? eq(prospectos.asesorId, asesorId) : undefined;
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    // Total de prospectos
    const totalResult = baseCondition 
      ? await db.select({ count: count() }).from(prospectos).where(baseCondition)
      : await db.select({ count: count() }).from(prospectos);
    const total = totalResult[0]?.count || 0;

    // Prospectos por estatus
    const porEstatus = baseCondition 
      ? await db.select({
          estatus: prospectos.estatus,
          count: count()
        }).from(prospectos).where(baseCondition).groupBy(prospectos.estatus)
      : await db.select({
          estatus: prospectos.estatus,
          count: count()
        }).from(prospectos).groupBy(prospectos.estatus);

    // Prospectos por origen
    const porOrigen = baseCondition 
      ? await db.select({
          origen: prospectos.origen,
          count: count()
        }).from(prospectos).where(baseCondition).groupBy(prospectos.origen)
      : await db.select({
          origen: prospectos.origen,
          count: count()
        }).from(prospectos).groupBy(prospectos.origen);

    // Prospectos por prioridad
    const porPrioridad = baseCondition 
      ? await db.select({
          prioridad: prospectos.prioridad,
          count: count()
        }).from(prospectos).where(baseCondition).groupBy(prospectos.prioridad)
      : await db.select({
          prioridad: prospectos.prioridad,
          count: count()
        }).from(prospectos).groupBy(prospectos.prioridad);

    // Prospectos del mes actual
    const mesConditions = [sql`${prospectos.fechaRegistro} >= ${firstOfMonth}`];
    if (baseCondition) {
      mesConditions.push(baseCondition);
    }
    const mesResult = await db.select({ count: count() }).from(prospectos).where(and(...mesConditions));
    const prospectosMes = mesResult[0]?.count || 0;

    return {
      total: Number(total),
      porEstatus: porEstatus.map(e => ({ estatus: e.estatus, count: Number(e.count) })),
      porOrigen: porOrigen.map(o => ({ origen: o.origen, count: Number(o.count) })),
      porPrioridad: porPrioridad.map(p => ({ prioridad: p.prioridad, count: Number(p.count) })),
      prospectosMes: Number(prospectosMes)
    };
  }

  // Métodos de comunicaciones
  async getComunicacion(id: string): Promise<Comunicacion | undefined> {
    const [comunicacion] = await db.select().from(comunicaciones).where(eq(comunicaciones.id, id));
    return comunicacion || undefined;
  }

  async createComunicacion(insertComunicacion: InsertComunicacion): Promise<Comunicacion> {
    const [comunicacion] = await db
      .insert(comunicaciones)
      .values(insertComunicacion)
      .returning();
    
    // Actualizar última interacción del prospecto
    await db
      .update(prospectos)
      .set({ ultimaInteraccion: new Date() })
      .where(eq(prospectos.id, insertComunicacion.prospectoId));
    
    return comunicacion;
  }

  async updateComunicacion(id: string, updateData: Partial<InsertComunicacion>): Promise<Comunicacion> {
    const [comunicacion] = await db
      .update(comunicaciones)
      .set(updateData)
      .where(eq(comunicaciones.id, id))
      .returning();
    return comunicacion;
  }

  async deleteComunicacion(id: string): Promise<boolean> {
    try {
      const result = await db.delete(comunicaciones).where(eq(comunicaciones.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting communication:', error);
      return false;
    }
  }

  async getComunicacionesByProspecto(prospectoId: string): Promise<Comunicacion[]> {
    return db.select()
      .from(comunicaciones)
      .where(eq(comunicaciones.prospectoId, prospectoId))
      .orderBy(desc(comunicaciones.fechaHora));
  }

  async getComunicacionesByAsesor(usuarioId: string): Promise<Comunicacion[]> {
    return db.select()
      .from(comunicaciones)
      .where(eq(comunicaciones.usuarioId, usuarioId))
      .orderBy(desc(comunicaciones.fechaHora));
  }

  async getComunicacionesConFiltros(filters: {
    asesorId?: string;
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  } = {}): Promise<Comunicacion[]> {
    let query = db.select().from(comunicaciones);
    
    const conditions = [];
    
    if (filters.asesorId) {
      conditions.push(eq(comunicaciones.usuarioId, filters.asesorId));
    }
    
    if (filters.tipo) {
      conditions.push(eq(comunicaciones.tipo, filters.tipo));
    }
    
    if (filters.fechaDesde) {
      conditions.push(sql`${comunicaciones.fechaHora} >= ${new Date(filters.fechaDesde)}`);
    }
    
    if (filters.fechaHasta) {
      conditions.push(sql`${comunicaciones.fechaHora} <= ${new Date(filters.fechaHasta)}`);
    }
    
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(comunicaciones.fechaHora));
    }
    
    return query.orderBy(desc(comunicaciones.fechaHora));
  }

  async getComunicacionesStats(asesorId?: string, fechaDesde?: string, fechaHasta?: string): Promise<{
    total: number;
    porTipo: any[];
    porResultado: any[];
    duracionPromedio: number;
    comunicacionesSemana: number;
  }> {
    const conditions = [];
    
    // Filtro por asesor
    if (asesorId) {
      conditions.push(eq(comunicaciones.usuarioId, asesorId));
    }
    
    // Filtros de fecha
    if (fechaDesde) {
      conditions.push(sql`${comunicaciones.fechaHora} >= ${new Date(fechaDesde)}`);
    }
    
    if (fechaHasta) {
      conditions.push(sql`${comunicaciones.fechaHora} <= ${new Date(fechaHasta)}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total de comunicaciones
    const totalResult = whereClause 
      ? await db.select({ count: count() }).from(comunicaciones).where(whereClause)
      : await db.select({ count: count() }).from(comunicaciones);
    const total = totalResult[0]?.count || 0;

    // Comunicaciones por tipo
    const porTipo = whereClause 
      ? await db.select({
          tipo: comunicaciones.tipo,
          count: count()
        }).from(comunicaciones).where(whereClause).groupBy(comunicaciones.tipo)
      : await db.select({
          tipo: comunicaciones.tipo,
          count: count()
        }).from(comunicaciones).groupBy(comunicaciones.tipo);

    // Comunicaciones por resultado
    const porResultado = whereClause 
      ? await db.select({
          resultado: comunicaciones.resultado,
          count: count()
        }).from(comunicaciones).where(whereClause).groupBy(comunicaciones.resultado)
      : await db.select({
          resultado: comunicaciones.resultado,
          count: count()
        }).from(comunicaciones).groupBy(comunicaciones.resultado);

    // Duración promedio
    const duracionResult = whereClause 
      ? await db.select({
          promedio: avg(comunicaciones.duracion)
        }).from(comunicaciones).where(and(whereClause, sql`${comunicaciones.duracion} IS NOT NULL`))
      : await db.select({
          promedio: avg(comunicaciones.duracion)
        }).from(comunicaciones).where(sql`${comunicaciones.duracion} IS NOT NULL`);
    const duracionPromedio = Number(duracionResult[0]?.promedio) || 0;

    // Comunicaciones de la semana pasada
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    const semanaConditions = [sql`${comunicaciones.fechaHora} >= ${weekAgo}`];
    if (asesorId) {
      semanaConditions.push(eq(comunicaciones.usuarioId, asesorId));
    }
    const semanaResult = await db.select({ count: count() }).from(comunicaciones).where(and(...semanaConditions));
    const comunicacionesSemana = semanaResult[0]?.count || 0;

    return {
      total: Number(total),
      porTipo: porTipo.map(t => ({ tipo: t.tipo, count: Number(t.count) })),
      porResultado: porResultado.map(r => ({ resultado: r.resultado, count: Number(r.count) })),
      duracionPromedio,
      comunicacionesSemana: Number(comunicacionesSemana)
    };
  }

  // Métodos de campañas
  async getCampana(id: string): Promise<Campana | undefined> {
    const [campana] = await db.select().from(campanas).where(eq(campanas.id, id));
    return campana || undefined;
  }

  async createCampana(insertCampana: InsertCampana): Promise<Campana> {
    const [campana] = await db
      .insert(campanas)
      .values(insertCampana)
      .returning();
    return campana;
  }

  async getCampanas(activas?: boolean): Promise<Campana[]> {
    let query = db.select().from(campanas);
    
    if (activas !== undefined) {
      if (activas) {
        return query.where(eq(campanas.estado, 'activa')).orderBy(desc(campanas.fechaCreacion));
      } else {
        // Para inactivas, incluir tanto pausadas como finalizadas
        return query.where(
          sql`${campanas.estado} IN ('pausada', 'finalizada')`
        ).orderBy(desc(campanas.fechaCreacion));
      }
    }
    
    return query.orderBy(desc(campanas.fechaCreacion));
  }

  async updateCampana(id: string, updateData: Partial<InsertCampana>): Promise<Campana> {
    const [campana] = await db
      .update(campanas)
      .set(updateData)
      .where(eq(campanas.id, id))
      .returning();
    return campana;
  }

  async deleteCampana(id: string): Promise<boolean> {
    try {
      // Primero eliminar relaciones con prospectos
      await db.delete(prospectosCampanas).where(eq(prospectosCampanas.campanaId, id));
      
      // Eliminar la campaña
      const result = await db.delete(campanas).where(eq(campanas.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return false;
    }
  }

  async linkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean> {
    try {
      await db
        .insert(prospectosCampanas)
        .values({ prospectoId, campanaId })
        .onConflictDoNothing();
      return true;
    } catch (error) {
      console.error('Error linking prospect to campaign:', error);
      return false;
    }
  }

  async unlinkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(prospectosCampanas)
        .where(
          and(
            eq(prospectosCampanas.prospectoId, prospectoId),
            eq(prospectosCampanas.campanaId, campanaId)
          )
        );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error unlinking prospect from campaign:', error);
      return false;
    }
  }

  async getProspectosByCampana(campanaId: string): Promise<Prospecto[]> {
    return db
      .select({
        id: prospectos.id,
        nombre: prospectos.nombre,
        telefono: prospectos.telefono,
        email: prospectos.email,
        nivelEducativo: prospectos.nivelEducativo,
        origen: prospectos.origen,
        estatus: prospectos.estatus,
        asesorId: prospectos.asesorId,
        prioridad: prospectos.prioridad,
        valorInscripcion: prospectos.valorInscripcion,
        notas: prospectos.notas,
        fechaRegistro: prospectos.fechaRegistro,
        ultimaInteraccion: prospectos.ultimaInteraccion,
        fechaCita: prospectos.fechaCita,
        datosAdicionales: prospectos.datosAdicionales
      })
      .from(prospectos)
      .innerJoin(prospectosCampanas, eq(prospectos.id, prospectosCampanas.prospectoId))
      .where(eq(prospectosCampanas.campanaId, campanaId));
  }

  async getCampanasStats(fechaDesde?: string, fechaHasta?: string, canal?: string): Promise<{
    totalCampanas: number;
    campanasActivas: number;
    presupuestoTotal: number;
    gastadoTotal: number;
    roi: number;
    porCanal: any[];
    prospectosPorCampana: any[];
    conversionPorCampana: any[];
  }> {
    const conditions = [];
    
    if (fechaDesde) {
      conditions.push(sql`${campanas.fechaCreacion} >= ${new Date(fechaDesde)}`);
    }
    
    if (fechaHasta) {
      conditions.push(sql`${campanas.fechaCreacion} <= ${new Date(fechaHasta)}`);
    }
    
    if (canal) {
      conditions.push(eq(campanas.canal, canal));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total campañas
    const totalResult = whereClause 
      ? await db.select({ count: count() }).from(campanas).where(whereClause)
      : await db.select({ count: count() }).from(campanas);
    const totalCampanas = totalResult[0]?.count || 0;

    // Campañas activas
    const activasConditions = [eq(campanas.estado, "activa")];
    if (whereClause) {
      activasConditions.push(whereClause);
    }
    const activasResult = await db.select({ count: count() }).from(campanas).where(and(...activasConditions));
    const campanasActivas = activasResult[0]?.count || 0;

    // Presupuesto total
    const presupuestoResult = whereClause 
      ? await db.select({ 
          sum: sql<string>`COALESCE(SUM(CAST(${campanas.presupuesto} AS DECIMAL)), 0)` 
        }).from(campanas).where(whereClause)
      : await db.select({ 
          sum: sql<string>`COALESCE(SUM(CAST(${campanas.presupuesto} AS DECIMAL)), 0)` 
        }).from(campanas);
    const presupuestoTotal = Number(presupuestoResult[0]?.sum) || 0;

    // Gastado total
    const gastadoResult = whereClause 
      ? await db.select({ 
          sum: sql<string>`COALESCE(SUM(CAST(${campanas.gastado} AS DECIMAL)), 0)` 
        }).from(campanas).where(whereClause)
      : await db.select({ 
          sum: sql<string>`COALESCE(SUM(CAST(${campanas.gastado} AS DECIMAL)), 0)` 
        }).from(campanas);
    const gastadoTotal = Number(gastadoResult[0]?.sum) || 0;

    // ROI calculado con ingresos reales de inscripciones
    // Calcular ingresos totales de prospectos inscritos
    let ingresosQuery = db
      .select({
        ingresos: sql<string>`COALESCE(SUM(CAST(${prospectos.valorInscripcion} AS DECIMAL)), 0)`
      })
      .from(prospectos)
      .innerJoin(prospectosCampanas, eq(prospectos.id, prospectosCampanas.prospectoId))
      .innerJoin(campanas, eq(prospectosCampanas.campanaId, campanas.id))
      .where(
        and(
          eq(prospectos.estatus, 'inscrito'),
          whereClause ? whereClause : sql`true`
        )
      );

    const ingresosResult = await ingresosQuery;
    const ingresosTotal = Number(ingresosResult[0]?.ingresos) || 0;

    // ROI = ((Ingresos - Costos) / Costos) * 100
    const roi = gastadoTotal > 0 ? ((ingresosTotal - gastadoTotal) / gastadoTotal) * 100 : 0;

    // Campañas por canal
    const porCanal = whereClause 
      ? await db.select({
          canal: campanas.canal,
          count: count(),
          presupuesto: sql<string>`COALESCE(SUM(CAST(${campanas.presupuesto} AS DECIMAL)), 0)`,
          gastado: sql<string>`COALESCE(SUM(CAST(${campanas.gastado} AS DECIMAL)), 0)`
        }).from(campanas).where(whereClause).groupBy(campanas.canal)
      : await db.select({
          canal: campanas.canal,
          count: count(),
          presupuesto: sql<string>`COALESCE(SUM(CAST(${campanas.presupuesto} AS DECIMAL)), 0)`,
          gastado: sql<string>`COALESCE(SUM(CAST(${campanas.gastado} AS DECIMAL)), 0)`
        }).from(campanas).groupBy(campanas.canal);

    return {
      totalCampanas: Number(totalCampanas),
      campanasActivas: Number(campanasActivas),
      presupuestoTotal,
      gastadoTotal,
      roi,
      porCanal: porCanal.map(c => ({
        canal: c.canal,
        count: Number(c.count),
        presupuesto: Number(c.presupuesto),
        gastado: Number(c.gastado)
      })),
      prospectosPorCampana: [], // Implementar si necesario
      conversionPorCampana: []   // Implementar si necesario
    };
  }

  async getCampanaStats(campanaId: string): Promise<{
    prospectos: number;
    inscripciones: number;
    tasaConversion: number;
    costoProspecto: number;
    roi: number;
    gastado: number;
    presupuesto: number;
  }> {
    // Obtener campaña
    const campana = await this.getCampana(campanaId);
    if (!campana) {
      throw new Error('Campaña no encontrada');
    }

    const presupuesto = Number(campana.presupuesto);
    const gastado = Number(campana.gastado);

    // Contar prospectos vinculados
    const [prospectosResult] = await db
      .select({ count: count() })
      .from(prospectosCampanas)
      .where(eq(prospectosCampanas.campanaId, campanaId));

    const prospectosCount = Number(prospectosResult.count);

    // Contar inscripciones (prospectos con estatus inscrito)
    const inscripcionesResult = await db
      .select({ count: count() })
      .from(prospectos)
      .innerJoin(prospectosCampanas, eq(prospectos.id, prospectosCampanas.prospectoId))
      .where(
        and(
          eq(prospectosCampanas.campanaId, campanaId),
          eq(prospectos.estatus, 'inscrito')
        )
      );

    const inscripciones = Number(inscripcionesResult[0]?.count) || 0;

    // Calcular ingresos reales de inscripciones para ROI
    const ingresosResult = await db
      .select({
        ingresos: sql<string>`COALESCE(SUM(CAST(${prospectos.valorInscripcion} AS DECIMAL)), 0)`
      })
      .from(prospectos)
      .innerJoin(prospectosCampanas, eq(prospectos.id, prospectosCampanas.prospectoId))
      .where(
        and(
          eq(prospectosCampanas.campanaId, campanaId),
          eq(prospectos.estatus, 'inscrito')
        )
      );

    const ingresos = Number(ingresosResult[0]?.ingresos) || 0;

    // Calcular métricas
    const tasaConversion = prospectosCount > 0 ? (inscripciones / prospectosCount) * 100 : 0;
    const costoProspecto = prospectosCount > 0 ? gastado / prospectosCount : 0;
    const roi = gastado > 0 ? ((ingresos - gastado) / gastado) * 100 : 0;

    return {
      prospectos: prospectosCount,
      inscripciones,
      tasaConversion,
      costoProspecto,
      roi,
      gastado,
      presupuesto
    };
  }

  // Métricas para Dashboard Director
  async getMetricasDirector(): Promise<{
    totalProspectos: number;
    totalInscritos: number;
    tasaConversion: number;
    costoPromedio: number;
    prospectosPorSemana: any[];
    inscritosPorAsesor: any[];
    origenesData: any[];
  }> {
    // Total prospectos
    const [totalProspectosResult] = await db
      .select({ count: count() })
      .from(prospectos);
    
    // Total inscritos
    const [totalInscritosResult] = await db
      .select({ count: count() })
      .from(prospectos)
      .where(eq(prospectos.estatus, 'inscrito'));
    
    const totalProspectos = totalProspectosResult.count;
    const totalInscritos = totalInscritosResult.count;
    const tasaConversion = totalProspectos > 0 ? (totalInscritos / totalProspectos) * 100 : 0;
    
    // Prospectos por semana (últimas 4 semanas)
    const prospectosPorSemana = await db
      .select({
        semana: sql`EXTRACT(WEEK FROM ${prospectos.fechaRegistro})`,
        count: count()
      })
      .from(prospectos)
      .where(sql`${prospectos.fechaRegistro} >= NOW() - INTERVAL '4 weeks'`)
      .groupBy(sql`EXTRACT(WEEK FROM ${prospectos.fechaRegistro})`)
      .orderBy(sql`EXTRACT(WEEK FROM ${prospectos.fechaRegistro})`);
    
    // Inscritos por asesor
    const inscritosPorAsesor = await db
      .select({
        asesor: users.nombre,
        inscritos: count()
      })
      .from(prospectos)
      .leftJoin(users, eq(prospectos.asesorId, users.id))
      .where(eq(prospectos.estatus, 'inscrito'))
      .groupBy(users.nombre);
    
    // Orígenes de prospectos
    const origenesData = await db
      .select({
        origen: prospectos.origen,
        count: count()
      })
      .from(prospectos)
      .groupBy(prospectos.origen);

    // Calculate average cost from active campaigns
    const [costoPromedioResult] = await db
      .select({
        promedio: avg(campanas.gastado)
      })
      .from(campanas)
      .where(eq(campanas.estado, 'activa'));
    
    const costoPromedio = costoPromedioResult?.promedio ? 
      parseFloat(costoPromedioResult.promedio.toString()) : 0;

    return {
      totalProspectos,
      totalInscritos,
      tasaConversion,
      costoPromedio,
      prospectosPorSemana,
      inscritosPorAsesor,
      origenesData
    };
  }

  // Métricas para Dashboard Gerente
  async getMetricasGerente(): Promise<{
    asesoresPerformance: any[];
    actividadSemanal: any[];
  }> {
    // Performance por asesor
    const asesoresPerformance = await db
      .select({
        nombre: users.nombre,
        prospectos: count(prospectos.id),
        inscritos: sql`COUNT(CASE WHEN ${prospectos.estatus} = 'inscrito' THEN 1 END)`,
        comunicaciones: sql`(SELECT COUNT(*) FROM ${comunicaciones} WHERE ${comunicaciones.usuarioId} = ${users.id})`
      })
      .from(users)
      .leftJoin(prospectos, eq(users.id, prospectos.asesorId))
      .where(eq(users.rol, 'asesor'))
      .groupBy(users.id, users.nombre);
    
    // Actividad semanal del equipo
    const actividadSemanal = await db
      .select({
        semana: sql`EXTRACT(WEEK FROM ${comunicaciones.fechaHora})`,
        llamadas: sql`COUNT(CASE WHEN ${comunicaciones.tipo} = 'llamada' THEN 1 END)`,
        emails: sql`COUNT(CASE WHEN ${comunicaciones.tipo} = 'email' THEN 1 END)`,
        whatsapp: sql`COUNT(CASE WHEN ${comunicaciones.tipo} = 'whatsapp' THEN 1 END)`
      })
      .from(comunicaciones)
      .where(sql`${comunicaciones.fechaHora} >= NOW() - INTERVAL '4 weeks'`)
      .groupBy(sql`EXTRACT(WEEK FROM ${comunicaciones.fechaHora})`)
      .orderBy(sql`EXTRACT(WEEK FROM ${comunicaciones.fechaHora})`);

    return {
      asesoresPerformance,
      actividadSemanal
    };
  }

  // Métricas para Dashboard Asesor
  async getMetricasAsesor(asesorId: string): Promise<{
    misProspectos: Prospecto[];
    proximasCitas: any[];
    metricsPersonales: any;
  }> {
    // Mis prospectos
    const misProspectos = await this.getProspectos({ asesorId });
    
    // Próximas citas
    const proximasCitas = await db
      .select({
        prospecto: prospectos.nombre,
        fecha: prospectos.fechaCita,
        telefono: prospectos.telefono
      })
      .from(prospectos)
      .where(
        and(
          eq(prospectos.asesorId, asesorId),
          sql`${prospectos.fechaCita} >= NOW()`,
          eq(prospectos.estatus, 'cita_agendada')
        )
      )
      .orderBy(prospectos.fechaCita);
    
    // Métricas personales
    const [metricsResult] = await db
      .select({
        totalProspectos: count(),
        inscritos: sql`COUNT(CASE WHEN ${prospectos.estatus} = 'inscrito' THEN 1 END)`,
        comunicaciones: sql`(SELECT COUNT(*) FROM ${comunicaciones} WHERE ${comunicaciones.usuarioId} = ${asesorId})`
      })
      .from(prospectos)
      .where(eq(prospectos.asesorId, asesorId));

    return {
      misProspectos,
      proximasCitas,
      metricsPersonales: metricsResult
    };
  }

  // MÉTODOS DE REPORTES
  
  // Obtener reporte individual
  async getReporte(id: string): Promise<any> {
    const [reporte] = await db.select().from(reportes).where(eq(reportes.id, id));
    return reporte || undefined;
  }

  // Obtener todos los reportes
  async getReportes(): Promise<any[]> {
    return db.select().from(reportes).orderBy(desc(reportes.fechaCreacion));
  }

  // Crear nuevo reporte
  async createReporte(insertReporte: any): Promise<any> {
    // Calcular próxima ejecución basada en frecuencia
    const proximaEjecucion = this.calcularProximaEjecucion(insertReporte.frecuencia);
    
    const [reporte] = await db
      .insert(reportes)
      .values({
        ...insertReporte,
        proximaEjecucion
      })
      .returning();
      
    return reporte;
  }

  // Actualizar reporte
  async updateReporte(id: string, updateData: any): Promise<any> {
    // Si se actualiza la frecuencia, recalcular próxima ejecución
    if (updateData.frecuencia) {
      updateData.proximaEjecucion = this.calcularProximaEjecucion(updateData.frecuencia);
    }
    
    const [reporte] = await db
      .update(reportes)
      .set(updateData)
      .where(eq(reportes.id, id))
      .returning();
      
    return reporte;
  }

  // Eliminar reporte
  async deleteReporte(id: string): Promise<boolean> {
    try {
      const result = await db.delete(reportes).where(eq(reportes.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }

  // Ejecutar reporte específico
  async ejecutarReporte(id: string): Promise<boolean> {
    try {
      const reporte = await this.getReporte(id);
      if (!reporte) {
        console.error('Report not found:', id);
        return false;
      }

      // Generar datos del reporte
      const datos = await this.generarDatosReporte(reporte.tipo, reporte.configuracion);
      
      // Aquí se podría enviar por email a los destinatarios
      // Por ahora solo actualizamos la fecha de ejecución
      
      const ahora = new Date();
      const proximaEjecucion = this.calcularProximaEjecucion(reporte.frecuencia, ahora);
      
      await db
        .update(reportes)
        .set({
          ultimaEjecucion: ahora,
          proximaEjecucion
        })
        .where(eq(reportes.id, id));
        
      console.log(`Report ${reporte.nombre} executed successfully`);
      return true;
    } catch (error) {
      console.error('Error executing report:', error);
      return false;
    }
  }

  // Generar datos específicos por tipo de reporte
  async generarDatosReporte(tipo: string, filtros?: any): Promise<any> {
    const ahora = new Date();
    const fechaDesde = filtros?.fechaDesde ? new Date(filtros.fechaDesde) : new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const fechaHasta = filtros?.fechaHasta ? new Date(filtros.fechaHasta) : ahora;

    switch (tipo) {
      case 'ejecutivo':
        return await this.generarReporteEjecutivo(fechaDesde, fechaHasta, filtros);
      
      case 'asesores':
        return await this.generarReporteAsesores(fechaDesde, fechaHasta, filtros);
      
      case 'campanas':
        return await this.generarReporteCampanas(fechaDesde, fechaHasta, filtros);
      
      case 'conversiones':
        return await this.generarReporteConversiones(fechaDesde, fechaHasta, filtros);
      
      default:
        throw new Error(`Tipo de reporte no soportado: ${tipo}`);
    }
  }

  // Exportar reporte en formato específico
  async exportarReporte(datos: any, formato: string, tipoReporte: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `reporte_${tipoReporte}_${timestamp}.${formato.toLowerCase()}`;
    
    try {
      switch (formato.toLowerCase()) {
        case 'csv':
          return this.exportarCSV(datos, fileName);
        
        case 'pdf':
          return this.exportarPDF(datos, fileName, tipoReporte);
        
        case 'excel':
          return this.exportarExcel(datos, fileName);
        
        default:
          throw new Error(`Formato no soportado: ${formato}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Dashboard de reportes
  async getDashboardReportes(): Promise<{
    totalReportes: number;
    reportesActivos: number;
    ultimasEjecuciones: any[];
    reportesPendientes: number;
  }> {
    // Total de reportes
    const [totalResult] = await db.select({ count: count() }).from(reportes);
    const totalReportes = Number(totalResult?.count || 0);

    // Reportes activos
    const [activosResult] = await db
      .select({ count: count() })
      .from(reportes)
      .where(eq(reportes.activo, true));
    const reportesActivos = Number(activosResult?.count || 0);

    // Últimas ejecuciones
    const ultimasEjecuciones = await db
      .select({
        id: reportes.id,
        nombre: reportes.nombre,
        tipo: reportes.tipo,
        ultimaEjecucion: reportes.ultimaEjecucion,
        proximaEjecucion: reportes.proximaEjecucion
      })
      .from(reportes)
      .where(sql`${reportes.ultimaEjecucion} IS NOT NULL`)
      .orderBy(desc(reportes.ultimaEjecucion))
      .limit(10);

    // Reportes pendientes de ejecución
    const [pendientesResult] = await db
      .select({ count: count() })
      .from(reportes)
      .where(
        and(
          eq(reportes.activo, true),
          sql`${reportes.proximaEjecucion} <= NOW()`
        )
      );
    const reportesPendientes = Number(pendientesResult?.count || 0);

    return {
      totalReportes,
      reportesActivos,
      ultimasEjecuciones,
      reportesPendientes
    };
  }

  // MÉTODOS AUXILIARES PARA REPORTES

  // Calcular próxima ejecución basada en frecuencia
  private calcularProximaEjecucion(frecuencia: string, desde?: Date): Date {
    const base = desde || new Date();
    const proxima = new Date(base);

    switch (frecuencia) {
      case 'diario':
        proxima.setDate(proxima.getDate() + 1);
        break;
      case 'semanal':
        proxima.setDate(proxima.getDate() + 7);
        break;
      case 'mensual':
        proxima.setMonth(proxima.getMonth() + 1);
        break;
      default:
        // Default a semanal si no se reconoce la frecuencia
        proxima.setDate(proxima.getDate() + 7);
    }

    return proxima;
  }

  // Generar reporte ejecutivo
  private async generarReporteEjecutivo(fechaDesde: Date, fechaHasta: Date, filtros?: any): Promise<any> {
    const metricas = await this.getMetricasDirector();
    
    // Estadísticas adicionales por período
    const [prospectosPerido] = await db
      .select({ count: count() })
      .from(prospectos)
      .where(
        and(
          sql`${prospectos.fechaRegistro} >= ${fechaDesde}`,
          sql`${prospectos.fechaRegistro} <= ${fechaHasta}`
        )
      );

    const [inscritosPeriodo] = await db
      .select({ count: count() })
      .from(prospectos)
      .where(
        and(
          eq(prospectos.estatus, 'inscrito'),
          sql`${prospectos.ultimaInteraccion} >= ${fechaDesde}`,
          sql`${prospectos.ultimaInteraccion} <= ${fechaHasta}`
        )
      );

    const [gastoCampanas] = await db
      .select({ total: sum(campanas.gastado) })
      .from(campanas)
      .where(
        and(
          sql`${campanas.fechaInicio} <= ${fechaHasta}`,
          sql`${campanas.fechaFin} >= ${fechaDesde}`
        )
      );

    return {
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta
      },
      resumenGeneral: {
        ...metricas,
        prospectosPeriodo: Number(prospectosPerido?.count || 0),
        inscritosPeriodo: Number(inscritosPeriodo?.count || 0),
        gastoCampanas: parseFloat(gastoCampanas?.total?.toString() || '0')
      },
      generadoEn: new Date()
    };
  }

  // Generar reporte de asesores
  private async generarReporteAsesores(fechaDesde: Date, fechaHasta: Date, filtros?: any): Promise<any> {
    const asesores = await db
      .select({
        id: users.id,
        nombre: users.nombre,
        email: users.email,
        prospectos: sql`COUNT(DISTINCT ${prospectos.id})`,
        inscritos: sql`COUNT(DISTINCT CASE WHEN ${prospectos.estatus} = 'inscrito' THEN ${prospectos.id} END)`,
        comunicaciones: sql`COUNT(DISTINCT ${comunicaciones.id})`,
        promedioTiempo: sql`AVG(EXTRACT(EPOCH FROM (${prospectos.ultimaInteraccion} - ${prospectos.fechaRegistro})) / 86400)` // días
      })
      .from(users)
      .leftJoin(prospectos, eq(users.id, prospectos.asesorId))
      .leftJoin(comunicaciones, eq(users.id, comunicaciones.usuarioId))
      .where(
        and(
          eq(users.rol, 'asesor'),
          filtros?.asesorId ? eq(users.id, filtros.asesorId) : sql`1=1`,
          sql`${prospectos.fechaRegistro} >= ${fechaDesde}`,
          sql`${prospectos.fechaRegistro} <= ${fechaHasta}`
        )
      )
      .groupBy(users.id, users.nombre, users.email);

    // Performance comparativa
    const performance = asesores.map(asesor => ({
      ...asesor,
      tasaConversion: Number(asesor.inscritos) / Math.max(Number(asesor.prospectos), 1) * 100,
      comunicacionesPorProspecto: Number(asesor.comunicaciones) / Math.max(Number(asesor.prospectos), 1),
      tiempoPromedioConversion: parseFloat(asesor.promedioTiempo?.toString() || '0')
    }));

    return {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      asesores: performance,
      resumen: {
        totalAsesores: asesores.length,
        mejorAsesor: performance.reduce((best, current) => 
          current.tasaConversion > best.tasaConversion ? current : best, performance[0]),
        promedioConversion: performance.reduce((sum, a) => sum + a.tasaConversion, 0) / performance.length
      },
      generadoEn: new Date()
    };
  }

  // Generar reporte de campañas
  private async generarReporteCampanas(fechaDesde: Date, fechaHasta: Date, filtros?: any): Promise<any> {
    const campanasStats = await this.getCampanasStats(
      fechaDesde.toISOString(),
      fechaHasta.toISOString(),
      filtros?.canal
    );

    // Detalle por campaña
    const campanasDetalle = await db
      .select({
        id: campanas.id,
        nombre: campanas.nombre,
        canal: campanas.canal,
        presupuesto: campanas.presupuesto,
        gastado: campanas.gastado,
        estado: campanas.estado,
        prospectos: sql`COUNT(DISTINCT ${prospectosCampanas.prospectoId})`,
        inscritos: sql`COUNT(DISTINCT CASE WHEN ${prospectos.estatus} = 'inscrito' THEN ${prospectos.id} END)`
      })
      .from(campanas)
      .leftJoin(prospectosCampanas, eq(campanas.id, prospectosCampanas.campanaId))
      .leftJoin(prospectos, eq(prospectosCampanas.prospectoId, prospectos.id))
      .where(
        and(
          sql`${campanas.fechaInicio} <= ${fechaHasta}`,
          sql`${campanas.fechaFin} >= ${fechaDesde}`,
          filtros?.canal ? eq(campanas.canal, filtros.canal) : sql`1=1`
        )
      )
      .groupBy(campanas.id, campanas.nombre, campanas.canal, campanas.presupuesto, campanas.gastado, campanas.estado);

    return {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      resumenGeneral: campanasStats,
      detalleCampanas: campanasDetalle.map(campana => ({
        ...campana,
        tasaConversion: Number(campana.inscritos) / Math.max(Number(campana.prospectos), 1) * 100,
        costoProspecto: parseFloat(campana.gastado?.toString() || '0') / Math.max(Number(campana.prospectos), 1),
        roi: (parseFloat(campana.gastado?.toString() || '0') > 0) ? 
          (Number(campana.inscritos) * 1000 - parseFloat(campana.gastado?.toString() || '0')) / parseFloat(campana.gastado?.toString() || '1') * 100 : 0
      })),
      generadoEn: new Date()
    };
  }

  // Generar reporte de conversiones
  private async generarReporteConversiones(fechaDesde: Date, fechaHasta: Date, filtros?: any): Promise<any> {
    // Embudo de conversión por estatus
    const embudo = await db
      .select({
        estatus: prospectos.estatus,
        count: count(),
        origen: prospectos.origen
      })
      .from(prospectos)
      .where(
        and(
          sql`${prospectos.fechaRegistro} >= ${fechaDesde}`,
          sql`${prospectos.fechaRegistro} <= ${fechaHasta}`
        )
      )
      .groupBy(prospectos.estatus, prospectos.origen);

    // Tiempo promedio por etapa
    const tiemposPorEtapa = await db
      .select({
        estatus: prospectos.estatus,
        tiempoPromedio: sql`AVG(EXTRACT(EPOCH FROM (${prospectos.ultimaInteraccion} - ${prospectos.fechaRegistro})) / 86400)`
      })
      .from(prospectos)
      .where(
        and(
          sql`${prospectos.fechaRegistro} >= ${fechaDesde}`,
          sql`${prospectos.fechaRegistro} <= ${fechaHasta}`
        )
      )
      .groupBy(prospectos.estatus);

    // Conversiones por origen
    const conversionesPorOrigen = await db
      .select({
        origen: prospectos.origen,
        total: count(),
        inscritos: sql`COUNT(CASE WHEN ${prospectos.estatus} = 'inscrito' THEN 1 END)`
      })
      .from(prospectos)
      .where(
        and(
          sql`${prospectos.fechaRegistro} >= ${fechaDesde}`,
          sql`${prospectos.fechaRegistro} <= ${fechaHasta}`
        )
      )
      .groupBy(prospectos.origen);

    return {
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      embudoConversion: embudo,
      tiemposPorEtapa: tiemposPorEtapa.map(t => ({
        ...t,
        tiempoPromedio: parseFloat(t.tiempoPromedio?.toString() || '0')
      })),
      conversionesPorOrigen: conversionesPorOrigen.map(c => ({
        ...c,
        tasaConversion: Number(c.inscritos) / Math.max(Number(c.total), 1) * 100
      })),
      generadoEn: new Date()
    };
  }

  // Métodos de exportación
  private async exportarCSV(datos: any, fileName: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.ensureDir(reportsDir);
    const filePath = path.join(reportsDir, fileName);
    
    if (Array.isArray(datos.asesores) || Array.isArray(datos.detalleCampanas)) {
      // Para reportes tabulares
      const records = datos.asesores || datos.detalleCampanas || [];
      if (records.length > 0) {
        const headers = Object.keys(records[0]).map(key => ({ id: key, title: key.toUpperCase() }));
        const csvWriter = createObjectCsvWriter({
          path: filePath,
          header: headers
        });
        await csvWriter.writeRecords(records);
      }
    } else {
      // Para datos no tabulares, crear CSV simple
      const csvContent = this.objetoACSV(datos);
      await fs.writeFile(filePath, csvContent, 'utf8');
    }
    
    console.log(`CSV generated: ${filePath}`);
    return filePath;
  }

  private async exportarPDF(datos: any, fileName: string, tipoReporte: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.ensureDir(reportsDir);
    const filePath = path.join(reportsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Header
    doc.fontSize(20).text('Reporte CRM Educativo', { align: 'center' });
    doc.fontSize(16).text(this.getTituloReporte(tipoReporte), { align: 'center' });
    doc.moveDown();
    
    if (datos.periodo) {
      doc.fontSize(12).text(`Período: ${new Date(datos.periodo.desde).toLocaleDateString()} - ${new Date(datos.periodo.hasta).toLocaleDateString()}`);
      doc.moveDown();
    }
    
    // Content based on report type
    switch (tipoReporte) {
      case 'ejecutivo':
        this.escribirReporteEjecutivoPDF(doc, datos);
        break;
      case 'asesores':
        this.escribirReporteAsesoresPDF(doc, datos);
        break;
      case 'campanas':
        this.escribirReporteCampanasPDF(doc, datos);
        break;
      default:
        doc.text('Datos del reporte:', { underline: true });
        doc.text(JSON.stringify(datos, null, 2));
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log(`PDF generated: ${filePath}`);
        resolve(filePath);
      });
      stream.on('error', reject);
    });
  }

  private async exportarExcel(datos: any, fileName: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.ensureDir(reportsDir);
    const filePath = path.join(reportsDir, fileName);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CRM Educativo';
    workbook.created = new Date();
    
    // Crear hoja principal
    const worksheet = workbook.addWorksheet('Reporte');
    
    if (datos.asesores && Array.isArray(datos.asesores)) {
      // Reporte de asesores
      const headers = ['Nombre', 'Email', 'Prospectos', 'Inscritos', 'Tasa Conversión %', 'Comunicaciones'];
      worksheet.addRow(headers);
      
      datos.asesores.forEach((asesor: any) => {
        worksheet.addRow([
          asesor.nombre,
          asesor.email,
          asesor.prospectos,
          asesor.inscritos,
          Number(asesor.tasaConversion).toFixed(2),
          asesor.comunicaciones
        ]);
      });
    } else if (datos.detalleCampanas && Array.isArray(datos.detalleCampanas)) {
      // Reporte de campañas
      const headers = ['Nombre', 'Canal', 'Estado', 'Presupuesto', 'Gastado', 'Prospectos', 'Inscritos', 'ROI %'];
      worksheet.addRow(headers);
      
      datos.detalleCampanas.forEach((campana: any) => {
        worksheet.addRow([
          campana.nombre,
          campana.canal,
          campana.estado,
          Number(campana.presupuesto),
          Number(campana.gastado),
          campana.prospectos,
          campana.inscritos,
          Number(campana.roi).toFixed(2)
        ]);
      });
    } else {
      // Reporte general con resumen
      worksheet.addRow(['Métrica', 'Valor']);
      
      if (datos.resumenGeneral) {
        const resumen = datos.resumenGeneral;
        Object.entries(resumen).forEach(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'string') {
            worksheet.addRow([key, value]);
          }
        });
      }
    }
    
    // Estilo de headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F2FF' }
    };
    
    // Auto-resize columns
    worksheet.columns.forEach(column => {
      if (column.header) {
        column.width = Math.max(column.header.length + 2, 12);
      }
    });
    
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel generated: ${filePath}`);
    return filePath;
  }

  private objetoACSV(obj: any): string {
    // Convertir objeto a CSV básico
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '';
      
      const headers = Object.keys(obj[0]);
      const csvHeaders = headers.join(',');
      const csvRows = obj.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    }
    
    // Para objetos simples
    const entries = Object.entries(obj);
    return entries.map(([key, value]) => `"${key}","${value}"`).join('\n');
  }

  // Método faltante: getTituloReporte
  private getTituloReporte(tipoReporte: string): string {
    switch (tipoReporte) {
      case 'ejecutivo':
        return 'Reporte Ejecutivo';
      case 'asesores':
        return 'Reporte de Performance de Asesores';
      case 'campanas':
        return 'Reporte de Campañas';
      case 'conversiones':
        return 'Reporte de Conversiones';
      default:
        return 'Reporte Personalizado';
    }
  }

  // Método faltante: escribirReporteEjecutivoPDF
  private escribirReporteEjecutivoPDF(doc: any, datos: any): void {
    if (datos.resumenGeneral) {
      const resumen = datos.resumenGeneral;
      
      doc.fontSize(14).text('Resumen Ejecutivo', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Total de Prospectos: ${resumen.totalProspectos || 0}`);
      doc.text(`Total Inscritos: ${resumen.totalInscritos || 0}`);
      doc.text(`Tasa de Conversión: ${(resumen.tasaConversion || 0).toFixed(2)}%`);
      doc.text(`Costo Promedio: $${(resumen.costoPromedio || 0).toFixed(2)}`);
      
      if (resumen.prospectosPeriodo !== undefined) {
        doc.text(`Prospectos del Período: ${resumen.prospectosPeriodo}`);
      }
      if (resumen.inscritosPeriodo !== undefined) {
        doc.text(`Inscritos del Período: ${resumen.inscritosPeriodo}`);
      }
      if (resumen.gastoCampanas !== undefined) {
        doc.text(`Gasto en Campañas: $${resumen.gastoCampanas.toFixed(2)}`);
      }
      
      doc.moveDown();
    }
    
    if (datos.origenesData && Array.isArray(datos.origenesData)) {
      doc.fontSize(14).text('Prospectos por Origen', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      datos.origenesData.forEach((origen: any) => {
        doc.text(`${origen.origen}: ${origen.count} prospectos`);
      });
      doc.moveDown();
    }
  }

  // Método faltante: escribirReporteAsesoresPDF
  private escribirReporteAsesoresPDF(doc: any, datos: any): void {
    if (datos.asesores && Array.isArray(datos.asesores)) {
      doc.fontSize(14).text('Performance de Asesores', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      datos.asesores.forEach((asesor: any) => {
        doc.text(`Asesor: ${asesor.nombre}`);
        doc.text(`  Email: ${asesor.email}`);
        doc.text(`  Prospectos: ${asesor.prospectos}`);
        doc.text(`  Inscritos: ${asesor.inscritos}`);
        doc.text(`  Tasa Conversión: ${(asesor.tasaConversion || 0).toFixed(2)}%`);
        doc.text(`  Comunicaciones: ${asesor.comunicaciones}`);
        doc.moveDown(0.5);
      });
    }
    
    if (datos.resumen) {
      doc.fontSize(14).text('Resumen', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      doc.text(`Total Asesores: ${datos.resumen.totalAsesores}`);
      doc.text(`Promedio Conversión: ${(datos.resumen.promedioConversion || 0).toFixed(2)}%`);
      
      if (datos.resumen.mejorAsesor) {
        doc.text(`Mejor Asesor: ${datos.resumen.mejorAsesor.nombre} (${(datos.resumen.mejorAsesor.tasaConversion || 0).toFixed(2)}%)`);
      }
    }
  }

  // Método faltante: escribirReporteCampanasPDF
  private escribirReporteCampanasPDF(doc: any, datos: any): void {
    if (datos.resumenGeneral) {
      const resumen = datos.resumenGeneral;
      
      doc.fontSize(14).text('Resumen de Campañas', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      doc.text(`Total Campañas: ${resumen.totalCampanas || 0}`);
      doc.text(`Campañas Activas: ${resumen.campanasActivas || 0}`);
      doc.text(`Presupuesto Total: $${(resumen.presupuestoTotal || 0).toFixed(2)}`);
      doc.text(`Gastado Total: $${(resumen.gastadoTotal || 0).toFixed(2)}`);
      doc.text(`ROI: ${(resumen.roi || 0).toFixed(2)}%`);
      doc.moveDown();
    }
    
    if (datos.detalleCampanas && Array.isArray(datos.detalleCampanas)) {
      doc.fontSize(14).text('Detalle de Campañas', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      datos.detalleCampanas.forEach((campana: any) => {
        doc.text(`Campaña: ${campana.nombre}`);
        doc.text(`  Canal: ${campana.canal}`);
        doc.text(`  Estado: ${campana.estado}`);
        doc.text(`  Presupuesto: $${Number(campana.presupuesto || 0).toFixed(2)}`);
        doc.text(`  Gastado: $${Number(campana.gastado || 0).toFixed(2)}`);
        doc.text(`  Prospectos: ${campana.prospectos}`);
        doc.text(`  Inscritos: ${campana.inscritos}`);
        doc.text(`  Tasa Conversión: ${(campana.tasaConversion || 0).toFixed(2)}%`);
        doc.text(`  ROI: ${(campana.roi || 0).toFixed(2)}%`);
        doc.moveDown(0.5);
      });
    }
  }
}

export const storage = new DatabaseStorage();