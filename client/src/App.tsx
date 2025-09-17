import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DirectorDashboard } from "@/components/director-dashboard";
import { GerenteDashboard } from "@/components/gerente-dashboard";
import { AsesorDashboard } from "@/components/asesor-dashboard";
import { ProspectManager } from "@/components/prospect-manager";
import { CommunicationCenter } from "@/components/communication-center";
import { CampaignManager } from "@/components/campaign-manager";
import { ReportsCenter } from "@/components/reports-center";
import FormulariosPublicosManager from "@/components/formularios-publicos-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import FormularioPublicoPage from "@/pages/formulario-publico-page";
import ProcesoAdmisionPage from "@/pages/proceso-admision-page";
import { useState } from "react";

function WelcomeScreen() {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            ¡Bienvenido al CRM Educativo!
          </CardTitle>
          {user && (
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Hola <strong>{user.nombre}</strong>
              </p>
              <Badge variant="secondary" className="text-sm">
                Rol: {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-lg">
            Sistema integral de gestión para instituciones educativas
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 text-center border rounded-lg hover-elevate">
              <h3 className="font-semibold mb-2">Gestión de Prospectos</h3>
              <p className="text-sm text-muted-foreground">
                Administración centralizada de todos los candidatos a estudiantes
              </p>
            </div>
            <div className="p-4 text-center border rounded-lg hover-elevate">
              <h3 className="font-semibold mb-2">Dashboards por Rol</h3>
              <p className="text-sm text-muted-foreground">
                Vistas personalizadas para Directores, Gerentes y Asesores
              </p>
            </div>
            <div className="p-4 text-center border rounded-lg hover-elevate">
              <h3 className="font-semibold mb-2">Análisis y Reportes</h3>
              <p className="text-sm text-muted-foreground">
                Métricas actualizadas cada 3 horas con exportación
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Navegación:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Use el menú lateral para acceder a las diferentes secciones</li>
              <li>• Los dashboards por rol están en la sección inferior del menú</li>
              <li>• Sus permisos están configurados según su rol: <strong>{user?.rol}</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Switch>
      {/* Ruta pública para formularios - NO requiere autenticación */}
      <Route path="/form/:enlace" component={FormularioPublicoPage} />
      {/* Ruta protegida para proceso de admisión */}
      <ProtectedRoute path="/proceso-admision/:prospectoId" component={ProcesoAdmisionPage} />
      <ProtectedRoute path="/" component={MainApp} />
      <Route path="/auth" component={AuthPage} />
      <Route component={() => <div>Página no encontrada</div>} />
    </Switch>
  );
}

function MainApp() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, logoutMutation, isDirector, isGerente, isAsesor } = useAuth();

  // Componente de acceso denegado
  const AccessDenied = ({ requiredRole }: { requiredRole: string }) => (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Tu rol actual:</strong> {user?.rol}
            </p>
            <p className="text-sm">
              <strong>Rol requerido:</strong> {requiredRole}
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setActiveSection("dashboard")}
              className="text-sm text-primary hover:underline"
              data-testid="button-back-dashboard"
            >
              Volver al inicio
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "director":
        // Solo directores pueden ver este dashboard
        if (!isDirector) {
          return <AccessDenied requiredRole="Director" />;
        }
        return <DirectorDashboard />;
        
      case "gerente":
        // Solo gerentes y directores pueden ver este dashboard
        if (!isGerente) {
          return <AccessDenied requiredRole="Gerente o Director" />;
        }
        return <GerenteDashboard />;
        
      case "asesor":
        // Todos los roles autenticados pueden ver la vista asesor
        if (!isAsesor) {
          return <AccessDenied requiredRole="Asesor, Gerente o Director" />;
        }
        return <AsesorDashboard />;
        
      case "prospectos":
        return <ProspectManager />;
      case "comunicaciones":
        return <CommunicationCenter />;
      case "campanas":
        return <CampaignManager />;
      case "reportes":
        return <ReportsCenter />;
      case "formularios-publicos":
        // Solo directores y gerentes pueden gestionar formularios públicos
        if (!isDirector && !isGerente) {
          return <AccessDenied requiredRole="Director o Gerente" />;
        }
        return <FormulariosPublicosManager />;
      case "configuracion":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Panel de configuración en desarrollo...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <WelcomeScreen />;
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {user.nombre} ({user.rol})
                  </Badge>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid="button-logout"
                  >
                    {logoutMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
                  </button>
                </div>
              )}
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {renderSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;