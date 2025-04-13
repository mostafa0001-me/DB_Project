import { query, pool } from './db';
import {
  User, InsertUser, UserNomination, InsertUserNomination
} from '@shared/schema';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import * as ExpressSession from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

const MySQLStore = MySQLStoreFactory(ExpressSession);
const scryptAsync = promisify(scrypt);

// Functions for hashing and comparing passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserNominations(username: string): Promise<UserNomination[]>;
  createUserNomination(nomination: InsertUserNomination): Promise<UserNomination>;
  deleteUserNomination(username: string, category: string, iteration: number, movieName: string, movieReleaseDate: string, personName: string, personDateOfBirth: string): Promise<boolean>;
  sessionStore: ExpressSession.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: ExpressSession.Store;

  constructor() {
    // Create MySQL session store
    const options = {
      host: process.env.DB_HOST || 'db4free.net',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'mmaakh',
      password: process.env.DB_PASSWORD || '1234567890',
      database: process.env.DB_NAME || 'oscardb',
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    };
    
    this.sessionStore = new MySQLStore(options);
  }

  async getUser(id: string): Promise<User | undefined> {
    const sql = `SELECT * FROM User WHERE Username = ?`;
    try {
      const results = await query(sql, [id]);
      console.log('Raw user data from DB (getUser):', JSON.stringify(results, null, 2));
      
      // Map database fields to expected schema
      if (Array.isArray(results) && results.length > 0) {
        const dbUser = results[0] as any;
        const user: User = {
          id: 0, // Use a default ID
          username: dbUser.Username,
          password: dbUser.Password,
          birthdate: dbUser.Birthdate ? new Date(dbUser.Birthdate).toISOString().split('T')[0] : '',
          email: dbUser.Email_Address,
          gender: dbUser.Gender as any,
          country: dbUser.Country
        };
        console.log('Mapped user object (getUser):', { ...user, password: user.password ? '***MASKED***' : undefined });
        return user;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const sql = `SELECT * FROM User WHERE Username = ?`;
    try {
      const results = await query(sql, [username]);
      console.log('Raw user data from DB:', JSON.stringify(results, null, 2));
      
      // Map database fields to expected schema
      if (Array.isArray(results) && results.length > 0) {
        const dbUser = results[0] as any;
        const user: User = {
          id: 0,
          username: dbUser.Username,
          password: dbUser.Password,
          birthdate: dbUser.Birthdate ? new Date(dbUser.Birthdate).toISOString().split('T')[0] : '',
          email: dbUser.Email_Address,
          gender: dbUser.Gender as any,
          country: dbUser.Country
        };
        console.log('Mapped user object:', { ...user, password: user.password ? '***MASKED***' : undefined });
        return user;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const { username, password, birthdate, email, gender, country } = user;
    const hashedPassword = await hashPassword(password);

    const sql = `
      INSERT INTO User (Username, Birthdate, Email_Address, Gender, Country, Password) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      await query(sql, [username, birthdate, email, gender, country, hashedPassword]);
      
      return {
        ...user,
        id: 0, // MySQL doesn't have auto-increment IDs for Username as primary key
        password: hashedPassword
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserNominations(username: string): Promise<UserNomination[]> {
    const sql = `
      SELECT * FROM USR_Nomination 
      WHERE User_Username = ?
    `;
    
    try {
      const results = await query(sql, [username]);
      return results as UserNomination[];
    } catch (error) {
      console.error('Error getting user nominations:', error);
      throw error;
    }
  }

  async createUserNomination(nomination: InsertUserNomination): Promise<UserNomination> {
    const { 
      category, iteration, user_username, 
      movie_name, movie_release_date, 
      person_name, person_date_of_birth 
    } = nomination;
    
    // Format dates for MySQL - convert ISO dates to YYYY-MM-DD format
    const formattedMovieReleaseDate = movie_release_date ? 
      new Date(movie_release_date).toISOString().split('T')[0] : null;
    
    const formattedPersonDateOfBirth = person_date_of_birth ? 
      new Date(person_date_of_birth).toISOString().split('T')[0] : null;
    
    console.log('Adding nomination with formatted dates:', {
      original_movie_date: movie_release_date,
      formatted_movie_date: formattedMovieReleaseDate,
      original_person_date: person_date_of_birth,
      formatted_person_date: formattedPersonDateOfBirth
    });

    const sql = `
      INSERT INTO USR_Nomination 
      (Category, Iteration, User_Username, Movie_Name, Movie_Release_Date, Person_Name, Person_Date_of_Birth) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      await query(sql, [
        category, iteration, user_username, 
        movie_name, formattedMovieReleaseDate, 
        person_name, formattedPersonDateOfBirth
      ]);
      
      return nomination;
    } catch (error) {
      console.error('Error creating user nomination:', error);
      throw error;
    }
  }

  async deleteUserNomination(
    username: string, 
    category: string, 
    iteration: number, 
    movieName: string, 
    movieReleaseDate: string, 
    personName: string, 
    personDateOfBirth: string
  ): Promise<boolean> {
    // Format dates for MySQL - convert ISO dates to YYYY-MM-DD format
    const formattedMovieReleaseDate = movieReleaseDate ? 
      new Date(movieReleaseDate).toISOString().split('T')[0] : null;
    
    const formattedPersonDateOfBirth = personDateOfBirth ? 
      new Date(personDateOfBirth).toISOString().split('T')[0] : null;
    
    const sql = `
      DELETE FROM USR_Nomination 
      WHERE User_Username = ? 
      AND Category = ? 
      AND Iteration = ? 
      AND Movie_Name = ? 
      AND Movie_Release_Date = ? 
      AND Person_Name = ? 
      AND Person_Date_of_Birth = ?
    `;
    
    try {
      const result: any = await query(sql, [
        username, category, iteration, 
        movieName, formattedMovieReleaseDate, 
        personName, formattedPersonDateOfBirth
      ]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user nomination:', error);
      throw error;
    }
  }

  async validateCredentials(username: string, password: string): Promise<boolean> {
    try {
      console.log(`Validating credentials for user: ${username}`);
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return false;
      }
      
      console.log(`User found, has password: ${Boolean(user.password)}`);
      if (!user.password) {
        console.error(`User ${username} has no password set`);
        return false;
      }
      
      const isValid = await comparePasswords(password, user.password);
      console.log(`Password validation result for ${username}: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
