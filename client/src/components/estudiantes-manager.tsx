import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Users, 
  GraduationCap, 
  Calendar, 
  Mail, 
  Phone,
  MapPin,
  BookOpen,
  Clock,
  Monitor
} from 'lucide-react';
import type { Estudiante } from '@shared/schema';

export default function EstudiantesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalityFilter, setModalityFilter] = useState<string>('todas');

  // Query para obtener estudiantes
  const { data: estudiantes = [], isLoading, error } = useQuery<Estudiante[]>({
    queryKey: ['/api/estudiantes'],
  });

  // Filtrar estudiantes según criterios
  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter(estudiante => {
      const matchesSearch = 
        estudiante.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.nivelEducativo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || estudiante.estado === statusFilter;
      const matchesModality = modalityFilter === 'todas' || estudiante.modalidad === modalityFilter;
      
      return matchesSearch && matchesStatus && matchesModality;
    });
  }, [estudiantes, searchTerm, statusFilter, modalityFilter]);

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'activo': 'default',
      'suspendido': 'secondary', 
      'graduado': 'secondary',
      'retirado': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'default'}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const getModalidadIcon = (modalidad: string) => {
    switch (modalidad) {
      case 'presencial':
        return <MapPin className="h-4 w-4" />;
      case 'virtual':
        return <Monitor className="h-4 w-4" />;
      case 'hibrida':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const formatFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Estadísticas rápidas
  const stats = useMemo(() => {
    return {
      total: estudiantes.length,
      activos: estudiantes.filter(e => e.estado === 'activo').length,
      graduados: estudiantes.filter(e => e.estado === 'graduado').length,
      suspendidos: estudiantes.filter(e => e.estado === 'suspendido').length,
    };
  }, [estudiantes]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar estudiantes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-estudiantes">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Estudiantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-activos">{stats.activos}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-graduados">{stats.graduados}</p>
                <p className="text-xs text-muted-foreground">Graduados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-suspendidos">{stats.suspendidos}</p>
                <p className="text-xs text-muted-foreground">Suspendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Estudiantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por matrícula, programa o nivel educativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-estudiantes"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filtro-estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="graduado">Graduado</SelectItem>
                <SelectItem value="retirado">Retirado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filtro-modalidad">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las modalidades</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hibrida">Híbrida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes Matriculados</CardTitle>
          <CardDescription>
            Lista completa de estudiantes registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando estudiantes...
            </div>
          ) : filteredEstudiantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
              {searchTerm || statusFilter !== 'todos' || modalityFilter !== 'todas' 
                ? 'No se encontraron estudiantes que coincidan con los filtros' 
                : 'No hay estudiantes registrados aún'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEstudiantes.map((estudiante) => (
                <div key={estudiante.id} 
                     className="border rounded-lg p-4 hover-elevate transition-colors"
                     data-testid={`card-estudiante-${estudiante.id}`}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* Info básica */}
                    <div className="md:col-span-2">
                      <div className="font-semibold" data-testid={`text-matricula-${estudiante.id}`}>
                        {estudiante.matricula}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {estudiante.nivelEducativo}
                      </div>
                    </div>
                    
                    {/* Programa y modalidad */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-1">
                        {getModalidadIcon(estudiante.modalidad)}
                        <span className="text-sm font-medium">{estudiante.programa}</span>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {estudiante.modalidad}
                      </div>
                    </div>
                    
                    {/* Fechas */}
                    <div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Inicio: </span>
                        {formatFecha(estudiante.fechaInicio)}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Matrícula: </span>
                        {formatFecha(estudiante.fechaMatricula!)}
                      </div>
                    </div>
                    
                    {/* Estado y acciones */}
                    <div className="flex flex-col items-end space-y-2">
                      {getEstadoBadge(estudiante.estado)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-ver-estudiante-${estudiante.id}`}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}