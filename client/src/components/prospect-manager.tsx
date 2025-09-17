import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  UserPlus,
  Phone,
  Mail,
  MessageCircle,
  Calendar
} from "lucide-react";
import { useState } from "react";

//todo: remove mock data functionality
const allProspects = [
  {
    id: 1,
    nombre: "Ana Patricia Jiménez",
    telefono: "+52 55 1234-5678",
    email: "ana.jimenez@email.com",
    nivelEducativo: "Preparatoria",
    origen: "Facebook Ads",
    estatus: "Cita Agendada",
    asesor: "María García",
    fechaRegistro: "2024-01-10",
    ultimaInteraccion: "2024-01-14"
  },
  {
    id: 2,
    nombre: "Carlos Eduardo Mendoza",
    telefono: "+52 55 9876-5432",
    email: "carlos.mendoza@email.com",
    nivelEducativo: "Universidad",
    origen: "Google Ads",
    estatus: "Seguimiento",
    asesor: "Carlos López",
    fechaRegistro: "2024-01-11",
    ultimaInteraccion: "2024-01-13"
  },
  {
    id: 3,
    nombre: "María Elena Vásquez",
    telefono: "+52 55 5555-1111",
    email: "maria.vasquez@email.com",
    nivelEducativo: "Secundaria",
    origen: "Referencias",
    estatus: "Primer Contacto",
    asesor: "Ana Martínez",
    fechaRegistro: "2024-01-12",
    ultimaInteraccion: "2024-01-12"
  },
  {
    id: 4,
    nombre: "Roberto Silva Morales",
    telefono: "+52 55 7777-8888",
    email: "roberto.silva@email.com",
    nivelEducativo: "Universidad",
    origen: "Redes Sociales",
    estatus: "Inscrito",
    asesor: "Luis Rodríguez",
    fechaRegistro: "2024-01-05",
    ultimaInteraccion: "2024-01-14"
  },
  {
    id: 5,
    nombre: "Sofía Hernández López",
    telefono: "+52 55 3333-2222",
    email: "sofia.hernandez@email.com",
    nivelEducativo: "Preparatoria",
    origen: "Eventos",
    estatus: "No Interesado",
    asesor: "María García",
    fechaRegistro: "2024-01-08",
    ultimaInteraccion: "2024-01-10"
  }
];

export function ProspectManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);

  const statusOptions = ["Todos", "Primer Contacto", "Seguimiento", "Cita Agendada", "Inscrito", "No Interesado"];

  const filteredProspects = allProspects.filter(prospect => {
    const matchesSearch = prospect.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Todos" || prospect.estatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddProspect = () => {
    console.log("Agregando nuevo prospecto");
  };

  const handleExportData = () => {
    console.log("Exportando datos de prospectos");
  };

  const handleContactProspect = (prospectId: number, method: string) => {
    console.log(`Contactando prospecto ${prospectId} via ${method}`);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Acción masiva: ${action} en prospectos:`, selectedProspects);
  };

  const toggleProspectSelection = (prospectId: number) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId) 
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Inscrito":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Cita Agendada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Seguimiento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "No Interesado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title-prospects">
            Gestión de Prospectos
          </h1>
          <p className="text-muted-foreground">
            Administración centralizada de todos los prospectos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportData}
            data-testid="button-export-prospects"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleAddProspect}
            data-testid="button-add-prospect"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Prospecto
          </Button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-all-prospects"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:w-48"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                data-testid="select-filter-status"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Button variant="outline" data-testid="button-advanced-filters">
                <Filter className="h-4 w-4 mr-2" />
                Más Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones Masivas */}
      {selectedProspects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedProspects.length} prospecto(s) seleccionado(s)
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction("asignar")}
                  data-testid="button-bulk-assign"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Asignar Asesor
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction("exportar")}
                  data-testid="button-bulk-export"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar Selección
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProspects([])}
                  data-testid="button-clear-selection"
                >
                  Limpiar Selección
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Prospectos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Prospectos ({filteredProspects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProspects.map((prospect) => (
              <div 
                key={prospect.id} 
                className={`p-4 border rounded-lg hover-elevate ${
                  selectedProspects.includes(prospect.id) ? 'ring-2 ring-primary' : ''
                }`}
                data-testid={`card-prospect-${prospect.id}`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedProspects.includes(prospect.id)}
                    onChange={() => toggleProspectSelection(prospect.id)}
                    className="h-4 w-4"
                    data-testid={`checkbox-prospect-${prospect.id}`}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{prospect.nombre}</h4>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(prospect.estatus)}
                      >
                        {prospect.estatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <p>📞 {prospect.telefono}</p>
                        <p>✉️ {prospect.email}</p>
                      </div>
                      <div>
                        <p>🎓 {prospect.nivelEducativo}</p>
                        <p>📈 Origen: {prospect.origen}</p>
                      </div>
                      <div>
                        <p>👨‍💼 Asesor: {prospect.asesor}</p>
                        <p>📅 Registro: {prospect.fechaRegistro}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleContactProspect(prospect.id, "phone")}
                      data-testid={`button-call-prospect-${prospect.id}`}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Llamar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleContactProspect(prospect.id, "whatsapp")}
                      data-testid={`button-whatsapp-prospect-${prospect.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleContactProspect(prospect.id, "email")}
                      data-testid={`button-email-prospect-${prospect.id}`}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
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