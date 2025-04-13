import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StaffByCountry } from '@shared/schema';
import { Search, Flag, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StaffByCountryPage() {
  const [country, setCountry] = useState('United States');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch staff by country
  const { data, isLoading, refetch } = useQuery<StaffByCountry[]>({
    queryKey: ['/api/staff-by-country', country],
    queryFn: async ({ queryKey }) => {
      const [_, country] = queryKey;
      const url = `/api/staff-by-country?country=${encodeURIComponent(country)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch staff by country');
      }
      return response.json();
    }
  });
  
  // Filter data based on search term
  const filteredData = data?.filter(staff => 
    searchTerm === '' || 
    staff.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Popular countries for presets
  const popularCountries = [
    'United States',
    'United Kingdom',
    'France',
    'Italy',
    'Canada',
    'Australia',
    'Germany',
    'Japan'
  ];
  
  const handleCountryChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    refetch();
  };

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Nominated Staff Members by Country</CardTitle>
            <CardDescription>
              View all nominated staff members born in a specific country with their nomination statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="popular">Popular Countries</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search">
                <form onSubmit={handleCountryChange} className="flex space-x-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="country-input">Enter Country Name</Label>
                    <Input
                      id="country-input"
                      placeholder="Country name (e.g., United States)"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="h-10">
                      Search
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="popular">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                  {popularCountries.map((c) => (
                    <Button
                      key={c}
                      variant={country === c ? "default" : "outline"}
                      className="h-10"
                      onClick={() => setCountry(c)}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {c}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by name or category..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg mb-6 flex items-center">
              <Flag className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Currently showing: {country}</h3>
            </div>
            
            <DataTable
              data={filteredData}
              columns={[
                { accessorKey: 'person_name', header: 'Name' },
                { 
                  accessorKey: 'date_of_birth', 
                  header: 'Date of Birth',
                  cell: (info) => new Date(info.date_of_birth).toLocaleDateString()
                },
                { accessorKey: 'category', header: 'Category' },
                { accessorKey: 'nominations', header: 'Nominations' },
                { 
                  accessorKey: 'oscars', 
                  header: 'Oscars Won',
                  cell: (info) => (
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>{info.oscars}</span>
                    </div>
                  ) 
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>
  );
}
