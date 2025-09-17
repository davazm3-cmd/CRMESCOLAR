// Implementación del sistema de autenticación para CRM educativo (basado en blueprint:javascript_auth_all_persistance)
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const registerSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Debe ser un email válido"),
  rol: z.enum(["director", "gerente", "asesor"], {
    errorMap: () => ({ message: "El rol debe ser director, gerente o asesor" }),
  }),
});

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set for authentication to work");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Usuario no encontrado" });
          }

          const isValid = await storage.validateUserPassword(username, password);
          if (!isValid) {
            return done(null, false, { message: "Contraseña incorrecta" });
          }

          // No incluir la contraseña en la sesión
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword as SelectUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        done(null, userWithoutPassword as SelectUser);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Endpoint de registro
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ 
          error: "El nombre de usuario ya está en uso" 
        });
      }

      const user = await storage.createUser(validatedData);
      const { password: _, ...userWithoutPassword } = user;

      req.login(userWithoutPassword as SelectUser, (err) => {
        if (err) {
          console.error("Error during login after registration:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Datos de registro inválidos", 
          details: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Endpoint de login
  app.post("/api/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Datos de login inválidos",
        details: validation.error.errors
      });
    }

    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          error: info?.message || "Credenciales inválidas" 
        });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Endpoint de logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      res.status(200).json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Endpoint para obtener datos del usuario actual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    res.json(req.user);
  });

  // Middleware para proteger rutas por rol
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (req.user?.rol !== "director") {
      return res.status(403).json({ error: "Acceso denegado: se requiere rol de Director" });
    }
    next();
  });

  app.use("/api/manager/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!["director", "gerente"].includes(req.user?.rol || "")) {
      return res.status(403).json({ error: "Acceso denegado: se requiere rol de Director o Gerente" });
    }
    next();
  });
}

// Middleware helper para proteger rutas específicas
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    if (!allowedRoles.includes(req.user?.rol || "")) {
      return res.status(403).json({ 
        error: `Acceso denegado: se requiere uno de estos roles: ${allowedRoles.join(", ")}` 
      });
    }
    
    next();
  };
}