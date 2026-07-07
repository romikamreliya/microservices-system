const mysql = require("mysql2");

// MySQL connection pool for raw SQL queries (used outside of Prisma).
//
// Prefers the discrete DB_* variables so it does NOT collide with Prisma's
// DATABASE_URL (which is a sqlite `file:` URL). Falls back to a mysql://
// DATABASE_URL only when the discrete host is not configured.
const config = process.env.DB_HOST
  ? {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    }
  : { uri: process.env.DATABASE_URL };

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  queueLimit: 0,
});

// Promise-based interface so callers can use async/await with parameterized
// statements: db.query(sql, params) / db.execute(sql, params). Always pass
// dynamic values through `?` placeholders — never concatenate into the SQL.
const db = pool.promise();

/**
 * Run work inside a single transaction. The callback receives a pooled
 * connection; its query/execute use `?` placeholders. Commits on success,
 * rolls back on any thrown error, and always releases the connection.
 *
 * @param {(conn: import("mysql2/promise").PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 * @template T
 *
 * @example
 * await database.mysql.transaction(async (conn) => {
 *   await conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, from]);
 *   await conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amt, to]);
 * });
 */
db.transaction = async (callback) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = db;
