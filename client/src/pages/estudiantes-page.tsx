import EstudiantesManager from '@/components/estudiantes-manager';

export default function EstudiantesPage() {
  return (
    <>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header de la página */}
        <div className="border-b pb-4">
          <title>Estudiantes - CRM Educativo</title>
          <h1 className="text-3xl font-bold" data-testid="title-estudiantes-page">
            Gestión de Estudiantes
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra la información de todos los estudiantes matriculados en la institución
          </p>
        </div>

        {/* Componente principal */}
        <EstudiantesManager />
      </div>
    </>
  );
}