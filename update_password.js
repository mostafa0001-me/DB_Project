const mysql = require('mysql2/promise');
const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  try {
    // Connect to the database
    const conn = await mysql.createConnection({
      host: 'db4free.net',
      user: 'mmaakh',
      password: '1234567890',
      database: 'oscardb'
    });
    
    console.log('Database connected successfully!');
    
    // Create a properly hashed password
    const password = 'test123'; // test password for demo
    const hashedPassword = await hashPassword(password);
    console.log(`Generated hashed password: ${hashedPassword}`);
    
    // Update the user
    const sql = 'UPDATE User SET Password = ? WHERE Username = ?';
    const [result] = await conn.execute(sql, [hashedPassword, 'mmaakh']);
    
    console.log('Update result:', result);
    console.log(`Updated user 'mmaakh' with a properly formatted password`);
    
    // Verify the update
    const [rows] = await conn.execute('SELECT Username, SUBSTRING(Password, 1, 30) as PasswordPreview FROM User');
    console.table(rows);
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
