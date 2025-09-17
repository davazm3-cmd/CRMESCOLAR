import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Copy,
  Link,
  QrCode,
  Users,
  Settings
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Esquemas de validación para formularios
const formularioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  nivelEducativo: z.enum(["primaria", "secundaria", "preparatoria", "universidad"]),
  activo: z.boolean().default(true),
  configuracion: z.object({
    mostrarTelefono: z.boolean().default(true),
    mostrarNivelEducativo: z.boolean().default(true),
    camposExtra: z.array(z.string()).default([]),
    mensajeBienvenida: z.string().default("¡Bienvenido! Completa este formulario para comenzar tu proceso de admisión."),
    mensajeExito: z.string().default("¡Gracias! Hemos recibido tu información. Nos contactaremos contigo pronto.")
  }).default({})
});

type FormularioFormData = z.infer<typeof formularioSchema>;

interface FormularioPublico {
  id: string;
  nombre: string;
  descripcion?: string;
  nivelEducativo: string;
  enlace: string;
  activo: boolean;
  configuracion: any;
  fechaCreacion: string;
}

export default function FormulariosPublicosManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormulario, setEditingFormulario] = useState<FormularioPublico | null>(null);
  const [selectedNivel, setSelectedNivel] = useState<string>("");

  // Query para obtener formularios públicos
  const { data: formularios = [], isLoading } = useQuery<FormularioPublico[]>({
    queryKey: ["/api/formularios-publicos"],
    staleTime: 30000
  });

  // Mutation para crear formulario
  const createMutation = useMutation({
    mutationFn: (data: FormularioFormData) => apiRequest("POST", "/api/formularios-publicos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formularios-publicos"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Formulario público creado",
        description: "El formulario ha sido creado exitosamente."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el formulario público.",
        variant: "destructive"
      });
    }
  });

  // Mutation para actualizar formulario
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormularioFormData> }) => 
      apiRequest("PUT", `/api/formularios-publicos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formularios-publicos"] });
      setIsDialogOpen(false);
      setEditingFormulario(null);
      form.reset();
      toast({
        title: "Formulario actualizado",
        description: "El formulario ha sido actualizado exitosamente."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el formulario.",
        variant: "destructive"
      });
    }
  });

  // Mutation para eliminar formulario
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/formularios-publicos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formularios-publicos"] });
      toast({
        title: "Formulario eliminado",
        description: "El formulario ha sido eliminado exitosamente."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el formulario.",
        variant: "destructive"
      });
    }
  });

  // Configuración del formulario
  const form = useForm<FormularioFormData>({
    resolver: zodResolver(formularioSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      nivelEducativo: "preparatoria",
      activo: true,
      configuracion: {
        mostrarTelefono: true,
        mostrarNivelEducativo: true,
        camposExtra: [],
        mensajeBienvenida: "¡Bienvenido! Completa este formulario para comenzar tu proceso de admisión.",
        mensajeExito: "¡Gracias! Hemos recibido tu información. Nos contactaremos contigo pronto."
      }
    }
  });

  const handleSubmit = (data: FormularioFormData) => {
    if (editingFormulario) {
      updateMutation.mutate({ id: editingFormulario.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (formulario: FormularioPublico) => {
    setEditingFormulario(formulario);
    form.reset({
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || "",
      nivelEducativo: formulario.nivelEducativo as any,
      activo: formulario.activo,
      configuracion: formulario.configuracion || {}
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este formulario público?")) {
      deleteMutation.mutate(id);
    }
  };

  const copyToClipboard = (enlace: string) => {
    const fullUrl = `${window.location.origin}/form/${enlace}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Enlace copiado",
      description: "El enlace del formulario ha sido copiado al portapapeles."
    });
  };

  const handleNewFormulario = () => {
    setEditingFormulario(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Filtrar formularios por nivel educativo
  const filteredFormularios = selectedNivel 
    ? formularios.filter((f: FormularioPublico) => f.nivelEducativo === selectedNivel)
    : formularios;

  const getEstadoBadge = (activo: boolean) => {
    return activo ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inactivo
      </Badge>
    );
  };

  const getNivelBadge = (nivel: string) => {
    const colores = {
      primaria: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      secundaria: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      preparatoria: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
      universidad: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
    
    return (
      <Badge variant="outline" className={colores[nivel as keyof typeof colores] || ""}>
        {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Formularios Públicos</h2>
          <p className="text-muted-foreground">
            Gestiona formularios de captura de leads para diferentes niveles educativos
          </p>
        </div>
        <Button onClick={handleNewFormulario} data-testid="button-nuevo-formulario">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Formulario
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Label htmlFor="nivel-filter">Filtrar por nivel:</Label>
            <Select value={selectedNivel} onValueChange={setSelectedNivel}>
              <SelectTrigger className="w-48" data-testid="select-nivel-filter">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los niveles</SelectItem>
                <SelectItem value="primaria">Primaria</SelectItem>
                <SelectItem value="secundaria">Secundaria</SelectItem>
                <SelectItem value="preparatoria">Preparatoria</SelectItem>
                <SelectItem value="universidad">Universidad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de formularios */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Cargando formularios...</p>
            </CardContent>
          </Card>
        ) : filteredFormularios.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {selectedNivel 
                  ? `No hay formularios para el nivel ${selectedNivel}` 
                  : "No hay formularios públicos creados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFormularios.map((formulario: FormularioPublico) => (
            <Card key={formulario.id} data-testid={`card-formulario-${formulario.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{formulario.nombre}</CardTitle>
                    {formulario.descripcion && (
                      <p className="text-sm text-muted-foreground">{formulario.descripcion}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {getEstadoBadge(formulario.activo)}
                    {getNivelBadge(formulario.nivelEducativo)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Enlace del formulario */}
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm flex-1 break-all">
                      {window.location.origin}/form/{formulario.enlace}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formulario.enlace)}
                      data-testid={`button-copy-${formulario.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-sm text-muted-foreground">
                      Creado: {new Date(formulario.fechaCreacion).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/form/${formulario.enlace}`, '_blank')}
                        data-testid={`button-preview-${formulario.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vista Previa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(formulario)}
                        data-testid={`button-edit-${formulario.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(formulario.id)}
                        data-testid={`button-delete-${formulario.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para crear/editar formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFormulario ? "Editar Formulario Público" : "Nuevo Formulario Público"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Formulario</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Inscripciones Preparatoria 2024" {...field} data-testid="input-nombre" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivelEducativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel Educativo</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-nivel-educativo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primaria">Primaria</SelectItem>
                            <SelectItem value="secundaria">Secundaria</SelectItem>
                            <SelectItem value="preparatoria">Preparatoria</SelectItem>
                            <SelectItem value="universidad">Universidad</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción breve del formulario y su propósito..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-descripcion"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Estado del Formulario</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Los formularios inactivos no aceptan nuevas respuestas
                      </p>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        data-testid="switch-activo"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-guardar"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}