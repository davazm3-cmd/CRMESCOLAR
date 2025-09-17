import { AppSidebar } from '../app-sidebar';

export default function AppSidebarExample() {
  return (
    <div className="h-screen w-64">
      <AppSidebar 
        activeSection="dashboard" 
        onSectionChange={(section) => console.log('Navegando a:', section)} 
      />
    </div>
  );
}