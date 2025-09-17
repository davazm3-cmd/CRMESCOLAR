import { StatsCard } from "./stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Phone,
  Clock,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

//todo: remove mock data functionality
const advisorPerformance = [
  { 
    nombre: "María García", 
    citasAtendidas: 45, 
    inscritos: 28, 
    conversion: 62.2,
    meta: 25,
    estatus: "Superó meta"
  },
  { 
    nombre: "Carlos López", 
    citasAtendidas: 38, 
    inscritos: 24, 
    conversion: 63.1,
    meta: 22,
    estatus: "Superó meta"
  },
  { 
    nombre: "Ana Martínez", 
    citasAtendidas: 32, 
    inscritos: 19, 
    conversion: 59.4,
    meta: 20,
    estatus: "Bajo meta"
  },
  { 
    nombre: "Luis Rodríguez", 
    citasAtendidas: 29, 
    inscritos: 16, 
    conversion: 55.2,
    meta: 18,
    estatus: "Bajo meta"
  },
];

const weeklyActivity = [
  { semana: "Sem 1", llamadas: 156, citasAgendadas: 89, conversiones: 34 },
  { semana: "Sem 2", llamadas: 142, citasAgendadas: 78, conversiones: 28 },
  { semana: "Sem 3", llamadas: 168, citasAgendadas: 95, conversiones: 41 },
  { semana: "Sem 4", llamadas: 175, citasAgendadas: 102, conversiones: 38 },
];

export function GerenteDashboard() {
  const handleAssignTask = (advisorName: string) => {
    console.log(`Asignando tarea a: ${advisorName}`);
  };

  const handleViewDetails = (advisorName: string) => {
    console.log(`Viendo detalles de: ${advisorName}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-gerente">
            Dashboard Gerente de Admisión
          </h1>
          <p className="text-muted-foreground">
            Supervisión de equipo y análisis de desempeño
          </p>
        </div>
      </div>

      {/* KPIs del Equipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Asesores"
          value="4"
          icon={Users}
          subtitle="Activos en el sistema"
        />
        <StatsCard
          title="Meta Mensual"
          value="85"
          icon={Target}
          subtitle="Inscritos objetivo"
        />
        <StatsCard
          title="Progreso Meta"
          value="87"
          icon={Award}
          change={{ value: "102% completado", type: "positive" }}
        />
        <StatsCard
          title="Tiempo Respuesta Promedio"
          value="2.3h"
          icon={Clock}
          change={{ value: "-0.5h vs sem anterior", type: "positive" }}
        />
      </div>

      {/* Actividad Semanal del Equipo */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Semanal del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="llamadas" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Llamadas Realizadas"
              />
              <Line 
                type="monotone" 
                dataKey="citasAgendadas" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Citas Agendadas"
              />
              <Line 
                type="monotone" 
                dataKey="conversiones" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Conversiones"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking y Desempeño de Asesores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Asesores - Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={advisorPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="conversion" 
                  fill="hsl(var(--chart-1))" 
                  name="% Conversión"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumplimiento de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advisorPerformance.map((advisor, index) => {
                const progress = (advisor.inscritos / advisor.meta) * 100;
                const isOverTarget = progress >= 100;
                
                return (
                  <div key={advisor.nombre} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{advisor.nombre}</h4>
                        <Badge 
                          variant={isOverTarget ? "default" : "secondary"}
                          className={isOverTarget ? "bg-green-500" : "bg-yellow-500"}
                        >
                          {advisor.estatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {advisor.inscritos}/{advisor.meta} inscritos ({progress.toFixed(1)}%)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(advisor.nombre)}
                        data-testid={`button-view-${advisor.nombre.replace(' ', '-').toLowerCase()}`}
                      >
                        Ver Detalles
                      </Button>
                      {!isOverTarget && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAssignTask(advisor.nombre)}
                          data-testid={`button-assign-${advisor.nombre.replace(' ', '-').toLowerCase()}`}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Asignar Tarea
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada de Desempeño */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte Detallado de Desempeño</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Asesor</th>
                  <th className="text-left p-2">Citas Atendidas</th>
                  <th className="text-left p-2">Inscritos</th>
                  <th className="text-left p-2">% Conversión</th>
                  <th className="text-left p-2">Meta</th>
                  <th className="text-left p-2">Estatus</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {advisorPerformance.map((advisor) => (
                  <tr key={advisor.nombre} className="border-b hover-elevate">
                    <td className="p-2 font-medium">{advisor.nombre}</td>
                    <td className="p-2">{advisor.citasAtendidas}</td>
                    <td className="p-2 font-bold">{advisor.inscritos}</td>
                    <td className="p-2">
                      <Badge variant="outline">
                        {advisor.conversion}%
                      </Badge>
                    </td>
                    <td className="p-2">{advisor.meta}</td>
                    <td className="p-2">
                      <Badge 
                        variant={advisor.estatus === "Superó meta" ? "default" : "secondary"}
                        className={advisor.estatus === "Superó meta" ? "bg-green-500" : "bg-yellow-500"}
                      >
                        {advisor.estatus}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(advisor.nombre)}
                        data-testid={`button-details-${advisor.nombre.replace(' ', '-').toLowerCase()}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}