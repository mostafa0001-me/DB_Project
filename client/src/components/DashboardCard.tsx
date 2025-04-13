import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: { value: string | number; positive: boolean } | null;
  iconBgClass?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  change = null,
  iconBgClass = 'bg-primary/10'
}: DashboardCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div className={`w-10 h-10 rounded-full ${iconBgClass} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        
        {change && (
          <div className={`mt-2 text-xs ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
            {change.positive ? (
              <ArrowUp className="h-3 w-3 inline" />
            ) : (
              <ArrowUp className="h-3 w-3 inline rotate-180" />
            )}
            <span className="ml-1">{change.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
