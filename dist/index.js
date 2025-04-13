// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import mysql from "mysql2/promise";
var pool = mysql.createPool({
  host: process.env.DB_HOST || "db4free.net",
  user: process.env.DB_USER || "mmaakh",
  password: process.env.DB_PASSWORD || "1234567890",
  database: process.env.DB_NAME || "oscardb",
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
async function initializeDatabase() {
  try {
    const tables = await query(`SHOW TABLES`);
    const tableNames = tables.map((t) => Object.values(t)[0]);
    console.log("Database tables:", tableNames);
    const requiredTables = [
      "Movie",
      "Person",
      "Nomination",
      "User",
      "USR_Nomination",
      "Belong"
    ];
    const missingTables = requiredTables.filter(
      (table) => !tableNames.includes(table)
    );
    if (missingTables.length > 0) {
      console.warn("Missing tables:", missingTables);
    } else {
      console.log("All required tables exist in the database");
    }
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

// server/storage.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as ExpressSession from "express-session";
import MySQLStoreFactory from "express-mysql-session";
var MySQLStore = MySQLStoreFactory(ExpressSession);
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    const options = {
      host: process.env.DB_HOST || "db4free.net",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "mmaakh",
      password: process.env.DB_PASSWORD || "1234567890",
      database: process.env.DB_NAME || "oscardb",
      createDatabaseTable: true,
      schema: {
        tableName: "sessions",
        columnNames: {
          session_id: "session_id",
          expires: "expires",
          data: "data"
        }
      }
    };
    this.sessionStore = new MySQLStore(options);
  }
  async getUser(id) {
    const sql = `SELECT * FROM User WHERE Username = ?`;
    try {
      const results = await query(sql, [id]);
      console.log("Raw user data from DB (getUser):", JSON.stringify(results, null, 2));
      if (Array.isArray(results) && results.length > 0) {
        const dbUser = results[0];
        const user = {
          id: 0,
          // Use a default ID
          username: dbUser.Username,
          password: dbUser.Password,
          birthdate: dbUser.Birthdate ? new Date(dbUser.Birthdate).toISOString().split("T")[0] : "",
          email: dbUser.Email_Address,
          gender: dbUser.Gender,
          country: dbUser.Country
        };
        console.log("Mapped user object (getUser):", { ...user, password: user.password ? "***MASKED***" : void 0 });
        return user;
      }
      return void 0;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }
  async getUserByUsername(username) {
    const sql = `SELECT * FROM User WHERE Username = ?`;
    try {
      const results = await query(sql, [username]);
      console.log("Raw user data from DB:", JSON.stringify(results, null, 2));
      if (Array.isArray(results) && results.length > 0) {
        const dbUser = results[0];
        const user = {
          id: 0,
          username: dbUser.Username,
          password: dbUser.Password,
          birthdate: dbUser.Birthdate ? new Date(dbUser.Birthdate).toISOString().split("T")[0] : "",
          email: dbUser.Email_Address,
          gender: dbUser.Gender,
          country: dbUser.Country
        };
        console.log("Mapped user object:", { ...user, password: user.password ? "***MASKED***" : void 0 });
        return user;
      }
      return void 0;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  async createUser(user) {
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
        id: 0,
        // MySQL doesn't have auto-increment IDs for Username as primary key
        password: hashedPassword
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  async getUserNominations(username) {
    const sql = `
      SELECT * FROM USR_Nomination 
      WHERE User_Username = ?
    `;
    try {
      const results = await query(sql, [username]);
      return results;
    } catch (error) {
      console.error("Error getting user nominations:", error);
      throw error;
    }
  }
  async createUserNomination(nomination) {
    const {
      category,
      iteration,
      user_username,
      movie_name,
      movie_release_date,
      person_name,
      person_date_of_birth
    } = nomination;
    let formattedMovieReleaseDate = null;
    if (movie_release_date) {
      const date = new Date(movie_release_date);
      formattedMovieReleaseDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    let formattedPersonDateOfBirth = null;
    if (person_date_of_birth) {
      const date = new Date(person_date_of_birth);
      formattedPersonDateOfBirth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    console.log("Adding nomination with explicit formatting:", {
      movie_name,
      original_movie_date: movie_release_date,
      formatted_movie_date: formattedMovieReleaseDate,
      person_name,
      original_person_date: person_date_of_birth,
      formatted_person_date: formattedPersonDateOfBirth
    });
    const sql = `
      INSERT INTO USR_Nomination 
      (Category, Iteration, User_Username, Movie_Name, Movie_Release_Date, Person_Name, Person_Date_of_Birth) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const checkMovieExists = await query(
        "SELECT * FROM Movie WHERE Name = ? AND Release_Date = ?",
        [movie_name, formattedMovieReleaseDate]
      );
      if (Array.isArray(checkMovieExists) && checkMovieExists.length === 0) {
        console.error("Movie not found in database:", {
          movie_name,
          formattedMovieReleaseDate
        });
        throw new Error(`Movie "${movie_name}" (${formattedMovieReleaseDate}) not found in database`);
      }
      await query(sql, [
        category,
        iteration,
        user_username,
        movie_name,
        formattedMovieReleaseDate,
        person_name,
        formattedPersonDateOfBirth
      ]);
      return nomination;
    } catch (error) {
      console.error("Error creating user nomination:", error);
      throw error;
    }
  }
  async deleteUserNomination(username, category, iteration, movieName, movieReleaseDate, personName, personDateOfBirth) {
    let formattedMovieReleaseDate = null;
    if (movieReleaseDate) {
      const date = new Date(movieReleaseDate);
      formattedMovieReleaseDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    let formattedPersonDateOfBirth = null;
    if (personDateOfBirth) {
      const date = new Date(personDateOfBirth);
      formattedPersonDateOfBirth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    console.log("Deleting nomination with explicit formatting:", {
      username,
      category,
      iteration,
      movieName,
      original_movie_date: movieReleaseDate,
      formatted_movie_date: formattedMovieReleaseDate,
      personName,
      original_person_date: personDateOfBirth,
      formatted_person_date: formattedPersonDateOfBirth
    });
    const checkSql = `
      SELECT * FROM USR_Nomination 
      WHERE User_Username = ? 
      AND Category = ? 
      AND Iteration = ? 
      AND Movie_Name = ? 
      AND Movie_Release_Date = ? 
      AND Person_Name = ? 
      AND Person_Date_of_Birth = ?
    `;
    try {
      const checkResult = await query(checkSql, [
        username,
        category,
        iteration,
        movieName,
        formattedMovieReleaseDate,
        personName,
        formattedPersonDateOfBirth
      ]);
      console.log("Check nomination exists result:", checkResult);
      if (Array.isArray(checkResult) && checkResult.length === 0) {
        console.error("Nomination not found for deletion:", {
          username,
          category,
          iteration,
          movieName,
          formattedMovieReleaseDate,
          personName,
          formattedPersonDateOfBirth
        });
        return false;
      }
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
      const result = await query(sql, [
        username,
        category,
        iteration,
        movieName,
        formattedMovieReleaseDate,
        personName,
        formattedPersonDateOfBirth
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting user nomination:", error);
      throw error;
    }
  }
  async validateCredentials(username, password) {
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
      console.error("Error validating credentials:", error);
      return false;
    }
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as ExpressSession2 from "express-session";
import { scrypt as scrypt2, timingSafeEqual as timingSafeEqual2 } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function comparePasswords2(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password format in database");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync2(supplied, salt, 64);
    return timingSafeEqual2(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "oscar-nominations-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24,
      // 1 day
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    }
  };
  app2.set("trust proxy", 1);
  app2.use(ExpressSession2.default(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log(`User found, validating password for: ${username}`);
        console.log(`Password format check: ${user.password?.includes(".") ? "correct" : "incorrect"}`);
        const isValid = await comparePasswords2(password, user.password);
        if (!isValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log(`Successful login for user: ${username}`);
        return done(null, user);
      } catch (err) {
        console.error("Error in LocalStrategy:", err);
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.username);
  });
  passport.deserializeUser(async (username, done) => {
    try {
      const user = await storage.getUser(username);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(req.body);
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err2) => {
        if (err2) {
          console.error("Session error during login:", err2);
          return next(err2);
        }
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/queries.ts
async function getTopNominatedMovies() {
  const sql = `
    SELECT u.Movie_Name as movie_name, u.Movie_Release_Date as release_date, 
           u.Category as category, u.Iteration as year, COUNT(*) as count
    FROM USR_Nomination u
    GROUP BY u.Movie_Name, u.Movie_Release_Date, u.Category, u.Iteration
    ORDER BY count DESC, u.Iteration DESC
    LIMIT 50
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching top nominated movies:", error);
    throw error;
  }
}
async function getStaffOscarStats(role = "") {
  let roleCriteria = "";
  if (role) {
    roleCriteria = "AND b.Role = ?";
  }
  const sql = `
    SELECT p.PName as person_name, p.Date_of_Birth as date_of_birth,
           COUNT(DISTINCT n.Category, n.Iteration) as nominations,
           SUM(CASE WHEN n.Won = 1 THEN 1 ELSE 0 END) as oscars
    FROM Person p
    JOIN Belong b ON p.PName = b.Person_Name AND p.Date_of_Birth = b.Person_Date_of_Birth
    JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
    WHERE 1=1 ${roleCriteria}
    GROUP BY p.PName, p.Date_of_Birth
    ORDER BY oscars DESC, nominations DESC
    LIMIT 100
  `;
  try {
    const params = role ? [role] : [];
    const results = await query(sql, params);
    return results;
  } catch (error) {
    console.error("Error fetching staff oscar stats:", error);
    throw error;
  }
}
async function getTopBirthCountries() {
  const sql = `
    SELECT p.Country_of_Birth as country, COUNT(DISTINCT p.PName) as count
    FROM Person p
    JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
    WHERE (n.Category = 'Actor in a Leading Role' 
        OR n.Category = 'Actress in a Leading Role'
        OR n.Category = 'Best Actor'
        OR n.Category = 'Best Actress'
        OR n.Category = 'Best Actor in a Leading Role'
        OR n.Category = 'Best Actress in a Leading Role') 
      AND n.Won = 1
      AND p.Country_of_Birth IS NOT NULL
      AND p.Country_of_Birth != ''
    GROUP BY p.Country_of_Birth
    ORDER BY count DESC
    LIMIT 5
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching top birth countries:", error);
    throw error;
  }
}
async function getStaffByCountry(country) {
  const sql = `
    SELECT p.PName as person_name, p.Date_of_Birth as date_of_birth, 
           p.Country_of_Birth as country_of_birth, n.Category as category,
           COUNT(DISTINCT n.Category, n.Iteration) as nominations,
           SUM(CASE WHEN n.Won = 1 THEN 1 ELSE 0 END) as oscars
    FROM Person p
    JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
    WHERE p.Country_of_Birth = ?
    GROUP BY p.PName, p.Date_of_Birth, p.Country_of_Birth, n.Category
    ORDER BY oscars DESC, nominations DESC
  `;
  try {
    const results = await query(sql, [country]);
    return results;
  } catch (error) {
    console.error("Error fetching staff by country:", error);
    throw error;
  }
}
async function getDreamTeam() {
  const sql = `
    -- Director with most Oscar wins
    (SELECT
      p.PName as person_name,
      p.Date_of_Birth as date_of_birth,
      'Director' as role,
      COUNT(*) as oscars,
      p.Death_Date as death_date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ') as notable_works
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND (n.Category LIKE '%Director%' OR n.Category LIKE '%Directing%')
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      COUNT(*) DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Leading Actor
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Leading Actor' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND (n.Category LIKE '%Actor in a Leading Role%' OR n.Category = 'Best Actor')
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Leading Actress
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Leading Actress' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND (n.Category LIKE '%Actress in a Leading Role%' OR n.Category = 'Best Actress')
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Supporting Actor
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Supporting Actor' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND n.Category LIKE '%Actor in a Supporting Role%'
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Supporting Actress
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Supporting Actress' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND n.Category LIKE '%Actress in a Supporting Role%'
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Producer
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Producer' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND (
        n.Category = 'Best Picture' 
        OR n.Category LIKE '%Production%' 
        OR n.Category = 'Outstanding Production'
        OR n.Category = 'Outstanding Motion Picture'
      )
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    
    UNION ALL
    
    -- Best Singer/Composer for movie score
    (SELECT
      p.PName, 
      p.Date_of_Birth, 
      'Singer' as role,
      COUNT(*) as oscars,
      p.Death_Date,
      GROUP_CONCAT(DISTINCT m.Name ORDER BY n.Iteration DESC SEPARATOR ', ')
    FROM 
      Person p
      JOIN Nomination n ON p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
      JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
    WHERE 
      p.Death_Date IS NULL
      AND n.Won = 1
      AND (
        n.Category LIKE '%Song%' 
        OR n.Category LIKE '%Music%'
        OR n.Category LIKE '%Score%'
      )
    GROUP BY 
      p.PName, p.Date_of_Birth
    ORDER BY 
      oscars DESC
    LIMIT 1)
    `;
  try {
    const results = await query(sql);
    const roleMap = /* @__PURE__ */ new Map();
    for (const result of results) {
      const role = result.role;
      const notableWorks = result.notable_works ? result.notable_works.split(", ").filter((_, i) => i < 3) : [];
      result.notable_works = notableWorks;
      if (!roleMap.has(role) || roleMap.get(role).oscars < result.oscars) {
        roleMap.set(role, result);
      }
    }
    return Array.from(roleMap.values());
  } catch (error) {
    console.error("Error fetching dream team:", error);
    throw error;
  }
}
async function getTopProductionCompanies() {
  const sql = `
    SELECT COALESCE(m.PD_company, 'Unknown') as pd_company, COUNT(*) as oscars
    FROM Movie m
    JOIN Nomination n ON m.Name = n.Movie_Name AND m.Release_Date = n.Movie_Release_Date
    WHERE n.Won = 1 AND m.PD_company IS NOT NULL AND m.PD_company != ''
    GROUP BY m.PD_company
    ORDER BY oscars DESC
    LIMIT 5
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching top production companies:", error);
    throw error;
  }
}
async function getNonEnglishMovies() {
  const sql = `
    SELECT DISTINCT
      m.Name as movie_name, 
      m.Release_Date as release_date, 
      m.Language as language, 
      n.Iteration as year,
      n.Category as category,
      COALESCE(m.PD_company, 'Unknown') as pd_company,
      p.PName as director
    FROM 
      Movie m
      JOIN Nomination n ON m.Name = n.Movie_Name AND m.Release_Date = n.Movie_Release_Date
      LEFT JOIN Belong b ON m.Name = b.Movie_Name AND m.Release_Date = b.Movie_Release_Date AND b.Role = 'Director'
      LEFT JOIN Person p ON b.Person_Name = p.PName AND b.Person_Date_of_Birth = p.Date_of_Birth
    WHERE 
      m.Language != 'English' AND m.Language IS NOT NULL AND m.Language != '' AND n.Won = 1
    ORDER BY 
      n.Iteration DESC
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching non-English movies:", error);
    throw error;
  }
}
async function getAllPersons() {
  const sql = `
    SELECT p.PName as name, p.Date_of_Birth as date_of_birth 
    FROM Person p 
    ORDER BY p.PName
    LIMIT 1000
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching persons:", error);
    throw error;
  }
}
async function getAllMovies() {
  const sql = `
    SELECT m.Name as name, m.Release_Date as release_date 
    FROM Movie m 
    ORDER BY m.Name
    LIMIT 1000
  `;
  try {
    const results = await query(sql);
    return results;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
}
async function getUserNominations(username) {
  const sql = `
    SELECT 
      un.Category as category,
      un.Iteration as iteration,
      un.Movie_Name as movie_name,
      un.Movie_Release_Date as movie_release_date,
      un.Person_Name as person_name,
      un.Person_Date_of_Birth as person_date_of_birth,
      p.Date_of_Birth as date_of_birth
    FROM 
      USR_Nomination un
      LEFT JOIN Person p ON un.Person_Name = p.PName AND un.Person_Date_of_Birth = p.Date_of_Birth
    WHERE 
      un.User_Username = ?
    ORDER BY
      un.Category, un.Iteration DESC
  `;
  try {
    const results = await query(sql, [username]);
    return results;
  } catch (error) {
    console.error("Error fetching user nominations:", error);
    throw error;
  }
}
async function getDashboardStats() {
  try {
    const totalNominationsQuery = `SELECT COUNT(*) as count FROM Nomination`;
    const totalNominations = await query(totalNominationsQuery);
    const totalWinnersQuery = `SELECT COUNT(*) as count FROM Nomination WHERE Won = 1`;
    const totalWinners = await query(totalWinnersQuery);
    const userNominationsQuery = `SELECT COUNT(*) as count FROM USR_Nomination`;
    const userNominations = await query(userNominationsQuery);
    const recentNominationsQuery = `
      SELECT 
        un.User_Username as username,
        un.Movie_Name as movie_name,
        un.Person_Name as person_name,
        un.Category as category,
        un.Iteration as iteration
      FROM USR_Nomination un
      ORDER BY un.User_Username DESC
      LIMIT 5
    `;
    const recentNominations = await query(recentNominationsQuery);
    const topCategoriesQuery = `
      SELECT Category as category, COUNT(*) as count
      FROM Nomination
      GROUP BY Category
      ORDER BY count DESC
      LIMIT 5
    `;
    const topCategories = await query(topCategoriesQuery);
    const recentWinnersQuery = `
      SELECT DISTINCT
        m.Name as movie_name,
        n.Category as category,
        n.Iteration as iteration
      FROM 
        Nomination n
        JOIN Movie m ON n.Movie_Name = m.Name AND n.Movie_Release_Date = m.Release_Date
      WHERE 
        n.Won = 1 AND (
        n.Category = 'Best Picture'
        OR n.Category = 'Best Animated Feature Film'
        OR n.Category = 'Best International Feature Film'
        OR n.Category = 'Best Foreign Language Film'
        OR n.Category = 'Best Documentary Feature Film'
        OR n.Category LIKE '%Picture%'
        OR n.Category LIKE '%Film%'
        OR n.Category LIKE '%Motion Picture%'
        OR n.Category LIKE '%Production%'
      )
      ORDER BY 
        n.Iteration DESC
      LIMIT 3
    `;
    const recentWinners = await query(recentWinnersQuery);
    return {
      totalNominations: totalNominations[0].count,
      totalWinners: totalWinners[0].count,
      userNominations: userNominations[0].count,
      recentNominations,
      topCategories,
      recentWinners
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

// shared/schema.ts
import { z } from "zod";
var userSchema = z.object({
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
var movieSchema = z.object({
  name: z.string(),
  release_date: z.string(),
  runtime: z.number().optional(),
  language: z.string(),
  pd_company: z.string()
});
var personSchema = z.object({
  name: z.string(),
  date_of_birth: z.string(),
  country_of_birth: z.string(),
  death_date: z.string().nullable().optional()
});
var nominationSchema = z.object({
  category: z.string(),
  iteration: z.number(),
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string(),
  won: z.boolean()
});
var userNominationSchema = z.object({
  category: z.string(),
  iteration: z.number(),
  user_username: z.string(),
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string()
});
var belongSchema = z.object({
  movie_name: z.string(),
  movie_release_date: z.string(),
  person_name: z.string(),
  person_date_of_birth: z.string(),
  role: z.string()
});
var insertUserSchema = userSchema.omit({ id: true });
var insertUserNominationSchema = userNominationSchema;

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  await initializeDatabase();
  setupAuth(app2);
  app2.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/top-nominated-movies", async (req, res) => {
    try {
      const movies = await getTopNominatedMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching top nominated movies:", error);
      res.status(500).json({ message: "Failed to fetch top nominated movies" });
    }
  });
  app2.get("/api/staff-oscars", async (req, res) => {
    try {
      const role = req.query.role;
      const stats = await getStaffOscarStats(role);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching staff oscar stats:", error);
      res.status(500).json({ message: "Failed to fetch staff oscar statistics" });
    }
  });
  app2.get("/api/top-birth-countries", async (req, res) => {
    try {
      const countries = await getTopBirthCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching top birth countries:", error);
      res.status(500).json({ message: "Failed to fetch top birth countries" });
    }
  });
  app2.get("/api/staff-by-country", async (req, res) => {
    try {
      const country = req.query.country;
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
  app2.get("/api/dream-team", async (req, res) => {
    try {
      const dreamTeam = await getDreamTeam();
      res.json(dreamTeam);
    } catch (error) {
      console.error("Error fetching dream team:", error);
      res.status(500).json({ message: "Failed to fetch dream team" });
    }
  });
  app2.get("/api/top-production-companies", async (req, res) => {
    try {
      const companies = await getTopProductionCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching top production companies:", error);
      res.status(500).json({ message: "Failed to fetch top production companies" });
    }
  });
  app2.get("/api/non-english-movies", async (req, res) => {
    try {
      const movies = await getNonEnglishMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching non-English movies:", error);
      res.status(500).json({ message: "Failed to fetch non-English movies" });
    }
  });
  app2.get("/api/persons", async (req, res) => {
    try {
      const persons = await getAllPersons();
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      res.status(500).json({ message: "Failed to fetch persons" });
    }
  });
  app2.get("/api/movies", async (req, res) => {
    try {
      const movies = await getAllMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error);
      res.status(500).json({ message: "Failed to fetch movies" });
    }
  });
  app2.get("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const username = req.user.username;
      const nominations = await getUserNominations(username);
      res.json(nominations);
    } catch (error) {
      console.error("Error fetching user nominations:", error);
      res.status(500).json({ message: "Failed to fetch user nominations" });
    }
  });
  app2.post("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const validatedData = insertUserNominationSchema.parse(req.body);
      const nomination = await storage.createUserNomination(validatedData);
      res.status(201).json(nomination);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid nomination data", errors: error.errors });
      }
      console.error("Error creating user nomination:", error);
      res.status(500).json({ message: "Failed to create user nomination" });
    }
  });
  app2.delete("/api/user-nominations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const {
        category,
        iteration,
        movie_name,
        movie_release_date,
        person_name,
        person_date_of_birth
      } = req.body;
      if (!category || !iteration || !movie_name || !movie_release_date || !person_name || !person_date_of_birth) {
        return res.status(400).json({ message: "Missing required fields for deletion" });
      }
      const username = req.user.username;
      const success = await storage.deleteUserNomination(
        username,
        category,
        iteration,
        movie_name,
        movie_release_date,
        person_name,
        person_date_of_birth
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
