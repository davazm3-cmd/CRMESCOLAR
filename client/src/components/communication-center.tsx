import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  User,
  Send,
  Plus,
  Filter
} from "lucide-react";
import { useState } from "react";

//todo: remove mock data functionality  
const communications = [
  {
    id: 1,
    prospecto: "Ana Patricia Jiménez",
    tipo: "Llamada",
    fecha: "2024-01-14 10:30",
    asesor: "María García",
    duracion: "15 min",
    resultado: "Cita agendada para mañana",
    estado: "Completado"
  },
  {
    id: 2,
    prospecto: "Carlos Eduardo Mendoza",
    tipo: "WhatsApp",
    fecha: "2024-01-14 09:45",
    asesor: "Carlos López",
    duracion: "5 min",
    resultado: "Envió documentos solicitados",
    estado: "Pendiente respuesta"
  },
  {
    id: 3,
    prospecto: "María Elena Vásquez",
    tipo: "Email",
    fecha: "2024-01-13 16:20",
    asesor: "Ana Martínez",
    duracion: "-",
    resultado: "Información sobre becas enviada",
    estado: "Entregado"
  },
  {
    id: 4,
    prospecto: "Roberto Silva Morales",
    tipo: "Llamada",
    fecha: "2024-01-13 14:15",
    asesor: "Luis Rodríguez",
    duracion: "25 min",
    resultado: "Confirmó inscripción",
    estado: "Completado"
  }
];

const internalMessages = [
  {
    id: 1,
    remitente: "Dir. Académico",
    destinatario: "Equipo Admisiones",
    asunto: "Nueva promoción de becas",
    mensaje: "Se aprobó promoción especial del 20% para nuevos estudiantes de preparatoria",
    fecha: "2024-01-14 11:00",
    prioridad: "Alta"
  },
  {
    id: 2,
    remitente: "María García",
    destinatario: "Carlos López",
    asunto: "Seguimiento prospecto Jiménez",
    mensaje: "El prospecto Ana Jiménez preguntó por los horarios de clases vespertinas",
    fecha: "2024-01-14 09:30",
    prioridad: "Media"
  }
];

export function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("historial");
  const [newMessage, setNewMessage] = useState("");
  const [selectedProspect, setSelectedProspect] = useState("");
  const [communicationType, setCommunicationType] = useState("phone");

  const handleSendCommunication = () => {
    console.log(`Enviando ${communicationType} a ${selectedProspect}: ${newMessage}`);
    setNewMessage("");
    setSelectedProspect("");
  };

  const handleViewCommunication = (commId: number) => {
    console.log(`Viendo detalles de comunicación ${commId}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Llamada":
        return <Phone className="h-4 w-4" />;
      case "WhatsApp":
        return <MessageCircle className="h-4 w-4" />;
      case "Email":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Entregado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Pendiente respuesta":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Media":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-communications">
            Centro de Comunicaciones
          </h1>
          <p className="text-muted-foreground">
            Gestión de llamadas, emails y mensajes internos
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeTab === "historial" ? "default" : "ghost"}
          onClick={() => setActiveTab("historial")}
          data-testid="button-tab-history"
        >
          Historial de Comunicaciones
        </Button>
        <Button
          variant={activeTab === "nuevo" ? "default" : "ghost"}
          onClick={() => setActiveTab("nuevo")}
          data-testid="button-tab-new"
        >
          Nueva Comunicación
        </Button>
        <Button
          variant={activeTab === "interno" ? "default" : "ghost"}
          onClick={() => setActiveTab("interno")}
          data-testid="button-tab-internal"
        >
          Mensajes Internos
        </Button>
      </div>

      {/* Historial de Comunicaciones */}
      {activeTab === "historial" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Historial de Comunicaciones</CardTitle>
            <Button variant="outline" size="sm" data-testid="button-filter-communications">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communications.map((comm) => (
                <div key={comm.id} className="p-4 border rounded-lg hover-elevate">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(comm.tipo)}
                      <div>
                        <h4 className="font-medium">{comm.prospecto}</h4>
                        <p className="text-sm text-muted-foreground">
                          {comm.asesor} • {comm.fecha}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(comm.estado)}>
                        {comm.estado}
                      </Badge>
                      {comm.duracion !== "-" && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {comm.duracion}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">{comm.resultado}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewCommunication(comm.id)}
                      data-testid={`button-view-comm-${comm.id}`}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nueva Comunicación */}
      {activeTab === "nuevo" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nueva Comunicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prospecto</label>
                  <Input
                    placeholder="Buscar prospecto..."
                    value={selectedProspect}
                    onChange={(e) => setSelectedProspect(e.target.value)}
                    data-testid="input-select-prospect"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Comunicación</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={communicationType}
                    onChange={(e) => setCommunicationType(e.target.value)}
                    data-testid="select-communication-type"
                  >
                    <option value="phone">Llamada Telefónica</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Correo Electrónico</option>
                    <option value="visit">Visita Presencial</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Mensaje / Notas</label>
                <Textarea
                  placeholder="Describe el resultado de la comunicación..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-communication-notes"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" data-testid="button-cancel-communication">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendCommunication}
                  data-testid="button-save-communication"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Guardar Comunicación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensajes Internos */}
      {activeTab === "interno" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mensajes Internos del Equipo
                <Button size="sm" data-testid="button-new-internal-message">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Mensaje
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {internalMessages.map((message) => (
                  <div key={message.id} className="p-4 border rounded-lg hover-elevate">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{message.asunto}</h4>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(message.prioridad)}
                          >
                            {message.prioridad}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          De: {message.remitente} → Para: {message.destinatario}
                        </p>
                        <p className="text-sm">{message.mensaje}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.fecha}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}