import { StatsCard } from "./stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Download,
  Calendar
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

//todo: remove mock data functionality
const weeklyData = [
  { semana: "Sem 1", inscritos: 45, datos: 120 },
  { semana: "Sem 2", inscritos: 52, datos: 98 },
  { semana: "Sem 3", inscritos: 38, datos: 156 },
  { semana: "Sem 4", inscritos: 61, datos: 134 },
];

const advisorData = [
  { asesor: "María García", inscritos: 28 },
  { asesor: "Carlos López", inscritos: 24 },
  { asesor: "Ana Martínez", inscritos: 19 },
  { asesor: "Luis Rodríguez", inscritos: 16 },
];

const originData = [
  { origen: "Redes Sociales", valor: 35, color: "#8884d8" },
  { origen: "Referencias", valor: 28, color: "#82ca9d" },
  { origen: "Publicidad Web", valor: 22, color: "#ffc658" },
  { origen: "Eventos", valor: 15, color: "#ff7300" },
];

export function DirectorDashboard() {
  const handleExportReport = (reportType: string) => {
    console.log(`Exportando reporte: ${reportType}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-director">
            Dashboard Director
          </h1>
          <p className="text-muted-foreground">
            Vista ejecutiva y análisis comparativos
          </p>
        </div>
        <Button 
          onClick={() => handleExportReport("ejecutivo")}
          data-testid="button-export-executive"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Inscritos del Mes"
          value="196"
          icon={Users}
          change={{ value: "+12% vs mes anterior", type: "positive" }}
        />
        <StatsCard
          title="Tasa de Conversión"
          value="14.2%"
          icon={TrendingUp}
          change={{ value: "+2.3% vs mes anterior", type: "positive" }}
        />
        <StatsCard
          title="Costo por Inscrito"
          value="$2,450"
          icon={DollarSign}
          change={{ value: "-8% vs mes anterior", type: "positive" }}
        />
        <StatsCard
          title="ROI de Campañas"
          value="340%"
          icon={Target}
          change={{ value: "+15% vs mes anterior", type: "positive" }}
        />
      </div>

      {/* Gráficos Comparativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Comportamiento Semanal: Datos vs Inscritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="inscritos" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="Inscritos"
                />
                <Line 
                  type="monotone" 
                  dataKey="datos" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Datos Recibidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análisis de Orígenes de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={originData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {originData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparación entre Asesores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Comparación Mensual: Inscritos por Asesor</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExportReport("asesores")}
            data-testid="button-export-advisors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={advisorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asesor" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="inscritos" 
                fill="hsl(var(--chart-1))" 
                name="Inscritos"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de Costos e Inversión */}
      <Card>
        <CardHeader>
          <CardTitle>Costo Mensual: Datos vs Inversión Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Canal</th>
                  <th className="text-left p-2">Datos Obtenidos</th>
                  <th className="text-left p-2">Inversión ($)</th>
                  <th className="text-left p-2">Costo por Dato</th>
                  <th className="text-left p-2">Inscritos</th>
                  <th className="text-left p-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Facebook Ads</td>
                  <td className="p-2">324</td>
                  <td className="p-2">$28,500</td>
                  <td className="p-2">$87.96</td>
                  <td className="p-2">46</td>
                  <td className="p-2 text-green-600">285%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Google Ads</td>
                  <td className="p-2">198</td>
                  <td className="p-2">$22,100</td>
                  <td className="p-2">$111.62</td>
                  <td className="p-2">31</td>
                  <td className="p-2 text-green-600">312%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Referencias</td>
                  <td className="p-2">89</td>
                  <td className="p-2">$8,200</td>
                  <td className="p-2">$92.13</td>
                  <td className="p-2">28</td>
                  <td className="p-2 text-green-600">435%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}