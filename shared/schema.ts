import { z } from "zod";

// Define Zod schemas for the database tables

export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  birthdate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
  email: z.string().email(),
  gender: z.enum(["Male", "Female", "Other"]),
  country: z.string().min(1)
});

export const movieSchema = z.object({
  name: z.string(),
  release_date: z.string(),
  runtime: z.number().optional(),
  language: z.string(),
  pd_company: z.string()
});

export const personSchema = z.object({
  name: z.string(),
  date_of_birth: z.string(),
  country_of_birth: z.string(),
  death_date: z.string().nullable().optional()
});

export const nominationSchema = z.object({
  category: z.string(),
  iteration: z.number(),
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string(),
  won: z.boolean()
});

export const userNominationSchema = z.object({
  category: z.string(),
  iteration: z.number(),
  user_username: z.string(),
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string()
});

export const belongSchema = z.object({
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string(),
  role: z.string()
});

// Define insert schemas - these are the same as the original schemas since we're not using Drizzle ORM
export const insertUserSchema = userSchema.omit({ id: true });
export const insertMovieSchema = movieSchema;
export const insertPersonSchema = personSchema;
export const insertNominationSchema = nominationSchema;
export const insertUserNominationSchema = userNominationSchema;
export const insertBelongSchema = belongSchema;

// Define types
export type User = z.infer<typeof userSchema>;
export type Movie = z.infer<typeof movieSchema>;
export type Person = z.infer<typeof personSchema>;
export type Nomination = z.infer<typeof nominationSchema>;
export type UserNomination = z.infer<typeof userNominationSchema>;
export type Belong = z.infer<typeof belongSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertNomination = z.infer<typeof insertNominationSchema>;
export type InsertUserNomination = z.infer<typeof insertUserNominationSchema>;
export type InsertBelong = z.infer<typeof insertBelongSchema>;

// Additional types for statistics
export type TopNominatedMovie = {
  movie_name: string;
  release_date: string;
  category: string;
  year: number;
  count: number;
};

export type StaffOscarStats = {
  person_name: string;
  date_of_birth: string;
  nominations: number;
  oscars: number;
};

export type BirthCountry = {
  country: string;
  count: number;
};

export type StaffByCountry = {
  person_name: string;
  date_of_birth: string;
  country_of_birth: string;
  category: string;
  nominations: number;
  oscars: number;
};

export type DreamTeamMember = {
  person_name: string;
  date_of_birth: string;
  role: string;
  oscars: number;
  death_date: string | null;
  notable_works: string[];
};

export type ProductionCompany = {
  pd_company: string;
  oscars: number;
};

export type NonEnglishMovie = {
  movie_name: string;
  release_date: string;
  language: string;
  year: number;
  category: string;
  pd_company: string;
  director: string;
};
