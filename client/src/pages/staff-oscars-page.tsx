import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffOscarStats } from '@shared/schema';
import { Search, Trophy } from 'lucide-react';

export default function StaffOscarsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Fetch staff statistics
  const { data, isLoading } = useQuery<StaffOscarStats[]>({
    queryKey: ['/api/staff-oscars', roleFilter],
    queryFn: async ({ queryKey }) => {
      const [_, role] = queryKey;
      // Only add the role parameter if a specific role is selected (not 'all')
      const url = role && role !== 'all' ? `/api/staff-oscars?role=${role}` : '/api/staff-oscars';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch staff oscar stats');
      }
      return response.json();
    }
  });
  
  // Filter data based on search term
  const filteredData = data?.filter(staff => 
    searchTerm === '' || 
    staff.person_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Total Nominations and Oscars by Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by staff name..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <Label htmlFor="role-filter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Cast">Cast</SelectItem>
                    <SelectItem value="Writer">Writer</SelectItem>
                    <SelectItem value="Producer">Producer</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
