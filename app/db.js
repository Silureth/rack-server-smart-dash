const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.pragma('journal_mode = WAL');

if (!fs.existsSync(path.join(dataDir, '.initialized'))) {
  const initSql = fs.readFileSync('./init.sql', 'utf8');
  db.exec(initSql);
  fs.writeFileSync(path.join(dataDir, '.initialized'), 'yes');
}

module.exports = db;
