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
  
  // Comunicaciones
  createComunicacion(comunicacion: InsertComunicacion): Promise<Comunicacion>;
  getComunicacionesByProspecto(prospectoId: string): Promise<Comunicacion[]>;
  getComunicacionesByAsesor(usuarioId: string): Promise<Comunicacion[]>;
  
  // Campañas
  createCampana(campana: InsertCampana): Promise<Campana>;
  getCampanas(activas?: boolean): Promise<Campana[]>;
  updateCampana(id: string, campana: Partial<InsertCampana>): Promise<Campana>;
  linkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean>;
  unlinkProspectoACampana(prospectoId: string, campanaId: string): Promise<boolean>;
  
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

  // Métodos de comunicaciones
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

  // Métodos de campañas
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
      const estado = activas ? 'activa' : 'pausada';
      return query.where(eq(campanas.estado, estado)).orderBy(desc(campanas.fechaCreacion));
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
}

export const storage = new DatabaseStorage();