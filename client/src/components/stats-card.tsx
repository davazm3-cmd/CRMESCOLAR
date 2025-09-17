import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  subtitle?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  subtitle, 
  className = "" 
}: StatsCardProps) {
  const getChangeColor = (type: "positive" | "negative" | "neutral") => {
    switch (type) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className={`hover-elevate ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold" data-testid={`text-value-${title.toLowerCase()}`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-sm text-muted-foreground">
              {subtitle}
            </div>
          )}
          {change && (
            <Badge 
              variant="secondary" 
              className={`w-fit ${getChangeColor(change.type)}`}
              data-testid={`badge-change-${title.toLowerCase()}`}
            >
              {change.value}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}