// Componente de rutas protegidas para CRM educativo (basado en blueprint:javascript_auth_all_persistance)
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              Acceso Denegado
            </h2>
            <p className="text-muted-foreground mb-4">
              No tienes permisos suficientes para acceder a esta sección.
            </p>
            <p className="text-sm text-muted-foreground">
              Tu rol actual: <strong>{user.rol}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Roles requeridos: <strong>{allowedRoles.join(", ")}</strong>
            </p>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

// Componente helper para rutas que requieren rol específico
export function DirectorRoute({ path, component }: { path: string; component: () => React.JSX.Element }) {
  return <ProtectedRoute path={path} component={component} allowedRoles={["director"]} />;
}

export function GerenteRoute({ path, component }: { path: string; component: () => React.JSX.Element }) {
  return <ProtectedRoute path={path} component={component} allowedRoles={["director", "gerente"]} />;
}

export function AsesorRoute({ path, component }: { path: string; component: () => React.JSX.Element }) {
  return <ProtectedRoute path={path} component={component} allowedRoles={["director", "gerente", "asesor"]} />;
}