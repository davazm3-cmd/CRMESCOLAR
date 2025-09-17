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
  Calendar,
  List,
  LayoutGrid,
  GraduationCap,
  TrendingUp,
  UserCheck,
  FileCheck
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProspectKanban } from "./prospect-kanban";
import type { Prospecto } from "@shared/schema";

export function ProspectManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const statusOptions = ["Todos", "Nuevo", "Primer Contacto", "Cita Agendada", "Documentos", "Admitido", "Matriculado"];

  // Mapear nombres de estatus para display
  const statusDisplayMap = {
    "nuevo": "Nuevo",
    "primer_contacto": "Primer Contacto",
    "cita_agendada": "Cita Agendada",
    "documentos": "Documentos",
    "admitido": "Admitido",
    "matriculado": "Matriculado"
  } as const;

  // Query para obtener prospectos reales
  const { data: allProspects = [], isLoading, error } = useQuery<Prospecto[]>({
    queryKey: ["/api/prospectos"],
    staleTime: 30000
  });

  const filteredProspects = allProspects.filter(prospect => {
    const matchesSearch = prospect.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Todos" || statusDisplayMap[prospect.estatus as keyof typeof statusDisplayMap] === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddProspect = () => {
    console.log("Agregando nuevo prospecto");
  };

  const handleExportData = () => {
    console.log("Exportando datos de prospectos");
  };

  const handleContactProspect = (prospectId: string, method: string) => {
    console.log(`Contactando prospecto ${prospectId} via ${method}`);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Acción masiva: ${action} en prospectos:`, selectedProspects);
  };

  const toggleProspectSelection = (prospectId: string) => {
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
          {/* Toggle de vista */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              data-testid="button-view-kanban"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Tablero
            </Button>
          </div>
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

      {/* Vista condicional: Lista o Kanban */}
      {viewMode === 'list' ? (
        /* Vista Lista */
        <Card>
          <CardHeader>
            <CardTitle>
              Prospectos ({isLoading ? '...' : filteredProspects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando prospectos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error al cargar prospectos</p>
              </div>
            ) : filteredProspects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay prospectos que coincidan con los filtros</p>
              </div>
            ) : (
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
                          className={getStatusColor(statusDisplayMap[prospect.estatus as keyof typeof statusDisplayMap])}
                        >
                          {statusDisplayMap[prospect.estatus as keyof typeof statusDisplayMap]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <p className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {prospect.telefono}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {prospect.email}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2">
                            <GraduationCap className="h-3 w-3" />
                            {prospect.nivelEducativo}
                          </p>
                          <p className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            Origen: {prospect.origen}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2">
                            <UserCheck className="h-3 w-3" />
                            Asesor: {prospect.asesorId || 'Sin asignar'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Registro: {prospect.fechaRegistro ? new Date(prospect.fechaRegistro).toLocaleDateString() : 'N/A'}
                          </p>
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
                      {/* Botón para proceso de admisión - solo visible para etapas apropiadas */}
                      {['cita_agendada', 'documentos', 'admitido', 'matriculado'].includes(prospect.estatus) && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setLocation(`/proceso-admision/${prospect.id}`)}
                          data-testid={`button-proceso-admision-${prospect.id}`}
                        >
                          <FileCheck className="h-4 w-4 mr-1" />
                          Proceso Admisión
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vista Kanban */
        <Card className="h-[calc(100vh-300px)]">
          <CardHeader>
            <CardTitle>
              Pipeline de Prospectos ({filteredProspects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ProspectKanban className="h-full" prospects={filteredProspects} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}