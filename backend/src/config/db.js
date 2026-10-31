const path = require('path');
const mysql = require('mysql2');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing database configuration: ${missing.join(', ')}. Copy backend/.env.example to backend/.env and fill it in.`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const promisePool = pool.promise();
module.exports = promisePool;
