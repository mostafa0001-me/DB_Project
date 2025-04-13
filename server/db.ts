import mysql from 'mysql2/promise';

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db4free.net',
  user: process.env.DB_USER || 'mmaakh',
  password: process.env.DB_PASSWORD || '1234567890',
  database: process.env.DB_NAME || 'oscardb',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Execute a database query
async function query(sql: string, params?: any[]) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize the database, checking that all tables exist
async function initializeDatabase() {
  try {
    // Check if tables exist
    const tables = await query(`SHOW TABLES`);
    const tableNames = (tables as any[]).map(t => Object.values(t)[0]);
    
    console.log('Database tables:', tableNames);
    
    const requiredTables = [
      'Movie', 'Person', 'Nomination', 'User', 'USR_Nomination', 'Belong'
    ];
    
    const missingTables = requiredTables.filter(table => 
      !tableNames.includes(table)
    );
    
    if (missingTables.length > 0) {
      console.warn('Missing tables:', missingTables);
    } else {
      console.log('All required tables exist in the database');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

export { pool, query, testConnection, initializeDatabase };
