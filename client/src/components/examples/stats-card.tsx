import { StatsCard } from '../stats-card';
import { Users } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-4">
      <StatsCard
        title="Total Estudiantes"
        value="1,234"
        icon={Users}
        change={{ value: "+15% este mes", type: "positive" }}
        subtitle="Activos en el sistema"
      />
    </div>
  );
}