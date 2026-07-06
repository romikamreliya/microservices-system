const mysql = require("mysql2");

// MySQL connection pool for raw SQL queries (used outside of Prisma).
// Reads the MySQL connection string from DATABASE_URL, e.g.
// mysql://user:pass@host:3306/database
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
