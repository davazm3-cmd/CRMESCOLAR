import { StatsCard } from "./stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  DollarSign, 
  Users,
  TrendingUp,
  Plus,
  Play,
  Pause,
  Eye
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
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
const activeCampaigns = [
  {
    id: 1,
    nombre: "Promoción Preparatoria 2024",
    canal: "Facebook Ads",
    presupuesto: 25000,
    gastado: 18500,
    prospectos: 324,
    inscritos: 46,
    costoProspecto: 57.10,
    costoInscrito: 402.17,
    roi: 285,
    estado: "Activa",
    fechaInicio: "2024-01-01",
    fechaFin: "2024-03-31"
  },
  {
    id: 2,
    nombre: "Universidad - Carreras Técnicas",
    canal: "Google Ads",
    presupuesto: 30000,
    gastado: 22100,
    prospectos: 198,
    inscritos: 31,
    costoProspecto: 111.62,
    costoInscrito: 712.90,
    roi: 312,
    estado: "Activa",
    fechaInicio: "2024-01-15",
    fechaFin: "2024-04-15"
  },
  {
    id: 3,
    nombre: "Programa de Becas",
    canal: "Redes Sociales",
    presupuesto: 15000,
    gastado: 12800,
    prospectos: 156,
    inscritos: 28,
    costoProspecto: 82.05,
    costoInscrito: 457.14,
    roi: 435,
    estado: "Pausada",
    fechaInicio: "2024-01-10",
    fechaFin: "2024-02-28"
  }
];

const originData = [
  { origen: "Facebook Ads", valor: 35, color: "#3b82f6" },
  { origen: "Google Ads", valor: 28, color: "#10b981" },
  { origen: "Redes Sociales", valor: 22, color: "#f59e0b" },
  { origen: "Referencias", valor: 15, color: "#ef4444" },
];

const performanceData = [
  { mes: "Ene", prospectos: 324, inscritos: 46, costo: 18500 },
  { mes: "Feb", prospectos: 298, inscritos: 52, costo: 22100 },
  { mes: "Mar", prospectos: 356, inscritos: 38, costo: 19800 },
  { mes: "Abr", prospectos: 412, inscritos: 61, costo: 24300 },
];

export function CampaignManager() {
  const handleCreateCampaign = () => {
    console.log("Creando nueva campaña");
  };

  const handleToggleCampaign = (campaignId: number, action: string) => {
    console.log(`${action} campaña ${campaignId}`);
  };

  const handleViewCampaign = (campaignId: number) => {
    console.log(`Viendo detalles de campaña ${campaignId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activa":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Pausada":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Finalizada":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const totalBudget = activeCampaigns.reduce((sum, camp) => sum + camp.presupuesto, 0);
  const totalSpent = activeCampaigns.reduce((sum, camp) => sum + camp.gastado, 0);
  const totalProspects = activeCampaigns.reduce((sum, camp) => sum + camp.prospectos, 0);
  const totalEnrolled = activeCampaigns.reduce((sum, camp) => sum + camp.inscritos, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-campaigns">
            Gestión de Campañas
          </h1>
          <p className="text-muted-foreground">
            Seguimiento de origen de prospectos y ROI de marketing
          </p>
        </div>
        <Button 
          onClick={handleCreateCampaign}
          data-testid="button-create-campaign"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Campaña
        </Button>
      </div>

      {/* KPIs Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Presupuesto Total"
          value={`$${totalBudget.toLocaleString()}`}
          icon={DollarSign}
          subtitle={`Gastado: $${totalSpent.toLocaleString()}`}
        />
        <StatsCard
          title="Total Prospectos"
          value={totalProspects.toString()}
          icon={Users}
          change={{ value: "+12% este mes", type: "positive" }}
        />
        <StatsCard
          title="Total Inscritos"
          value={totalEnrolled.toString()}
          icon={Target}
          change={{ value: "+8% este mes", type: "positive" }}
        />
        <StatsCard
          title="ROI Promedio"
          value="344%"
          icon={TrendingUp}
          change={{ value: "+15% vs mes anterior", type: "positive" }}
        />
      </div>

      {/* Gráficos de Desempeño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Origen</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Desempeño Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
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
      </div>

      {/* Lista de Campañas Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border rounded-lg hover-elevate">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{campaign.nombre}</h4>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(campaign.estado)}
                      >
                        {campaign.estado}
                      </Badge>
                      <Badge variant="secondary">
                        {campaign.canal}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Presupuesto</p>
                        <p className="font-medium">${campaign.presupuesto.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gastado</p>
                        <p className="font-medium">${campaign.gastado.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prospectos</p>
                        <p className="font-medium">{campaign.prospectos}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Inscritos</p>
                        <p className="font-medium">{campaign.inscritos}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground">Costo por Prospecto</p>
                        <p className="font-medium">${campaign.costoProspecto}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costo por Inscrito</p>
                        <p className="font-medium">${campaign.costoInscrito}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className="font-medium text-green-600">{campaign.roi}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewCampaign(campaign.id)}
                      data-testid={`button-view-campaign-${campaign.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {campaign.estado === "Activa" ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleCampaign(campaign.id, "pausar")}
                        data-testid={`button-pause-campaign-${campaign.id}`}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleCampaign(campaign.id, "reanudar")}
                        data-testid={`button-resume-campaign-${campaign.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Reanudar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Análisis Detallado */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado de ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeCampaigns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="roi" 
                fill="hsl(var(--chart-1))" 
                name="ROI (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}