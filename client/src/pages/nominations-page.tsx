import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { UserNomination } from '@shared/schema';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { format } from 'date-fns';

export default function NominationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nominationToDelete, setNominationToDelete] = useState<UserNomination | null>(null);
  
  // Fetch user nominations
  const { data, isLoading } = useQuery<UserNomination[]>({
    queryKey: ['/api/user-nominations'],
  });

  // Delete nomination mutation
  const deleteMutation = useMutation({
    mutationFn: async (nomination: UserNomination) => {
      await apiRequest('DELETE', '/api/user-nominations', {
        category: nomination.category,
        iteration: nomination.iteration,
        movie_name: nomination.movie_name,
        movie_release_date: nomination.movie_release_date,
        person_name: nomination.person_name,
        person_date_of_birth: nomination.person_date_of_birth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-nominations'] });
      toast({
        title: 'Nomination Deleted',
        description: 'Your nomination has been successfully deleted.'
      });
      setNominationToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete nomination: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  const confirmDelete = (nomination: UserNomination) => {
    setNominationToDelete(nomination);
  };

  const handleDelete = () => {
    if (nominationToDelete) {
      deleteMutation.mutate(nominationToDelete);
    }
  };

  const actionsRenderer = (row: UserNomination) => {
    return (
      <div className="flex space-x-2">
        <Button variant="ghost" size="icon" onClick={() => {}}>
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => confirmDelete(row)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Your Nominations</h2>
          <Link href="/add-nomination">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Link>
        </div>

        <DataTable
          data={data || []}
          columns={[
            { accessorKey: 'category', header: 'Category' },
            { accessorKey: 'iteration', header: 'Iteration' },
            { accessorKey: 'movie_name', header: 'Movie' },
            { accessorKey: 'person_name', header: 'Person' },
            { 
              accessorKey: 'person_date_of_birth', 
              header: 'Person DOB',
              cell: (info) => formatDate(info.person_date_of_birth)
            }
          ]}
          actions={actionsRenderer}
        />

        {/* Confirmation Dialog */}
        <AlertDialog open={!!nominationToDelete} onOpenChange={() => setNominationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this nomination? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
