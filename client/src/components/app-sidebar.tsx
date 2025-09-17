import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  BarChart3,
  Target,
  FileText,
  GraduationCap,
  Home,
  Settings
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

  const handleSectionClick = (section: string) => {
    const cleanSection = section.replace('#', '');
    setCurrentSection(cleanSection);
    onSectionChange?.(cleanSection);
    console.log(`Navegando a sección: ${cleanSection}`);
  };

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

        <SidebarGroup>
          <SidebarGroupLabel>Dashboards por Rol</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}