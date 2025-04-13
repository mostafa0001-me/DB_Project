import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BirthCountry } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe } from 'lucide-react';

export default function BirthCountriesPage() {
  const { data, isLoading } = useQuery<BirthCountry[]>({
    queryKey: ['/api/top-birth-countries'],
  });
  
  const colors = [
    '#3f51b5', '#757de8', '#002984', '#f50057', '#ff5983'
  ];
  
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Top 5 Birth Countries for Best Actor/Actress Winners</CardTitle>
            <CardDescription>
              Countries that have produced the most Oscar-winning actors and actresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [`${value} winners`, 'Count']}
                        labelFormatter={(value) => `Country: ${value}`}
                      />
                      <Bar dataKey="count" fill="#3f51b5" name="Winners">
                        {data?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.map((country, index) => (
                    <Card key={index} className="bg-gray-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${colors[index % colors.length]}20` }}>
                            <Globe className={`h-5 w-5`} style={{ color: colors[index % colors.length] }} />
                          </div>
                          <div className="ml-3">
                            <h3 className="font-bold">{country.country}</h3>
                            <p className="text-sm text-muted-foreground">{country.count} Oscar winners</p>
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
