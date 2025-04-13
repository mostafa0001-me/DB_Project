import { query } from './db';
import { 
  TopNominatedMovie, StaffOscarStats, BirthCountry, 
  StaffByCountry, DreamTeamMember, ProductionCompany, 
  NonEnglishMovie 
} from '@shared/schema';

// Get top nominated movies by system users in each category/year
export async function getTopNominatedMovies(): Promise<TopNominatedMovie[]> {
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
    return results as TopNominatedMovie[];
  } catch (error) {
    console.error('Error fetching top nominated movies:', error);
    throw error;
  }
}

// Show the total nominations and oscars for a given director, actor, and singer
export async function getStaffOscarStats(role: string = ''): Promise<StaffOscarStats[]> {
  let roleCriteria = '';
  if (role) {
    roleCriteria = 'AND b.Role = ?';
  }

  const sql = `
    SELECT 
      p.PName as person_name, 
      p.Date_of_Birth as date_of_birth,
      b.Role as role,
      COUNT(DISTINCT CONCAT(n.Category, '-', n.Iteration)) as nominations,
      SUM(CASE WHEN n.Won = 1 THEN 1 ELSE 0 END) as oscars,
      GROUP_CONCAT(DISTINCT CASE WHEN n.Won = 1 THEN n.Category ELSE NULL END SEPARATOR ', ') as won_categories
    FROM 
      Person p
      JOIN Belong b ON p.PName = b.Person_Name AND p.Date_of_Birth = b.Person_Date_of_Birth
      JOIN Nomination n ON b.Movie_Name = n.Movie_Name AND b.Movie_Release_Date = n.Movie_Release_Date 
                       AND p.PName = n.Person_Name AND p.Date_of_Birth = n.Person_Date_of_Birth
    WHERE 
      1=1 ${roleCriteria}
    GROUP BY 
      p.PName, p.Date_of_Birth, b.Role
    ORDER BY 
      oscars DESC, nominations DESC
    LIMIT 100
  `;

  try {
    const params = role ? [role] : [];
    const results = await query(sql, params);
    return results as StaffOscarStats[];
  } catch (error) {
    console.error('Error fetching staff oscar stats:', error);
    throw error;
  }
}

// Show the top 5 birth countries for actors who won the best actor category
export async function getTopBirthCountries(): Promise<BirthCountry[]> {
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
    return results as BirthCountry[];
  } catch (error) {
    console.error('Error fetching top birth countries:', error);
    throw error;
  }
}

// Show all the nominated staff members born in a given country
export async function getStaffByCountry(country: string): Promise<StaffByCountry[]> {
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
    return results as StaffByCountry[];
  } catch (error) {
    console.error('Error fetching staff by country:', error);
    throw error;
  }
}

// Dream Team - Extract the living cast members that can create the best movie ever
export async function getDreamTeam(): Promise<DreamTeamMember[]> {
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
    const results = await query(sql) as any[];

    // Create a map of roles to their top Oscar winners
    const roleMap = new Map<string, DreamTeamMember>();

    for (const result of results) {
      const role = result.role;

      // Extract notable works
      const notableWorks = result.notable_works ? 
        result.notable_works.split(', ').filter((_: string, i: number) => i < 3) : 
        [];

      result.notable_works = notableWorks;

      // If we haven't seen this role or this person has more oscars than the current best
      if (!roleMap.has(role) || roleMap.get(role)!.oscars < result.oscars) {
        roleMap.set(role, result as DreamTeamMember);
      }
    }

    // Get the dream team - one top person per role
    return Array.from(roleMap.values()) as DreamTeamMember[];
  } catch (error) {
    console.error('Error fetching dream team:', error);
    throw error;
  }
}

// Show the top 5 production companies by number of won Oscars
export async function getTopProductionCompanies(): Promise<ProductionCompany[]> {
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
    return results as ProductionCompany[];
  } catch (error) {
    console.error('Error fetching top production companies:', error);
    throw error;
  }
}

// List all non-English speaking movies that ever won an oscar, with the year
export async function getNonEnglishMovies(): Promise<NonEnglishMovie[]> {
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
    return results as NonEnglishMovie[];
  } catch (error) {
    console.error('Error fetching non-English movies:', error);
    throw error;
  }
}

// Get all persons for dropdown lists (for adding nominations)
export async function getAllPersons() {
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
    console.error('Error fetching persons:', error);
    throw error;
  }
}

// Get all movies for dropdown lists (for adding nominations)
export async function getAllMovies() {
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
    console.error('Error fetching movies:', error);
    throw error;
  }
}

// Get user nominations
export async function getUserNominations(username: string) {
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
    console.error('Error fetching user nominations:', error);
    throw error;
  }
}

// Dashboard stats
export async function getDashboardStats() {
  try {
    // Total nominations
    const totalNominationsQuery = `SELECT COUNT(*) as count FROM Nomination`;
    const totalNominations = await query(totalNominationsQuery);

    // Total Oscar winners
    const totalWinnersQuery = `SELECT COUNT(*) as count FROM Nomination WHERE Won = 1`;
    const totalWinners = await query(totalWinnersQuery);

    // User nominations
    const userNominationsQuery = `SELECT COUNT(*) as count FROM USR_Nomination`;
    const userNominations = await query(userNominationsQuery);

    // Recent user nominations
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

    // Top categories
    const topCategoriesQuery = `
      SELECT Category as category, COUNT(*) as count
      FROM Nomination
      GROUP BY Category
      ORDER BY count DESC
      LIMIT 5
    `;
    const topCategories = await query(topCategoriesQuery);

    // Recent winners
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
      totalNominations: (totalNominations as any[])[0].count,
      totalWinners: (totalWinners as any[])[0].count,
      userNominations: (userNominations as any[])[0].count,
      recentNominations,
      topCategories,
      recentWinners
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}