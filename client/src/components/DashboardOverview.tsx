import { useQuery } from '@tanstack/react-query';
import DashboardCard from './DashboardCard';
import DataTable from './DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Trophy, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[130px] w-full" />
          <Skeleton className="h-[130px] w-full" />
          <Skeleton className="h-[130px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  const formattedData = {
    totalNominations: data?.totalNominations.toLocaleString() || '0',
    totalWinners: data?.totalWinners.toLocaleString() || '0',
    userNominations: data?.userNominations.toLocaleString() || '0',
    recentNominations: data?.recentNominations || [],
    topCategories: data?.topCategories || [],
    recentWinners: data?.recentWinners || []
  };

  // Calculate percentages for top categories
  const topCategoriesWithPercent = formattedData.topCategories.map(cat => {
    const total = formattedData.topCategories.reduce((sum, c) => sum + c.count, 0);
    return {
      ...cat,
      percentage: Math.round((cat.count / total) * 100)
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard 
          title="Total Nominations" 
          value={formattedData.totalNominations} 
          icon={<Award className="h-6 w-6 text-primary" />}
          change={{ value: "5.2% from last year", positive: true }}
        />
        
        <DashboardCard 
          title="Oscar Winners" 
          value={formattedData.totalWinners} 
          icon={<Trophy className="h-6 w-6 text-secondary" />}
          iconBgClass="bg-secondary/10"
        />
        
        <DashboardCard 
          title="User Nominations" 
          value={formattedData.userNominations} 
          icon={<Users className="h-6 w-6 text-purple-600" />}
          iconBgClass="bg-purple-100"
          change={{ value: "12.8% from last month", positive: true }}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent User Nominations</CardTitle>
          <a href="/nominations" className="text-primary text-sm hover:underline">View All</a>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={formattedData.recentNominations}
            columns={[
              { accessorKey: 'username', header: 'Username' },
              { accessorKey: 'movie_name', header: 'Movie' },
              { accessorKey: 'person_name', header: 'Person' },
              { accessorKey: 'category', header: 'Category' },
              { accessorKey: 'iteration', header: 'Iteration' }
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Top Categories by Nominations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategoriesWithPercent.map((category, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm font-medium">{category.percentage}%</span>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Academy Award Winners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formattedData.recentWinners.map((winner, i) => (
              <div key={i} className="flex items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="flex-shrink-0 w-12 h-16 bg-gray-200 rounded-sm mr-3 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{winner.movie_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {winner.category} - {winner.iteration}th Academy Awards
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
