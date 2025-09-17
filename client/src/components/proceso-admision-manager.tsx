import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, CreditCard, GraduationCap, CheckCircle, AlertCircle, Clock, Users } from "lucide-react";
import type { Prospecto, DocumentoAdmision, Pago } from "@shared/schema";

// Estados del proceso de admisión
const ESTADOS_ADMISION = {
  documentos: { label: "Documentos", icon: FileText, color: "orange" },
  admitido: { label: "Admitido", icon: CheckCircle, color: "green" },
  matriculado: { label: "Matriculado", icon: GraduationCap, color: "blue" }
};

interface ProcesoAdmisionManagerProps {
  prospecto: Prospecto;
}

export function ProcesoAdmisionManager({ prospecto }: ProcesoAdmisionManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resumen");
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Queries para datos de admisión
  const { data: documentos = [], isLoading: loadingDocumentos } = useQuery<DocumentoAdmision[]>({
    queryKey: ['/api/prospectos', prospecto.id, 'documentos'],
    enabled: !!prospecto.id
  });

  const { data: pagos = [], isLoading: loadingPagos } = useQuery<Pago[]>({
    queryKey: ['/api/prospectos', prospecto.id, 'pagos'],
    enabled: !!prospecto.id
  });

  // Mutations
  const iniciarAdmisionMutation = useMutation({
    mutationFn: () => 
      apiRequest('POST', `/api/prospectos/${prospecto.id}/iniciar-admision`),
    onSuccess: () => {
      toast({
        title: "Proceso iniciado",
        description: "El proceso de admisión ha sido iniciado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prospectos'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al iniciar el proceso de admisión.",
        variant: "destructive",
      });
    }
  });

  const subirDocumentoMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/documentos-admision', data),
    onSuccess: () => {
      toast({
        title: "Documento subido",
        description: "El documento ha sido subido exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prospectos', prospecto.id, 'documentos'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al subir el documento.",
        variant: "destructive",
      });
    }
  });

  const crearPagoMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/pagos', data),
    onSuccess: () => {
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prospectos', prospecto.id, 'pagos'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Error al registrar el pago.",
        variant: "destructive",
      });
    }
  });

  const completarMatriculaMutation = useMutation({
    mutationFn: (pagoId: string) => 
      apiRequest('POST', `/api/prospectos/${prospecto.id}/completar-matricula`, { pagoId }),
    onSuccess: () => {
      toast({
        title: "Matrícula completada",
        description: "El estudiante ha sido matriculado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prospectos'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al completar la matrícula.",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleIniciarAdmision = () => {
    iniciarAdmisionMutation.mutate();
  };

  const handleSubirDocumento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadingDocument(true);
    
    const formData = new FormData(e.currentTarget);
    const tipoDocumento = formData.get('tipoDocumento') as string;
    const comentarios = formData.get('comentarios') as string;
    const archivo = formData.get('archivo') as File;
    
    if (!archivo || !tipoDocumento) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo y tipo de documento.",
        variant: "destructive",
      });
      setUploadingDocument(false);
      return;
    }

    // Simular subida de archivo (en producción usarías storage real)
    const rutaArchivo = `/uploads/documentos/${prospecto.id}/${archivo.name}`;
    
    subirDocumentoMutation.mutate({
      prospectoId: prospecto.id,
      tipoDocumento,
      nombreArchivo: archivo.name,
      rutaArchivo,
      tamano: archivo.size,
      comentarios: comentarios || undefined
    });
    
    setUploadingDocument(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleCrearPago = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const concepto = formData.get('concepto') as string;
    const monto = formData.get('monto') as string;
    const metodoPago = formData.get('metodoPago') as string;
    
    crearPagoMutation.mutate({
      prospectoId: prospecto.id,
      concepto,
      monto,
      metodoPago,
      estado: 'pendiente'
    });
    
    (e.target as HTMLFormElement).reset();
  };

  const handleCompletarMatricula = (pagoId: string) => {
    completarMatriculaMutation.mutate(pagoId);
  };

  // Calcular progreso del proceso
  const calcularProgreso = () => {
    let progreso = 0;
    const documentosAprobados = documentos.filter((d: DocumentoAdmision) => d.estado === 'aprobado').length;
    const pagosCompletados = pagos.filter((p: Pago) => p.estado === 'completado').length;
    
    if (prospecto.estatus === 'documentos') progreso = 25;
    if (documentosAprobados > 0) progreso = 50;
    if (prospecto.estatus === 'admitido') progreso = 75;
    if (prospecto.estatus === 'matriculado' || pagosCompletados > 0) progreso = 100;
    
    return progreso;
  };

  const progreso = calcularProgreso();
  const estadoActual = ESTADOS_ADMISION[prospecto.estatus as keyof typeof ESTADOS_ADMISION];

  return (
    <div className="space-y-6">
      {/* Header con estado y progreso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" data-testid="title-proceso-admision">
                <GraduationCap className="h-5 w-5" />
                Proceso de Admisión Digital
              </CardTitle>
              <CardDescription>
                Gestión completa del proceso de admisión para {prospecto.nombre}
              </CardDescription>
            </div>
            {estadoActual && (
              <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-estado-${prospecto.estatus}`}>
                <estadoActual.icon className="h-3 w-3" />
                {estadoActual.label}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso del proceso</span>
              <span>{progreso}%</span>
            </div>
            <Progress value={progreso} className="h-2" data-testid="progress-admision" />
          </div>
        </CardHeader>
      </Card>

      {/* Botón para iniciar proceso si está en documentos pero no iniciado */}
      {prospecto.estatus === 'cita_agendada' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                El prospecto está listo para iniciar el proceso de admisión digital
              </div>
              <Button 
                onClick={handleIniciarAdmision}
                disabled={iniciarAdmisionMutation.isPending}
                size="lg"
                data-testid="button-iniciar-admision"
              >
                {iniciarAdmisionMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando proceso...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Iniciar Proceso de Admisión
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para diferentes secciones */}
      {['documentos', 'admitido', 'matriculado'].includes(prospecto.estatus) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen" data-testid="tab-resumen">Resumen</TabsTrigger>
            <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos</TabsTrigger>
            <TabsTrigger value="pagos" data-testid="tab-pagos">Pagos</TabsTrigger>
            <TabsTrigger value="estudiante" data-testid="tab-estudiante">Estudiante</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Proceso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid="count-documentos">
                      {documentos.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Documentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="count-documentos-aprobados">
                      {documentos.filter((d: DocumentoAdmision) => d.estado === 'aprobado').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Aprobados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600" data-testid="count-pagos">
                      {pagos.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pagos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600" data-testid="count-pagos-completados">
                      {pagos.filter((p: Pago) => p.estado === 'completado').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos de Admisión</CardTitle>
                <CardDescription>
                  Gestión de documentos requeridos para el proceso de admisión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulario para subir documentos */}
                <form onSubmit={handleSubirDocumento} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                      <select 
                        name="tipoDocumento" 
                        className="w-full p-2 border rounded-md"
                        required
                        data-testid="select-tipo-documento"
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="identificacion">Identificación</option>
                        <option value="certificados">Certificados</option>
                        <option value="fotografias">Fotografías</option>
                        <option value="comprobante_domicilio">Comprobante de Domicilio</option>
                        <option value="otros">Otros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="archivo">Archivo</Label>
                      <Input 
                        type="file" 
                        name="archivo" 
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        required
                        data-testid="input-archivo"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comentarios">Comentarios (opcional)</Label>
                    <Textarea 
                      name="comentarios" 
                      placeholder="Comentarios adicionales sobre el documento..."
                      data-testid="textarea-comentarios"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={uploadingDocument || subirDocumentoMutation.isPending}
                    data-testid="button-subir-documento"
                  >
                    {uploadingDocument || subirDocumentoMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Documento
                      </>
                    )}
                  </Button>
                </form>

                {/* Lista de documentos */}
                <div className="space-y-3">
                  {loadingDocumentos ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Cargando documentos...
                    </div>
                  ) : documentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No hay documentos subidos
                    </div>
                  ) : (
                    documentos.map((documento: DocumentoAdmision) => (
                      <div 
                        key={documento.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`documento-${documento.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{documento.nombreArchivo}</div>
                            <div className="text-sm text-muted-foreground">
                              {documento.tipoDocumento} • {documento.fechaCarga ? new Date(documento.fechaCarga).toLocaleDateString() : 'Sin fecha'}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            documento.estado === 'aprobado' ? 'default' :
                            documento.estado === 'rechazado' ? 'destructive' : 'secondary'
                          }
                          data-testid={`badge-estado-documento-${documento.estado}`}
                        >
                          {documento.estado === 'pendiente' && <Clock className="mr-1 h-3 w-3" />}
                          {documento.estado === 'aprobado' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {documento.estado === 'rechazado' && <AlertCircle className="mr-1 h-3 w-3" />}
                          {documento.estado.charAt(0).toUpperCase() + documento.estado.slice(1)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Pagos</CardTitle>
                <CardDescription>
                  Administración de pagos y transacciones del proceso de admisión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulario para registrar pago */}
                <form onSubmit={handleCrearPago} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="concepto">Concepto</Label>
                      <select 
                        name="concepto" 
                        className="w-full p-2 border rounded-md"
                        required
                        data-testid="select-concepto-pago"
                      >
                        <option value="">Seleccionar concepto</option>
                        <option value="cuota_admision">Cuota de Admisión</option>
                        <option value="matricula">Matrícula</option>
                        <option value="mensualidad">Mensualidad</option>
                        <option value="otros">Otros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monto">Monto (MXN)</Label>
                      <Input 
                        name="monto" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        required
                        data-testid="input-monto-pago"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de Pago</Label>
                      <select 
                        name="metodoPago" 
                        className="w-full p-2 border rounded-md"
                        required
                        data-testid="select-metodo-pago"
                      >
                        <option value="">Seleccionar método</option>
                        <option value="stripe">Stripe (Tarjeta)</option>
                        <option value="paypal">PayPal</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="efectivo">Efectivo</option>
                      </select>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    disabled={crearPagoMutation.isPending}
                    data-testid="button-crear-pago"
                  >
                    {crearPagoMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Registrar Pago
                      </>
                    )}
                  </Button>
                </form>

                {/* Lista de pagos */}
                <div className="space-y-3">
                  {loadingPagos ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Cargando pagos...
                    </div>
                  ) : pagos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No hay pagos registrados
                    </div>
                  ) : (
                    pagos.map((pago: Pago) => (
                      <div 
                        key={pago.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`pago-${pago.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {pago.concepto.replace('_', ' ').charAt(0).toUpperCase() + pago.concepto.slice(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${pago.monto} {pago.moneda} • {pago.metodoPago} • {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : 'Sin fecha'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              pago.estado === 'completado' ? 'default' :
                              pago.estado === 'fallido' ? 'destructive' : 'secondary'
                            }
                            data-testid={`badge-estado-pago-${pago.estado}`}
                          >
                            {pago.estado === 'pendiente' && <Clock className="mr-1 h-3 w-3" />}
                            {pago.estado === 'completado' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                          </Badge>
                          {pago.estado === 'completado' && prospecto.estatus === 'admitido' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompletarMatricula(pago.id)}
                              disabled={completarMatriculaMutation.isPending}
                              data-testid={`button-completar-matricula-${pago.id}`}
                            >
                              {completarMatriculaMutation.isPending ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Users className="mr-1 h-3 w-3" />
                                  Matricular
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estudiante" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Estudiante</CardTitle>
                <CardDescription>
                  Datos académicos y estado de matrícula
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prospecto.estatus === 'matriculado' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      ¡Estudiante Matriculado!
                    </h3>
                    <p className="text-muted-foreground">
                      {prospecto.nombre} ha completado exitosamente el proceso de admisión y está matriculado.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    El prospecto aún no ha sido matriculado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}