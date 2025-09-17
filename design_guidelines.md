# Diseño CRM Educativo - Guías de Diseño

## Enfoque de Diseño
**Sistema de Diseño:** Material Design adaptado para productividad educativa
**Justificación:** Aplicación densa en información que requiere patrones establecidos para navegación clara entre múltiples dashboards y roles de usuario.

## Elementos de Diseño Centrales

### A. Paleta de Colores
**Modo Claro:**
- Primario: 210 85% 45% (azul académico profesional)
- Secundario: 210 25% 95% (gris azulado claro)
- Éxito: 142 76% 36% (verde aprobación)
- Advertencia: 38 92% 50% (naranja atención)
- Error: 0 84% 60% (rojo crítico)

**Modo Oscuro:**
- Primario: 210 85% 65% (azul más claro)
- Fondo: 210 15% 12% (gris oscuro azulado)
- Superficie: 210 10% 18% (cards y paneles)

### B. Tipografía
- **Fuente Principal:** Inter (Google Fonts) - legibilidad en datos y métricas
- **Fuente Secundaria:** Roboto Mono (números y códigos)
- **Jerarquía:** Títulos (text-2xl), Subtítulos (text-lg), Cuerpo (text-base), Métricas (text-sm)

### C. Sistema de Espaciado
**Unidades Tailwind:** Usar consistentemente 2, 4, 6, y 8
- Elementos pequeños: p-2, m-2
- Componentes medianos: p-4, gap-4
- Secciones principales: p-6, mb-6
- Separaciones grandes: p-8, mt-8

### D. Biblioteca de Componentes

**Navegación:**
- Barra lateral colapsible con iconos (Heroicons CDN)
- Breadcrumbs para navegación profunda
- Tabs para vistas de dashboard por rol

**Dashboard y Métricas:**
- Cards con bordes sutiles y sombras ligeras
- Gráficos integrados (Chart.js) con colores de marca
- Tablas responsivas con ordenamiento
- Indicadores KPI con iconos y colores semánticos

**Formularios:**
- Campos con labels flotantes
- Validación en tiempo real con mensajes claros
- Botones primarios (filled) y secundarios (outline)
- Selectores de fecha/hora para seguimiento

**Comunicaciones:**
- Timeline de interacciones con timestamps
- Modal para registro de llamadas y notas
- Sistema de notificaciones discreto

### E. Principios de UX

**Jerarquía Visual:**
- Dashboards con métricas principales prominentes
- Uso de peso tipográfico para destacar KPIs críticos
- Color semántico para estados (pendiente, completado, crítico)

**Flujos de Trabajo:**
- Navegación contextual entre prospectos y comunicaciones
- Filtros persistentes en vistas de lista
- Acciones rápidas accesibles desde cualquier vista

**Personalización por Rol:**
- Rector/Director: Visualizaciones ejecutivas y comparativas
- Gerentes: Supervisión de equipos y reportes
- Asesores: Herramientas operativas y gestión directa

### Consideraciones Especiales
- Textos en español con terminología educativa apropiada
- Exportación clara de reportes con branding institucional
- Sistema de permisos visual (elementos deshabilitados vs ocultos)
- Responsive design para tablets usadas en reuniones

### Imágenes
No se requiere imagen hero principal. Usar iconografía educativa sutil en estados vacíos y placeholders de datos, manteniendo el enfoque en la funcionalidad y métricas del CRM.