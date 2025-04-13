import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import Layout from '@/components/Layout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Define nomination schema
const nominationSchema = z.object({
  category: z.string({
    required_error: 'Please select a category',
  }),
  iteration: z.string().transform(value => parseInt(value, 10)),
  movie_name: z.string({
    required_error: 'Please select a movie',
  }),
  movie_release_date: z.string({
    required_error: 'Movie release date is required',
  }),
  person_name: z.string({
    required_error: 'Please select a person',
  }),
  person_date_of_birth: z.string({
    required_error: 'Person date of birth is required',
  }),
  user_username: z.string().optional()
});

// Oscar categories
const categories = [
  'Best Picture',
  'Best Director',
  'Best Actor',
  'Best Actress',
  'Best Supporting Actor',
  'Best Supporting Actress',
  'Best Original Screenplay',
  'Best Adapted Screenplay',
  'Best Cinematography',
  'Best Film Editing',
  'Best Production Design',
  'Best Costume Design',
  'Best Makeup and Hairstyling',
  'Best Original Score',
  'Best Original Song',
  'Best Sound',
  'Best Visual Effects',
  'Best Documentary Feature',
  'Best International Feature Film',
  'Best Animated Feature Film',
];

export default function AddNominationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [movieOpen, setMovieOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);

  // Create the form
  const form = useForm<z.infer<typeof nominationSchema>>({
    resolver: zodResolver(nominationSchema),
    defaultValues: {
      category: '',
      iteration: '',
      movie_name: '',
      movie_release_date: '',
      person_name: '',
      person_date_of_birth: '',
      user_username: user?.username
    },
  });

  // Fetch movies and persons for dropdowns
  const { data: movies = [] } = useQuery({
    queryKey: ['/api/movies'],
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['/api/persons'],
  });

  // Add nomination mutation
  const addNominationMutation = useMutation({
    mutationFn: async (values: z.infer<typeof nominationSchema>) => {
      // Add the username field
      const dataToSubmit = {
        ...values,
        user_username: user?.username,
      };
      await apiRequest('POST', '/api/user-nominations', dataToSubmit);
    },
    onSuccess: () => {
      toast({
        title: 'Nomination Added',
        description: 'Your nomination has been successfully added.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-nominations'] });
      setLocation('/nominations');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add nomination: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (values: z.infer<typeof nominationSchema>) => {
    addNominationMutation.mutate(values);
  };

  const handleMovieSelect = (movie: any) => {
    form.setValue('movie_name', movie.name);
    form.setValue('movie_release_date', movie.release_date);
    setMovieOpen(false);
  };

  const handlePersonSelect = (person: any) => {
    form.setValue('person_name', person.name);
    form.setValue('person_date_of_birth', person.date_of_birth);
    setPersonOpen(false);
  };

  return (
    <Layout title="Add Nomination">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-6">Add New Nomination</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="iteration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iteration (Year)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 95 for 95th Academy Awards"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="movie_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Movie</FormLabel>
                    <Popover open={movieOpen} onOpenChange={setMovieOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={movieOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? movies.find((movie: any) => movie.name === field.value)?.name
                              : "Search for a movie..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search movies..." />
                          <CommandEmpty>No movie found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {movies.map((movie: any) => (
                                <CommandItem
                                  key={`${movie.name}-${movie.release_date}`}
                                  onSelect={() => handleMovieSelect(movie)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      movie.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {movie.name} ({new Date(movie.release_date).getFullYear()})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="person_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Person</FormLabel>
                    <Popover open={personOpen} onOpenChange={setPersonOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={personOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? persons.find((person: any) => person.name === field.value)?.name
                              : "Search for a person..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search persons..." />
                          <CommandEmpty>No person found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {persons.map((person: any) => (
                                <CommandItem
                                  key={`${person.name}-${person.date_of_birth}`}
                                  onSelect={() => handlePersonSelect(person)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      person.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {person.name} ({new Date(person.date_of_birth).toISOString().split('T')[0]})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/nominations')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addNominationMutation.isPending}
                >
                  {addNominationMutation.isPending ? 'Submitting...' : 'Submit Nomination'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
