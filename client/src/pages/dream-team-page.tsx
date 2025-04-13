import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { DreamTeamMember } from '@shared/schema';
import { Stars, Film, Trophy, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DreamTeamPage() {
  const { data, isLoading } = useQuery<DreamTeamMember[]>({
    queryKey: ['/api/dream-team'],
  });
  
  const roleColors: Record<string, string> = {
    'Director': 'bg-blue-100 text-blue-800',
    'Actor': 'bg-green-100 text-green-800',
    'Actress': 'bg-purple-100 text-purple-800',
    'Producer': 'bg-amber-100 text-amber-800',
    'Composer': 'bg-red-100 text-red-800',
    'Singer': 'bg-indigo-100 text-indigo-800'
  };
  
  const roleIcons: Record<string, JSX.Element> = {
    'Director': <Film className="h-5 w-5" />,
    'Actor': <Award className="h-5 w-5" />,
    'Actress': <Award className="h-5 w-5" />,
    'Producer': <Award className="h-5 w-5" />,
    'Composer': <Award className="h-5 w-5" />,
    'Singer': <Award className="h-5 w-5" />
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return 'Unknown';
    
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  
  return (
    <Layout title="Dream Team">
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Stars className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">The Oscar Dream Team</CardTitle>
            <CardDescription>
              The living cast members with the most Oscar wins who could create the best movie ever
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {data?.map((member, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className={`p-3 text-center font-medium ${roleColors[member.role] || 'bg-primary text-white'}`}>
                      <div className="flex items-center justify-center gap-2">
                        {roleIcons[member.role] || <Stars className="h-5 w-5" />}
                        <span>{member.role}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mb-3 flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-500">
                          {member.person_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <h3 className="font-medium text-lg text-center">{member.person_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Born: {formatDate(member.date_of_birth)} ({calculateAge(member.date_of_birth)} years old)
                      </p>
                      <div className="flex items-center mb-2">
                        <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="font-medium">{member.oscars} Oscar{member.oscars !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="mt-2 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Notable works:</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {member.notable_works.map((work, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {work}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="mx-auto max-w-2xl">
              The Dream Team consists of the living professionals who have won the most Oscars in their respective 
              fields. Together, they represent the ultimate movie-making ensemble that could create 
              an Academy Award winning masterpiece.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
