import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TopNominatedMovie } from '@shared/schema';
import { Search } from 'lucide-react';

export default function TopMoviesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const { data, isLoading } = useQuery<TopNominatedMovie[]>({
    queryKey: ['/api/top-nominated-movies'],
  });
  
  // Filter data based on search term and filters
  const filteredData = data?.filter(movie => {
    const matchesSearch = searchTerm === '' || 
      movie.movie_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || 
      movie.category.toLowerCase().includes(categoryFilter.toLowerCase());
    
    const matchesYear = yearFilter === '' || 
      movie.year.toString().includes(yearFilter);
    
    return matchesSearch && matchesCategory && matchesYear;
  }) || [];
  
  return (
    <Layout title="Top Nominated Movies">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Top Nominated Movies by Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by movie title..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Input
                    id="category-filter"
                    placeholder="Filter by category..."
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="year-filter">Year</Label>
                  <Input
                    id="year-filter"
                    placeholder="Filter by year..."
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DataTable
              data={filteredData}
              columns={[
                { accessorKey: 'movie_name', header: 'Movie Name' },
                { 
                  accessorKey: 'release_date', 
                  header: 'Release Date',
                  cell: (info) => new Date(info.release_date).toLocaleDateString()
                },
                { accessorKey: 'category', header: 'Category' },
                { accessorKey: 'year', header: 'Year' },
                { accessorKey: 'count', header: 'Nominations Count' }
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
