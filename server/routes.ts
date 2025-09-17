import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { insertComunicacionSchema, updateComunicacionSchema, insertCampanaSchema, updateCampanaSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación (basado en blueprint:javascript_auth_all_persistance)
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Rutas protegidas para prospectos
  app.get("/api/prospectos", requireAuth, async (req, res) => {
    try {
      const { asesorId, estatus, origen, nivelEducativo, search } = req.query;
      
      // Si es asesor, solo puede ver sus propios prospectos
      const filters: any = {};
      if (req.user?.rol === "asesor") {
        filters.asesorId = req.user.id;
      } else if (asesorId) {
        filters.asesorId = asesorId as string;
      }
      
      if (estatus) filters.estatus = estatus as string;
      if (origen) filters.origen = origen as string;
      if (nivelEducativo) filters.nivelEducativo = nivelEducativo as string;
      if (search) filters.search = search as string;
      
      const prospectos = await storage.getProspectos(filters);
      res.json(prospectos);
    } catch (error) {
      console.error("Error getting prospects:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/prospectos", requireAuth, async (req, res) => {
    try {
      const { nombre, email, telefono, nivelEducativo, origen, notas, estatus, prioridad } = req.body;
      
      if (!nombre || !email || !telefono) {
        return res.status(400).json({ error: "Nombre, email y teléfono son requeridos" });
      }

      const prospecto = await storage.createProspecto({
        nombre,
        email,
        telefono,
        nivelEducativo: nivelEducativo || "bachillerato",
        origen: origen || "web",
        estatus: estatus || "contacto_inicial",
        asesorId: req.user!.id,
        prioridad: prioridad || "media",
        notas
      });
      
      res.status(201).json(prospecto);
    } catch (error) {
      console.error("Error creating prospect:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener prospecto individual
  app.get("/api/prospectos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const prospecto = await storage.getProspecto(id);
      
      if (!prospecto) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }
      
      // Verificar autorización: asesores solo pueden ver sus prospectos
      if (req.user?.rol === "asesor" && prospecto.asesorId !== req.user.id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      res.json(prospecto);
    } catch (error) {
      console.error("Error getting prospect:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar prospecto
  app.put("/api/prospectos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, telefono, estatus, prioridad, notas, fechaCita } = req.body;
      
      const prospectoExistente = await storage.getProspecto(id);
      if (!prospectoExistente) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }
      
      // Verificar autorización: asesores solo pueden actualizar sus prospectos
      if (req.user?.rol === "asesor" && prospectoExistente.asesorId !== req.user.id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const updateData: any = {};
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (telefono) updateData.telefono = telefono;
      if (estatus) updateData.estatus = estatus;
      if (prioridad) updateData.prioridad = prioridad;
      if (notas) updateData.notas = notas;
      if (fechaCita) updateData.fechaCita = new Date(fechaCita);

      const prospectoActualizado = await storage.updateProspecto(id, updateData);
      res.json(prospectoActualizado);
    } catch (error) {
      console.error("Error updating prospect:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Eliminar prospecto (solo gerente y director)
  app.delete("/api/prospectos/:id", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      const prospectoExistente = await storage.getProspecto(id);
      if (!prospectoExistente) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }

      const eliminado = await storage.deleteProspecto(id);
      if (eliminado) {
        res.json({ message: "Prospecto eliminado exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo eliminar el prospecto" });
      }
    } catch (error) {
      console.error("Error deleting prospect:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Asignar prospecto a asesor (solo gerente y director)
  app.post("/api/prospectos/:id/asignar", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { asesorId } = req.body;
      
      if (!asesorId) {
        return res.status(400).json({ error: "ID de asesor requerido" });
      }

      const prospectoExistente = await storage.getProspecto(id);
      if (!prospectoExistente) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }
      
      // Verificar que el asesor existe
      const asesor = await storage.getUser(asesorId);
      if (!asesor || asesor.rol !== "asesor") {
        return res.status(400).json({ error: "Asesor no válido" });
      }

      const prospectoActualizado = await storage.updateProspecto(id, { asesorId });
      res.json(prospectoActualizado);
    } catch (error) {
      console.error("Error assigning prospect:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener lista de asesores (solo gerente y director)
  app.get("/api/asesores", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const asesores = await storage.getUsersByRole("asesor");
      // No incluir contraseñas en la respuesta
      const asesoresSinPassword = asesores.map(({ password, ...asesor }) => asesor);
      res.json(asesoresSinPassword);
    } catch (error) {
      console.error("Error getting advisors:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Estadísticas de prospectos (para dashboard)
  app.get("/api/prospectos/stats", requireAuth, async (req, res) => {
    try {
      const { asesorId } = req.query;
      
      // Si es asesor, solo puede ver sus estadísticas
      const filtroAsesor = req.user?.rol === "asesor" ? req.user.id : asesorId as string;
      
      const stats = await storage.getProspectosStats(filtroAsesor);
      res.json(stats);
    } catch (error) {
      console.error("Error getting prospect stats:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Métricas del director (solo directores)
  app.get("/api/metrics/director", requireRole(["director"]), async (req, res) => {
    try {
      const metrics = await storage.getMetricasDirector();
      res.json(metrics);
    } catch (error) {
      console.error("Error getting director metrics:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Métricas del gerente (gerentes y directores)
  app.get("/api/metrics/gerente", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const metrics = await storage.getMetricasGerente();
      res.json(metrics);
    } catch (error) {
      console.error("Error getting manager metrics:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Métricas del asesor (todos los roles, pero filtradas por usuario)
  app.get("/api/metrics/asesor", requireAuth, async (req, res) => {
    try {
      const asesorId = req.user?.rol === "asesor" ? req.user.id : (req.query.asesorId as string);
      
      if (!asesorId) {
        return res.status(400).json({ error: "ID de asesor requerido" });
      }
      
      const metrics = await storage.getMetricasAsesor(asesorId);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting advisor metrics:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Rutas de comunicaciones
  app.get("/api/comunicaciones", requireAuth, async (req, res) => {
    try {
      const { prospectoId, asesorId, tipo, fechaDesde, fechaHasta } = req.query;
      
      // Si se especifica un prospecto, obtener sus comunicaciones
      if (prospectoId) {
        // Verificar acceso al prospecto
        const prospecto = await storage.getProspecto(prospectoId as string);
        if (!prospecto) {
          return res.status(404).json({ error: "Prospecto no encontrado" });
        }
        
        // Asesores solo pueden ver comunicaciones de sus prospectos
        if (req.user?.rol === "asesor" && prospecto.asesorId !== req.user.id) {
          return res.status(403).json({ error: "Acceso denegado" });
        }
        
        const comunicaciones = await storage.getComunicacionesByProspecto(prospectoId as string);
        res.json(comunicaciones);
      } 
      // Si es asesor sin filtros, ver solo sus comunicaciones
      else if (req.user?.rol === "asesor") {
        const comunicaciones = await storage.getComunicacionesByAsesor(req.user.id);
        res.json(comunicaciones);
      } 
      // Gerentes y directores pueden ver todas las comunicaciones con filtros
      else if (["gerente", "director"].includes(req.user!.rol)) {
        const comunicaciones = await storage.getComunicacionesConFiltros({
          asesorId: asesorId as string,
          tipo: tipo as string,
          fechaDesde: fechaDesde as string,
          fechaHasta: fechaHasta as string
        });
        res.json(comunicaciones);
      } else {
        res.status(400).json({ error: "Parámetros insuficientes" });
      }
    } catch (error) {
      console.error("Error getting communications:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/comunicaciones", requireAuth, async (req, res) => {
    try {
      // Validar datos con Zod
      const validationResult = insertComunicacionSchema.safeParse({
        ...req.body,
        usuarioId: req.user!.id // Agregar usuario del token
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: validationResult.error.issues 
        });
      }
      
      const { prospectoId, tipo, contenido, resultado, duracion, direccion, estado } = validationResult.data;

      // Verificar que el prospecto existe y el asesor puede acceder
      const prospecto = await storage.getProspecto(prospectoId);
      if (!prospecto) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }

      // Solo asesores pueden comunicarse con sus prospectos asignados
      if (req.user?.rol === "asesor" && prospecto.asesorId !== req.user.id) {
        return res.status(403).json({ error: "No tienes permiso para comunicarte con este prospecto" });
      }

      const comunicacion = await storage.createComunicacion({
        prospectoId,
        usuarioId: req.user!.id,
        tipo,
        direccion: direccion || "enviado",
        contenido,
        resultado: resultado || null,
        duracion: duracion || null,
        estado: estado || "completado"
      });
      
      res.status(201).json(comunicacion);
    } catch (error) {
      console.error("Error creating communication:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar comunicación
  app.put("/api/comunicaciones/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar datos con Zod
      const validationResult = updateComunicacionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: validationResult.error.issues 
        });
      }

      const comunicacionExistente = await storage.getComunicacion(id);
      if (!comunicacionExistente) {
        return res.status(404).json({ error: "Comunicación no encontrada" });
      }

      // Solo el usuario que creó la comunicación puede actualizarla
      if (comunicacionExistente.usuarioId !== req.user!.id) {
        return res.status(403).json({ error: "No tienes permiso para actualizar esta comunicación" });
      }

      const comunicacionActualizada = await storage.updateComunicacion(id, validationResult.data);
      res.json(comunicacionActualizada);
    } catch (error) {
      console.error("Error updating communication:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener comunicación específica
  app.get("/api/comunicaciones/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comunicacion = await storage.getComunicacion(id);

      if (!comunicacion) {
        return res.status(404).json({ error: "Comunicación no encontrada" });
      }

      // Verificar acceso - asesores solo pueden ver comunicaciones de sus prospectos
      if (req.user?.rol === "asesor") {
        const prospecto = await storage.getProspecto(comunicacion.prospectoId);
        if (!prospecto || prospecto.asesorId !== req.user.id) {
          return res.status(403).json({ error: "Acceso denegado" });
        }
      }

      res.json(comunicacion);
    } catch (error) {
      console.error("Error getting communication:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Eliminar comunicación
  app.delete("/api/comunicaciones/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const comunicacionExistente = await storage.getComunicacion(id);
      if (!comunicacionExistente) {
        return res.status(404).json({ error: "Comunicación no encontrada" });
      }

      // Verificar autorización: el creador, gerentes o directores pueden eliminar
      const isCreator = comunicacionExistente.usuarioId === req.user!.id;
      const isManagerOrDirector = ["gerente", "director"].includes(req.user!.rol);
      
      if (!isCreator && !isManagerOrDirector) {
        return res.status(403).json({ error: "No tienes permiso para eliminar esta comunicación" });
      }

      const eliminado = await storage.deleteComunicacion(id);
      if (eliminado) {
        res.json({ message: "Comunicación eliminada exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo eliminar la comunicación" });
      }
    } catch (error) {
      console.error("Error deleting communication:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Estadísticas de comunicaciones
  app.get("/api/comunicaciones/stats", requireAuth, async (req, res) => {
    try {
      const { asesorId, fechaDesde, fechaHasta } = req.query;
      
      // Si es asesor, solo puede ver sus estadísticas
      const filtroAsesor = req.user?.rol === "asesor" ? req.user.id : asesorId as string;
      
      const stats = await storage.getComunicacionesStats(
        filtroAsesor, 
        fechaDesde as string, 
        fechaHasta as string
      );
      res.json(stats);
    } catch (error) {
      console.error("Error getting communication stats:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Rutas de campañas (solo gerentes y directores)
  app.get("/api/campanas", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { activas } = req.query;
      const isActive = activas === "true" ? true : activas === "false" ? false : undefined;
      const campanas = await storage.getCampanas(isActive);
      res.json(campanas);
    } catch (error) {
      console.error("Error getting campaigns:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/campanas", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      // Preparar datos para validación con fechas convertidas
      const datosValidacion = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : new Date(),
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        presupuesto: req.body.presupuesto ? req.body.presupuesto.toString() : "0",
        gastado: "0",
        estado: "activa"
      };

      // Validar datos con Zod
      const validationResult = insertCampanaSchema.safeParse(datosValidacion);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: validationResult.error.issues 
        });
      }

      const campana = await storage.createCampana(validationResult.data);
      res.status(201).json(campana);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener campaña específica
  app.get("/api/campanas/:id", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;
      const campana = await storage.getCampana(id);
      
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }
      
      res.json(campana);
    } catch (error) {
      console.error("Error getting campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar campaña
  app.put("/api/campanas/:id", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;

      const campanaExistente = await storage.getCampana(id);
      if (!campanaExistente) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }

      // Preparar datos para validación
      const datosValidacion: any = {};
      if (req.body.nombre) datosValidacion.nombre = req.body.nombre;
      if (req.body.descripcion) datosValidacion.descripcion = req.body.descripcion;
      if (req.body.canal) datosValidacion.canal = req.body.canal;
      if (req.body.presupuesto !== undefined) datosValidacion.presupuesto = req.body.presupuesto.toString();
      if (req.body.gastado !== undefined) datosValidacion.gastado = req.body.gastado.toString();
      if (req.body.estado) datosValidacion.estado = req.body.estado;
      if (req.body.fechaInicio) datosValidacion.fechaInicio = new Date(req.body.fechaInicio);
      if (req.body.fechaFin) datosValidacion.fechaFin = new Date(req.body.fechaFin);
      if (req.body.metaProspectos) datosValidacion.metaProspectos = req.body.metaProspectos;
      if (req.body.metaInscritos) datosValidacion.metaInscritos = req.body.metaInscritos;
      if (req.body.configuracion) datosValidacion.configuracion = req.body.configuracion;

      // Validar datos con Zod
      const validationResult = updateCampanaSchema.safeParse(datosValidacion);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Datos inválidos", 
          details: validationResult.error.issues 
        });
      }

      const campanaActualizada = await storage.updateCampana(id, validationResult.data);
      res.json(campanaActualizada);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Eliminar campaña (solo director)
  app.delete("/api/campanas/:id", requireRole(["director"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      const campanaExistente = await storage.getCampana(id);
      if (!campanaExistente) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }

      const eliminada = await storage.deleteCampana(id);
      if (eliminada) {
        res.json({ message: "Campaña eliminada exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo eliminar la campaña" });
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Vincular prospecto a campaña
  app.post("/api/campanas/:id/prospectos", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { prospectoId } = req.body;

      if (!prospectoId) {
        return res.status(400).json({ error: "ID de prospecto requerido" });
      }

      const campana = await storage.getCampana(id);
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }

      const prospecto = await storage.getProspecto(prospectoId);
      if (!prospecto) {
        return res.status(404).json({ error: "Prospecto no encontrado" });
      }

      const vinculado = await storage.linkProspectoACampana(prospectoId, id);
      if (vinculado) {
        res.json({ message: "Prospecto vinculado a campaña exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo vincular el prospecto a la campaña" });
      }
    } catch (error) {
      console.error("Error linking prospect to campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Desvincular prospecto de campaña
  app.delete("/api/campanas/:id/prospectos/:prospectoId", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id, prospectoId } = req.params;

      const desvinculado = await storage.unlinkProspectoACampana(prospectoId, id);
      if (desvinculado) {
        res.json({ message: "Prospecto desvinculado de campaña exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo desvincular el prospecto de la campaña" });
      }
    } catch (error) {
      console.error("Error unlinking prospect from campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener prospectos de una campaña
  app.get("/api/campanas/:id/prospectos", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;

      const campana = await storage.getCampana(id);
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }

      const prospectos = await storage.getProspectosByCampana(id);
      res.json(prospectos);
    } catch (error) {
      console.error("Error getting campaign prospects:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ROI y métricas por canal - estadísticas detalladas de campañas
  app.get("/api/campanas/stats", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { fechaDesde, fechaHasta, canal } = req.query;
      
      const stats = await storage.getCampanasStats(
        fechaDesde as string, 
        fechaHasta as string, 
        canal as string
      );
      res.json(stats);
    } catch (error) {
      console.error("Error getting campaign stats:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Métricas específicas de una campaña
  app.get("/api/campanas/:id/stats", requireRole(["director", "gerente"]), async (req, res) => {
    try {
      const { id } = req.params;

      const campana = await storage.getCampana(id);
      if (!campana) {
        return res.status(404).json({ error: "Campaña no encontrada" });
      }

      const stats = await storage.getCampanaStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting individual campaign stats:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
