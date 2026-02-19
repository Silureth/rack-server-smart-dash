const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function getAll() {
  return db.prepare(`
    SELECT * FROM racks WHERE is_deleted = 0
  `).all();
}

function create(name) {
  const stmt = db.prepare(`
    INSERT INTO racks (id, name)
    VALUES (?, ?)
  `);
  stmt.run(uuidv4(), name);
}

module.exports = { getAll, create };
