import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductionCompany } from '@shared/schema';
import { Building2, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export default function ProductionCompaniesPage() {
  const { data, isLoading } = useQuery<ProductionCompany[]>({
    queryKey: ['/api/top-production-companies'],
  });
  
  const colors = [
    '#3f51b5', '#757de8', '#002984', '#f50057', '#ff5983'
  ];
  
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Top 5 Production Companies by Oscar Wins</CardTitle>
            <CardDescription>
              The studios that have produced the most Academy Award-winning films
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 90,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" label={{ value: 'Number of Oscars Won', position: 'insideBottom', offset: -5 }} />
                      <YAxis 
                        type="category" 
                        dataKey="pd_company" 
                        width={80}
                        tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} Oscars`, 'Oscar Wins']}
                        labelFormatter={(value) => `Company: ${value}`}
                      />
                      <Bar dataKey="oscars" fill="#3f51b5">
                        {data?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                        <LabelList dataKey="oscars" position="right" fill="#333" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {data?.map((company, index) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="pt-6">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${colors[index % colors.length]}20` }}
                          >
                            <Building2 
                              className="h-6 w-6"
                              style={{ color: colors[index % colors.length] }}
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-bold text-lg">{company.pd_company}</h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 px-2">
                          <div className="flex items-center">
                            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="font-semibold">{company.oscars} Oscars Won</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rank #{index + 1}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
