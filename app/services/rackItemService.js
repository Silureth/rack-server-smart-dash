const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function getByRack(rackId) {
  return db.prepare(`
    SELECT * FROM rack_items
    WHERE rack_id = ?
    AND is_deleted = 0
  `).all(rackId);
}

function create(data) {

  const id = uuidv4();

  db.prepare(`
    INSERT INTO rack_items (
      id, rack_id, type, name, brand, sn,
      orientation, height_u, position_u_start
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.rack_id,
    data.type,
    data.name,
    data.brand,
    data.sn,
    data.orientation,
    data.height_u,
    data.position_u_start
  );

  return id;
}

function softDelete(id) {
  db.prepare(`
    UPDATE rack_items
    SET is_deleted = 1
    WHERE id = ?
  `).run(id);
}

module.exports = {
  getByRack,
  create,
  softDelete
};
