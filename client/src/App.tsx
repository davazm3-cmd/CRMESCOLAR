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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

function WelcomeScreen() {
  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">
            Bienvenido al CRM Educativo
          </CardTitle>
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
              <li>• Todas las funciones incluyen datos de demostración interactivos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "director":
        return <DirectorDashboard />;
      case "gerente":
        return <GerenteDashboard />;
      case "asesor":
        return <AsesorDashboard />;
      case "prospectos":
        return <ProspectManager />;
      case "comunicaciones":
        return <CommunicationCenter />;
      case "campanas":
        return <CampaignManager />;
      case "reportes":
        return <ReportsCenter />;
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

  return renderSection();
}

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar 
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-2 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    CRM Educativo v1.0
                  </span>
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;