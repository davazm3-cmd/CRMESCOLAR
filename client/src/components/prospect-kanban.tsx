import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  User,
  Calendar,
  GraduationCap,
  MoreVertical
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  rectIntersection,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Definir las etapas del pipeline
const PIPELINE_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100' },
  { id: 'primer_contacto', label: 'Primer Contacto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  { id: 'cita_agendada', label: 'Cita Agendada', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
  { id: 'documentos', label: 'Documentos', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' },
  { id: 'admitido', label: 'Admitido', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  { id: 'matriculado', label: 'Matriculado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' }
];

interface Prospecto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  nivelEducativo: string;
  origen: string;
  estatus: string;
  prioridad: string;
  asesorId?: string;
  fechaRegistro: string;
  ultimaInteraccion?: string;
  notas?: string;
}

interface ProspectCardProps {
  prospecto: Prospecto;
  isDragging?: boolean;
}

function ProspectCard({ prospecto, isDragging = false }: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: prospecto.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'border-l-red-500';
      case 'media':
        return 'border-l-amber-500';
      case 'baja':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const getNivelIcon = (nivel: string) => {
    return <GraduationCap className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing border-l-4 ${getPriorityColor(prospecto.prioridad)} hover-elevate`}
      {...attributes}
      {...listeners}
      data-testid={`prospect-card-${prospecto.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate" data-testid="prospect-name">
              {prospecto.nombre}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1">
              {getNivelIcon(prospecto.nivelEducativo)}
              <span className="text-xs text-muted-foreground truncate" data-testid="prospect-nivel">
                {prospecto.nivelEducativo}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Información de contacto */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate" data-testid="prospect-email">{prospecto.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="truncate" data-testid="prospect-telefono">{prospecto.telefono}</span>
            </div>
          </div>

          {/* Metadatos */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {prospecto.origen}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(prospecto.fechaRegistro)}
            </span>
          </div>

          {/* Asesor */}
          {prospecto.asesorId && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {prospecto.asesorId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                Asesor asignado
              </span>
            </div>
          )}

          {/* Notas */}
          {prospecto.notas && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {prospecto.notas}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  stage: typeof PIPELINE_STAGES[0];
  prospectos: Prospecto[];
  isOver?: boolean;
}

function KanbanColumn({ stage, prospectos, isOver }: KanbanColumnProps) {
  const { isOver: isDroppableOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-full min-w-72 transition-colors duration-200 ${
        isDroppableOver || isOver ? 'bg-muted/50 ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm" data-testid={`column-title-${stage.id}`}>
              {stage.label}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {prospectos.length}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <SortableContext items={prospectos.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {prospectos.map((prospecto) => (
            <ProspectCard key={prospecto.id} prospecto={prospecto} />
          ))}
        </SortableContext>
        
        {prospectos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay prospectos</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProspectKanbanProps {
  className?: string;
  prospects?: Prospecto[];
}

export function ProspectKanban({ className, prospects = [] }: ProspectKanbanProps) {
  const { toast } = useToast();
  const [activeProspect, setActiveProspect] = useState<Prospecto | null>(null);
  const [prospectos, setProspectos] = useState<Prospecto[]>(prospects);

  // Actualizar prospectos cuando cambian las props
  useEffect(() => {
    setProspectos(prospects);
  }, [prospects]);

  // Función para actualizar estatus del prospecto localmente
  const updateProspectoStatus = (id: string, newStatus: string) => {
    setProspectos(prevProspectos => 
      prevProspectos.map(p => 
        p.id === id ? { ...p, estatus: newStatus } : p
      )
    );
    toast({
      title: "Prospecto actualizado",
      description: "El estatus del prospecto ha sido actualizado exitosamente."
    });
  };

  // Configurar sensores de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Organizar prospectos por etapa
  const prospectosPorEtapa = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = prospectos.filter(p => p.estatus === stage.id);
    return acc;
  }, {} as Record<string, Prospecto[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const prospecto = prospectos.find(p => p.id === event.active.id);
    setActiveProspect(prospecto || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Aquí podríamos agregar lógica adicional si necesitamos
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProspect(null);

    const { active, over } = event;
    
    if (!over) return;

    const prospectoId = active.id as string;
    let newStage = over.id as string;

    // Si over.id es un card ID (no un column ID), necesitamos resolver el container
    const validStage = PIPELINE_STAGES.find(stage => stage.id === newStage);
    if (!validStage) {
      // over.id es probablemente un card ID, buscar el container correcto
      const droppedOnCard = prospectos.find(p => p.id === newStage);
      if (droppedOnCard) {
        // Usar el estatus del card sobre el que se droppeó como el nuevo stage
        newStage = droppedOnCard.estatus;
      } else {
        // Si aún no encontramos un stage válido, salir
        return;
      }
    }

    // Verificar nuevamente que tengamos un stage válido
    const finalValidStage = PIPELINE_STAGES.find(stage => stage.id === newStage);
    if (!finalValidStage) return;

    // Encontrar el prospecto que se está moviendo
    const prospecto = prospectos.find(p => p.id === prospectoId);
    if (!prospecto || prospecto.estatus === newStage) return;

    // Actualizar estatus
    updateProspectoStatus(prospectoId, newStage);
  };

  if (prospectos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No hay prospectos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4" data-testid="kanban-board">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.id}
              id={stage.id}
              className="flex-shrink-0"
              data-testid={`kanban-column-${stage.id}`}
            >
              <KanbanColumn
                stage={stage}
                prospectos={prospectosPorEtapa[stage.id] || []}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <ProspectCard prospecto={activeProspect} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}