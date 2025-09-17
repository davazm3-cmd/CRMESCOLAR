import { StatsCard } from "./stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Plus,
  Search
} from "lucide-react";
import { useState } from "react";

//todo: remove mock data functionality
const prospects = [
  {
    id: 1,
    nombre: "Ana Patricia Jiménez",
    telefono: "+52 55 1234-5678",
    email: "ana.jimenez@email.com",
    nivelEducativo: "Preparatoria",
    origen: "Facebook Ads",
    estatus: "Cita Agendada",
    fechaCita: "2024-01-15 10:00",
    tiempoRespuesta: "2h",
    prioridad: "alta"
  },
  {
    id: 2,
    nombre: "Carlos Eduardo Mendoza",
    telefono: "+52 55 9876-5432",
    email: "carlos.mendoza@email.com",
    nivelEducativo: "Universidad",
    origen: "Google Ads",
    estatus: "Seguimiento",
    fechaCita: "2024-01-16 14:30",
    tiempoRespuesta: "1.5h",
    prioridad: "media"
  },
  {
    id: 3,
    nombre: "María Elena Vásquez",
    telefono: "+52 55 5555-1111",
    email: "maria.vasquez@email.com",
    nivelEducativo: "Secundaria",
    origen: "Referencias",
    estatus: "Primer Contacto",
    fechaCita: null,
    tiempoRespuesta: "3h",
    prioridad: "alta"
  },
];

const upcomingAppointments = [
  {
    id: 1,
    prospecto: "Ana Patricia Jiménez",
    fecha: "Hoy 10:00",
    tipo: "Presencial",
    estatus: "Confirmada"
  },
  {
    id: 2,
    prospecto: "Carlos Eduardo Mendoza",
    fecha: "Mañana 14:30",
    tipo: "Video Llamada",
    estatus: "Pendiente"
  },
  {
    id: 3,
    prospecto: "Roberto Silva",
    fecha: "Mañana 16:00",
    tipo: "Llamada",
    estatus: "Confirmada"
  },
];

export function AsesorDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<number | null>(null);

  const handleContactProspect = (prospectId: number, method: string) => {
    console.log(`Contactando prospecto ${prospectId} via ${method}`);
  };

  const handleScheduleAppointment = (prospectId: number) => {
    console.log(`Agendando cita con prospecto ${prospectId}`);
  };

  const handleAddNewProspect = () => {
    console.log("Agregando nuevo prospecto");
  };

  const filteredProspects = prospects.filter(prospect =>
    prospect.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prospect.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "media":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-asesor">
            Dashboard Asesor Educativo
          </h1>
          <p className="text-muted-foreground">
            Gestión de prospectos y seguimiento de citas
          </p>
        </div>
        <Button 
          onClick={handleAddNewProspect}
          data-testid="button-add-prospect"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Prospecto
        </Button>
      </div>

      {/* KPIs Personales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Mis Prospectos"
          value="23"
          icon={Users}
          subtitle="Activos en seguimiento"
        />
        <StatsCard
          title="Citas Esta Semana"
          value="12"
          icon={Calendar}
          change={{ value: "+3 vs sem anterior", type: "positive" }}
        />
        <StatsCard
          title="Tasa Conversión"
          value="68.2%"
          icon={Clock}
          change={{ value: "+5.2% vs mes anterior", type: "positive" }}
        />
        <StatsCard
          title="Tiempo Respuesta Prom."
          value="1.8h"
          icon={Phone}
          change={{ value: "-0.3h vs sem anterior", type: "positive" }}
        />
      </div>

      {/* Citas Próximas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mis Próximas Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium">{appointment.prospecto}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.fecha} - {appointment.tipo}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={appointment.estatus === "Confirmada" ? "default" : "secondary"}
                  className={appointment.estatus === "Confirmada" ? "bg-green-500" : "bg-yellow-500"}
                >
                  {appointment.estatus}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Prospectos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Mis Prospectos
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prospecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search-prospects"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProspects.map((prospect) => (
              <div 
                key={prospect.id} 
                className={`p-4 border rounded-lg hover-elevate cursor-pointer ${
                  selectedProspect === prospect.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProspect(prospect.id)}
                data-testid={`card-prospect-${prospect.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{prospect.nombre}</h4>
                      <Badge 
                        variant="outline" 
                        className={getPriorityColor(prospect.prioridad)}
                      >
                        {prospect.prioridad.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {prospect.estatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>📞 {prospect.telefono}</p>
                      <p>✉️ {prospect.email}</p>
                      <p>🎓 {prospect.nivelEducativo}</p>
                      <p>📈 {prospect.origen}</p>
                      {prospect.fechaCita && (
                        <p>📅 {prospect.fechaCita}</p>
                      )}
                      <p>⏱️ Respuesta: {prospect.tiempoRespuesta}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactProspect(prospect.id, "phone");
                      }}
                      data-testid={`button-call-${prospect.id}`}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Llamar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactProspect(prospect.id, "whatsapp");
                      }}
                      data-testid={`button-whatsapp-${prospect.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactProspect(prospect.id, "email");
                      }}
                      data-testid={`button-email-${prospect.id}`}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    {!prospect.fechaCita && (
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAppointment(prospect.id);
                        }}
                        data-testid={`button-schedule-${prospect.id}`}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Agendar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}