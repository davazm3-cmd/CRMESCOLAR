import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Users, BarChart3, MessageCircle } from "lucide-react";
import { useEffect } from "react";

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
    errorMap: () => ({ message: "Debes seleccionar un rol válido" }),
  }),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      nombre: "",
      email: "",
      rol: "asesor",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  // Prevenir render si ya está autenticado
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Formulario de autenticación */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {isLogin 
                ? "Accede a tu cuenta del CRM Educativo"
                : "Registrate en el CRM Educativo"
              }
            </p>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Usuario</Label>
                  <Input
                    id="login-username"
                    type="text"
                    {...loginForm.register("username")}
                    data-testid="input-login-username"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    {...loginForm.register("password")}
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-username">Usuario</Label>
                    <Input
                      id="register-username"
                      type="text"
                      {...registerForm.register("username")}
                      data-testid="input-register-username"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="register-nombre">Nombre Completo</Label>
                    <Input
                      id="register-nombre"
                      type="text"
                      {...registerForm.register("nombre")}
                      data-testid="input-register-nombre"
                    />
                    {registerForm.formState.errors.nombre && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.nombre.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    {...registerForm.register("email")}
                    data-testid="input-register-email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    {...registerForm.register("password")}
                    data-testid="input-register-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-rol">Rol en la Institución</Label>
                  <select 
                    id="register-rol"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...registerForm.register("rol")}
                    data-testid="select-register-rol"
                  >
                    <option value="asesor">Asesor Educativo</option>
                    <option value="gerente">Gerente de Admisión</option>
                    <option value="director">Director/Rector</option>
                  </select>
                  {registerForm.formState.errors.rol && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.rol.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
              </p>
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-auth-mode"
              >
                {isLogin ? "Crear cuenta nueva" : "Iniciar sesión"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hero section */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="text-center max-w-lg">
          <GraduationCap className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">
            CRM Educativo
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sistema integral de gestión para instituciones educativas
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">Gestión de Prospectos</h3>
                <p className="text-sm text-muted-foreground">
                  Administra candidatos desde primer contacto hasta inscripción
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">Dashboards por Rol</h3>
                <p className="text-sm text-muted-foreground">
                  Vistas personalizadas para Directores, Gerentes y Asesores
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">Comunicaciones Integradas</h3>
                <p className="text-sm text-muted-foreground">
                  Registro de llamadas, emails y mensajes internos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}