import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NonEnglishMovie } from '@shared/schema';
import { Search, Languages, Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NonEnglishMoviesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useQuery<NonEnglishMovie[]>({
    queryKey: ['/api/non-english-movies'],
  });
  
  // Filter data based on search term
  const filteredData = data?.filter(movie => 
    searchTerm === '' || 
    movie.movie_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.pd_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.director?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Get unique languages for statistics
  const languages = [...new Set(data?.map(movie => movie.language))];
  const languageStats = languages.map(language => ({
    language,
    count: data?.filter(movie => movie.language === language).length || 0
  })).sort((a, b) => b.count - a.count);
  
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Non-English Speaking Oscar-Winning Films</CardTitle>
            <CardDescription>
              Movies filmed in languages other than English that have won Academy Awards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, language, or director..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex-shrink-0 flex items-center">
                <Languages className="h-5 w-5 mr-2 text-primary" />
                <span className="text-sm font-medium">{languages.length} Different Languages</span>
              </div>
            </div>
            
            {!isLoading && languageStats.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {languageStats.slice(0, 8).map((stat, index) => (
                  <Badge 
                    key={index} 
                    className="py-1 cursor-pointer hover:bg-primary/90"
                    onClick={() => setSearchTerm(stat.language)}
                  >
                    {stat.language}: {stat.count} film{stat.count !== 1 ? 's' : ''}
                  </Badge>
                ))}
              </div>
            )}
            
            <DataTable
              data={filteredData}
              columns={[
                { 
                  accessorKey: 'movie_name', 
                  header: 'Movie Title',
                  cell: (info) => (
                    <div className="flex items-center">
                      <Film className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">{info.movie_name}</span>
                    </div>
                  ) 
                },
                { 
                  accessorKey: 'language', 
                  header: 'Language',
                  cell: (info) => (
                    <Badge variant="outline">{info.language}</Badge>
                  )
                },
                { 
                  accessorKey: 'year', 
                  header: 'Year Won',
                  cell: (info) => `${info.year}th Academy Awards`
                },
                { accessorKey: 'category', header: 'Oscar Category' },
                { accessorKey: 'pd_company', header: 'Production Company' },
                { accessorKey: 'director', header: 'Director' }
              ]}
            />
          </CardContent>
        </Card>
      </div>
  );
}
