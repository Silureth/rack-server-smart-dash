const db = require('../db');

function getByRackItem(rackItemId) {
  return db.prepare(`
    SELECT * FROM rack_item_power_outlets
    WHERE rack_item_id = ?
      AND is_deleted = 0
    ORDER BY position_index, id
  `).all(rackItemId);
}

function add(rackItemId, data) {
  db.prepare(`
    INSERT INTO rack_item_power_outlets
    (rack_item_id, name, type)
    VALUES (?, ?, ?)
  `).run(
    rackItemId,
    data.name,
    data.type || null
  );
}

module.exports = {
  getByRackItem,
  add
};
