import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";

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
      const { prospectoId } = req.query;
      
      if (prospectoId) {
        const comunicaciones = await storage.getComunicacionesByProspecto(prospectoId as string);
        res.json(comunicaciones);
      } else if (req.user?.rol === "asesor") {
        const comunicaciones = await storage.getComunicacionesByAsesor(req.user.id);
        res.json(comunicaciones);
      } else {
        res.status(400).json({ error: "ID de prospecto requerido" });
      }
    } catch (error) {
      console.error("Error getting communications:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/comunicaciones", requireAuth, async (req, res) => {
    try {
      const { prospectoId, tipo, contenido } = req.body;
      
      if (!prospectoId || !tipo || !contenido) {
        return res.status(400).json({ error: "ProspectoId, tipo y contenido son requeridos" });
      }

      const comunicacion = await storage.createComunicacion({
        prospectoId,
        usuarioId: req.user!.id,
        tipo,
        direccion: "enviado",
        contenido
      });
      
      res.status(201).json(comunicacion);
    } catch (error) {
      console.error("Error creating communication:", error);
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
      const { nombre, descripcion, presupuesto, fechaInicio, fechaFin } = req.body;
      
      if (!nombre || !descripcion) {
        return res.status(400).json({ error: "Nombre y descripción son requeridos" });
      }

      const campana = await storage.createCampana({
        nombre,
        descripcion,
        canal: "web",
        presupuesto: presupuesto ? presupuesto.toString() : "0",
        gastado: "0",
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaFin: fechaFin ? new Date(fechaFin) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estado: "activa"
      });
      
      res.status(201).json(campana);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
