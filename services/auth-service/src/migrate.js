require('dotenv').config();
const mysql = require('mysql2/promise');
 
async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
 
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await conn.query(`USE \`${process.env.DB_NAME}\``);
 
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          CHAR(36)     PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) NOT NULL UNIQUE,
      password    VARCHAR(255),
      oauth_provider VARCHAR(50)  DEFAULT NULL,
      oauth_id    VARCHAR(255) DEFAULT NULL,
      avatar      TEXT         DEFAULT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
 
  await conn.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          CHAR(36)     PRIMARY KEY,
      user_id     CHAR(36)     NOT NULL,
      token       TEXT         NOT NULL,
      expires_at  DATETIME     NOT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
 
  await conn.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id          CHAR(36)     PRIMARY KEY,
      token_jti   VARCHAR(255) NOT NULL UNIQUE,
      expires_at  DATETIME     NOT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_jti (token_jti)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
 
  console.log('Migration auth_db selesai: users, refresh_tokens, token_blacklist');
  await conn.end();
}
 
migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});