import Database from 'better-sqlite3';

const db = new Database('tickets.db');

export default db;