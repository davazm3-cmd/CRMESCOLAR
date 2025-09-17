import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ProcesoAdmisionManager } from "@/components/proceso-admision-manager";
import type { Prospecto } from "@shared/schema";

export default function ProcesoAdmisionPage() {
  const { prospectoId } = useParams();
  const [, setLocation] = useLocation();

  const { data: prospecto, isLoading, error } = useQuery<Prospecto>({
    queryKey: ['/api/prospectos', prospectoId],
    enabled: !!prospectoId
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando información del prospecto...</div>
        </div>
      </div>
    );
  }

  if (error || !prospecto) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Prospecto no encontrado
                </h3>
                <p className="text-muted-foreground">
                  No se pudo cargar la información del prospecto.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/prospectos')}
                data-testid="button-volver-prospectos"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Prospectos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si el prospecto está en una etapa válida para admisión
  const etapasValidasParaAdmision = ['cita_agendada', 'documentos', 'admitido', 'matriculado'];
  if (!etapasValidasParaAdmision.includes(prospecto.estatus)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Proceso de Admisión - {prospecto.nombre}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/prospectos')}
                data-testid="button-volver-prospectos-header"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-2">
                  Proceso de admisión no disponible
                </h3>
                <p className="text-muted-foreground">
                  El prospecto debe estar en etapa de "Cita Agendada" o posterior para acceder al proceso de admisión.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Estado actual: <span className="font-medium">{prospecto.estatus}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header de navegación */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="title-proceso-admision-page">
            Proceso de Admisión Digital
          </h1>
          <p className="text-muted-foreground">
            {prospecto.nombre} • {prospecto.email} • {prospecto.telefono}
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setLocation('/prospectos')}
          data-testid="button-volver-prospectos-main"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Prospectos
        </Button>
      </div>

      {/* Componente principal del proceso */}
      <ProcesoAdmisionManager prospecto={prospecto} />
    </div>
  );
}