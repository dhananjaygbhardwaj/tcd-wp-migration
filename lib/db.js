import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "wp_import",
  password: "ssap",
  database: "wp_migration",
  charset: "utf8mb4",
});
