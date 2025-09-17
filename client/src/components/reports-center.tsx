import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Calendar,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock
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
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

//todo: remove mock data functionality
const reportTypes = [
  {
    id: 1,
    nombre: "Reporte Ejecutivo Mensual",
    descripcion: "Análisis completo de métricas clave para dirección",
    frecuencia: "Mensual",
    ultimaActualizacion: "2024-01-14 08:00",
    disponible: true
  },
  {
    id: 2,
    nombre: "Desempeño de Asesores",
    descripcion: "Ranking y métricas de cada asesor educativo",
    frecuencia: "Semanal",
    ultimaActualizacion: "2024-01-14 06:00",
    disponible: true
  },
  {
    id: 3,
    nombre: "Análisis de Campañas",
    descripcion: "ROI y efectividad por canal de marketing",
    frecuencia: "Quincenal",
    ultimaActualizacion: "2024-01-13 18:00",
    disponible: true
  },
  {
    id: 4,
    nombre: "Conversión por Origen",
    descripcion: "Tasas de conversión según fuente de prospectos",
    frecuencia: "Semanal",
    ultimaActualizacion: "En proceso...",
    disponible: false
  }
];

const kpiData = [
  { mes: "Oct", prospectos: 298, inscritos: 42, inversion: 32000 },
  { mes: "Nov", prospectos: 356, inscritos: 51, inversion: 28500 },
  { mes: "Dic", prospectos: 412, inscritos: 58, inversion: 31200 },
  { mes: "Ene", prospectos: 445, inscritos: 67, inversion: 29800 },
];

const conversionData = [
  { origen: "Facebook Ads", conversion: 14.2 },
  { origen: "Google Ads", conversion: 15.7 },
  { origen: "Referencias", conversion: 31.4 },
  { origen: "Eventos", conversion: 22.8 },
];

const sourceData = [
  { name: "Facebook Ads", value: 35, color: "#3b82f6" },
  { name: "Google Ads", value: 28, color: "#10b981" },
  { name: "Referencias", value: 22, color: "#f59e0b" },
  { name: "Eventos", value: 15, color: "#ef4444" },
];

export function ReportsCenter() {
  const handleDownloadReport = (reportId: number, format: string) => {
    console.log(`Descargando reporte ${reportId} en formato ${format}`);
  };

  const handleScheduleReport = (reportId: number) => {
    console.log(`Programando reporte ${reportId}`);
  };

  const handleCustomReport = () => {
    console.log("Creando reporte personalizado");
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Mensual":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Semanal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Quincenal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-reports">
            Centro de Reportes
          </h1>
          <p className="text-muted-foreground">
            Análisis y reportes actualizados cada 3 horas
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Clock className="h-3 w-3 mr-1" />
            Actualizado: 08:00
          </Badge>
          <Button 
            variant="outline"
            onClick={handleCustomReport}
            data-testid="button-custom-report"
          >
            Reporte Personalizado
          </Button>
        </div>
      </div>

      {/* Reportes Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {reportTypes.map((report) => (
              <div key={report.id} className="p-4 border rounded-lg hover-elevate">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{report.nombre}</h4>
                      <Badge 
                        variant="outline" 
                        className={getFrequencyColor(report.frecuencia)}
                      >
                        {report.frecuencia}
                      </Badge>
                      {!report.disponible && (
                        <Badge variant="secondary">En proceso</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última actualización: {report.ultimaActualizacion}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!report.disponible}
                      onClick={() => handleDownloadReport(report.id, "pdf")}
                      data-testid={`button-download-pdf-${report.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!report.disponible}
                      onClick={() => handleDownloadReport(report.id, "excel")}
                      data-testid={`button-download-excel-${report.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleScheduleReport(report.id)}
                      data-testid={`button-schedule-${report.id}`}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Programar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vista Previa de KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual de KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="prospectos" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="Prospectos"
                />
                <Line 
                  type="monotone" 
                  dataKey="inscritos" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Inscritos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversión por Origen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="origen" />
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
      </div>

      {/* Distribución de Fuentes */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Fuentes de Prospectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1">
              <div className="space-y-4">
                <h4 className="font-medium">Resumen de Fuentes</h4>
                {sourceData.map((source) => (
                  <div key={source.name} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm">{source.name}</span>
                    </div>
                    <Badge variant="outline">{source.value}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas en Tiempo Real */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 text-center border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">Prospectos Totales</p>
            </div>
            <div className="p-4 text-center border rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">187</p>
              <p className="text-sm text-muted-foreground">Inscritos del Mes</p>
            </div>
            <div className="p-4 text-center border rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">$89,500</p>
              <p className="text-sm text-muted-foreground">Inversión Marketing</p>
            </div>
            <div className="p-4 text-center border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">15.1%</p>
              <p className="text-sm text-muted-foreground">Tasa Conversión</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}