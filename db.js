const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('app.db');

db.pragma('foreign_keys = ON');

if (!fs.existsSync('./.initialized')) {
  const initSql = fs.readFileSync('./init.sql', 'utf8');
  db.exec(initSql);
  fs.writeFileSync('./.initialized', 'yes');
}

module.exports = db;
