import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  BarChart3,
  Target,
  FileText,
  GraduationCap,
  Home,
  Settings,
  ExternalLink
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  {
    title: "Inicio",
    url: "#dashboard",
    icon: Home,
  },
  {
    title: "Prospectos",
    url: "#prospectos", 
    icon: Users,
  },
  {
    title: "Comunicaciones",
    url: "#comunicaciones",
    icon: MessageCircle,
  },
  {
    title: "Campañas",
    url: "#campanas",
    icon: Target,
  },
  {
    title: "Reportes",
    url: "#reportes",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    url: "#configuracion",
    icon: Settings,
  },
];

const roleItems = [
  {
    title: "Vista Director",
    url: "#director",
    icon: GraduationCap,
  },
  {
    title: "Vista Gerente",
    url: "#gerente",
    icon: FileText,
  },
  {
    title: "Vista Asesor",
    url: "#asesor",
    icon: BookOpen,
  },
];

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({ activeSection = "dashboard", onSectionChange }: AppSidebarProps) {
  const [currentSection, setCurrentSection] = useState(activeSection);
  const { user, isDirector, isGerente, isAsesor } = useAuth();

  const handleSectionClick = (section: string) => {
    const cleanSection = section.replace('#', '');
    setCurrentSection(cleanSection);
    onSectionChange?.(cleanSection);
  };

  // Filtrar elementos del dashboard por rol
  const getAvailableRoleItems = () => {
    const availableItems = [];
    
    if (isDirector) {
      availableItems.push({
        title: "Vista Director",
        url: "#director",
        icon: GraduationCap,
      });
    }
    
    if (isGerente) {
      availableItems.push({
        title: "Vista Gerente",
        url: "#gerente",
        icon: FileText,
      });
    }
    
    if (isAsesor) {
      availableItems.push({
        title: "Vista Asesor",
        url: "#asesor",
        icon: BookOpen,
      });
    }
    
    return availableItems;
  };

  const availableRoleItems = getAvailableRoleItems();

  // Elementos de administración solo para directores y gerentes
  const getAdminItems = () => {
    const adminItems = [];
    
    if (isDirector || isGerente) {
      adminItems.push({
        title: "Formularios Públicos",
        url: "#formularios-publicos",
        icon: ExternalLink,
      });
    }
    
    return adminItems;
  };

  const adminItems = getAdminItems();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM Educativo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentSection === item.url.replace('#', '')}
                  >
                    <button 
                      onClick={() => handleSectionClick(item.url)}
                      data-testid={`button-nav-${item.url.replace('#', '')}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sección de administración solo para directores y gerentes */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={currentSection === item.url.replace('#', '')}
                    >
                      <button 
                        onClick={() => handleSectionClick(item.url)}
                        data-testid={`button-nav-${item.url.replace('#', '')}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Solo mostrar dashboards disponibles según el rol */}
        {availableRoleItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards Disponibles</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {availableRoleItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={currentSection === item.url.replace('#', '')}
                    >
                      <button 
                        onClick={() => handleSectionClick(item.url)}
                        data-testid={`button-nav-${item.url.replace('#', '')}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}