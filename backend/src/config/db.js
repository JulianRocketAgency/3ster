import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "driestar",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_NAME || "driestar_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
