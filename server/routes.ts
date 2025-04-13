import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { initializeDatabase } from "./db";
import { 
  getTopNominatedMovies, getStaffOscarStats, getTopBirthCountries,
  getStaffByCountry, getDreamTeam, getTopProductionCompanies,
  getNonEnglishMovies, getAllPersons, getAllMovies,
  getUserNominations, getDashboardStats
} from "./queries";
import { insertUserNominationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the database
  await initializeDatabase();
  
  // Setup authentication routes
  setupAuth(app);
  
  // API routes
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Top nominated movies endpoint
  app.get("/api/top-nominated-movies", async (req, res) => {
    try {
      const movies = await getTopNominatedMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching top nominated movies:", error);
      res.status(500).json({ message: "Failed to fetch top nominated movies" });
    }
  });

  // Staff Oscar stats endpoint
  app.get("/api/staff-oscars", async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const stats = await getStaffOscarStats(role);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching staff oscar stats:", error);
      res.status(500).json({ message: "Failed to fetch staff oscar statistics" });
    }
  });

  // Top birth countries endpoint
  app.get("/api/top-birth-countries", async (req, res) => {
    try {
      const countries = await getTopBirthCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching top birth countries:", error);
      res.status(500).json({ message: "Failed to fetch top birth countries" });
    }
  });

  // Staff by country endpoint
  app.get("/api/staff-by-country", async (req, res) => {
    try {
      const country = req.query.country as string;
      if (!country) {
        return res.status(400).json({ message: "Country parameter is required" });
      }
      
      const staff = await getStaffByCountry(country);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff by country:", error);
      res.status(500).json({ message: "Failed to fetch staff by country" });
    }
  });

  // Dream team endpoint
  app.get("/api/dream-team", async (req, res) => {
    try {
      const dreamTeam = await getDreamTeam();
      res.json(dreamTeam);
    } catch (error) {
      console.error("Error fetching dream team:", error);
      res.status(500).json({ message: "Failed to fetch dream team" });
    }
  });

  // Top production companies endpoint
  app.get("/api/top-production-companies", async (req, res) => {
    try {
      const companies = await getTopProductionCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching top production companies:", error);
      res.status(500).json({ message: "Failed to fetch top production companies" });
    }
  });

  // Non-English movies endpoint
  app.get("/api/non-english-movies", async (req, res) => {
    try {
      const movies = await getNonEnglishMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching non-English movies:", error);
      res.status(500).json({ message: "Failed to fetch non-English movies" });
    }
  });

  // Helper endpoints for dropdowns
  app.get("/api/persons", async (req, res) => {
    try {
      const persons = await getAllPersons();
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      res.status(500).json({ message: "Failed to fetch persons" });
    }
  });

  app.get("/api/movies", async (req, res) => {
    try {
      const movies = await getAllMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error);
      res.status(500).json({ message: "Failed to fetch movies" });
    }
  });

  // User nominations endpoints
  app.get("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const username = (req.user as Express.User).username;
      const nominations = await getUserNominations(username);
      res.json(nominations);
    } catch (error) {
      console.error("Error fetching user nominations:", error);
      res.status(500).json({ message: "Failed to fetch user nominations" });
    }
  });

  app.post("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const validatedData = insertUserNominationSchema.parse(req.body);
      const nomination = await storage.createUserNomination(validatedData);
      res.status(201).json(nomination);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid nomination data", errors: error.errors });
      }
      console.error("Error creating user nomination:", error);
      res.status(500).json({ message: "Failed to create user nomination" });
    }
  });

  app.delete("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { 
        category, iteration, movie_name, movie_release_date, 
        person_name, person_date_of_birth 
      } = req.body;
      
      if (!category || !iteration || !movie_name || !movie_release_date || !person_name || !person_date_of_birth) {
        return res.status(400).json({ message: "Missing required fields for deletion" });
      }
      
      const username = (req.user as Express.User).username;
      const success = await storage.deleteUserNomination(
        username, category, iteration, movie_name, 
        movie_release_date, person_name, person_date_of_birth
      );
      
      if (success) {
        res.status(200).json({ message: "Nomination deleted successfully" });
      } else {
        res.status(404).json({ message: "Nomination not found" });
      }
    } catch (error) {
      console.error("Error deleting user nomination:", error);
      res.status(500).json({ message: "Failed to delete user nomination" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
