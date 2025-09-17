import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Esquema de validación para el formulario público
const formularioPublicoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Ingresa un email válido"),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  datosExtra: z.record(z.string()).optional()
});

type FormularioPublicoData = z.infer<typeof formularioPublicoSchema>;

interface FormularioPublico {
  id: string;
  nombre: string;
  descripcion?: string;
  nivelEducativo: string;
  configuracion: {
    mostrarTelefono?: boolean;
    mostrarNivelEducativo?: boolean;
    camposExtra?: string[];
    mensajeBienvenida?: string;
    mensajeExito?: string;
  };
}

export default function FormularioPublicoPage() {
  const { enlace } = useParams<{ enlace: string }>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Query para obtener la configuración del formulario público
  const { data: formulario, isLoading, error } = useQuery<FormularioPublico>({
    queryKey: [`/api/public/form/${enlace}`],
    staleTime: 300000, // 5 minutos
    enabled: !!enlace
  });

  // Mutation para enviar el formulario
  const submitMutation = useMutation({
    mutationFn: (data: FormularioPublicoData) => 
      apiRequest("POST", `/api/public/form/${enlace}/submit`, data),
    onSuccess: () => {
      setIsSubmitted(true);
      setSubmitError(null);
    },
    onError: (error: any) => {
      setSubmitError(error.message || "Error al enviar el formulario");
    }
  });

  // Configuración del formulario
  const form = useForm<FormularioPublicoData>({
    resolver: zodResolver(formularioPublicoSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      datosExtra: {}
    }
  });

  const handleSubmit = (data: FormularioPublicoData) => {
    setSubmitError(null);
    submitMutation.mutate(data);
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando formulario...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !formulario) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Formulario no encontrado</h2>
            <p className="text-muted-foreground">
              El formulario que buscas no existe o ya no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de éxito después del envío
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-4 text-foreground">¡Formulario enviado!</h2>
            <p className="text-muted-foreground mb-6">
              {formulario.configuracion.mensajeExito || 
               "¡Gracias! Hemos recibido tu información. Nos contactaremos contigo pronto."}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              data-testid="button-enviar-otro"
            >
              Enviar otro formulario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground" data-testid="titulo-formulario">
              {formulario.nombre}
            </CardTitle>
            {formulario.descripcion && (
              <p className="text-muted-foreground mt-2" data-testid="descripcion-formulario">
                {formulario.descripcion}
              </p>
            )}
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-foreground">
                {formulario.configuracion.mensajeBienvenida || 
                 "¡Bienvenido! Completa este formulario para comenzar tu proceso de admisión."}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Campo Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingresa tu nombre completo"
                          {...field}
                          data-testid="input-nombre"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="correo@ejemplo.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Teléfono - condicional */}
                {formulario.configuracion.mostrarTelefono !== false && (
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="+52 55 1234-5678"
                            {...field}
                            data-testid="input-telefono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Información del nivel educativo - condicional */}
                {formulario.configuracion.mostrarNivelEducativo !== false && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Nivel Educativo de Interés</Label>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="nivel-educativo">
                      {formulario.nivelEducativo.charAt(0).toUpperCase() + formulario.nivelEducativo.slice(1)}
                    </p>
                  </div>
                )}

                {/* Campos extra dinámicos */}
                {formulario.configuracion.camposExtra && formulario.configuracion.camposExtra.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Información Adicional</Label>
                    {formulario.configuracion.camposExtra.map((campo, index) => (
                      <div key={index}>
                        <Label htmlFor={`campo-extra-${index}`} className="text-sm">
                          {campo}
                        </Label>
                        <Textarea
                          id={`campo-extra-${index}`}
                          placeholder={`Ingresa tu ${campo.toLowerCase()}`}
                          className="mt-1 resize-none"
                          rows={3}
                          onChange={(e) => {
                            const datosExtra = { ...form.getValues().datosExtra };
                            datosExtra[campo] = e.target.value;
                            form.setValue('datosExtra', datosExtra);
                          }}
                          data-testid={`textarea-${campo.toLowerCase().replace(/\\s+/g, '-')}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Error de envío */}
                {submitError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive" data-testid="error-envio">
                        {submitError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón de envío */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitMutation.isPending}
                    data-testid="button-enviar-formulario"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Formulario"
                    )}
                  </Button>
                </div>

                {/* Nota de privacidad */}
                <div className="text-xs text-muted-foreground text-center pt-2">
                  Al enviar este formulario, aceptas que utilicemos tu información para contactarte 
                  sobre nuestros programas educativos.
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}