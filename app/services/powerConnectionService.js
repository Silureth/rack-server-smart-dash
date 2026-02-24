const db = require('../db');

function connect(inputId, outletId) {
  db.prepare(`
    INSERT INTO power_connections (input_id, outlet_id)
    VALUES (?, ?)
  `).run(inputId, outletId);
}

function disconnectByInput(inputId) {
  db.prepare(`
    DELETE FROM power_connections
    WHERE input_id = ?
  `).run(inputId);
}

function getByRackItem(rackItemId) {
  return db.prepare(`
    SELECT pc.*, pi.rack_item_id as device_id
    FROM power_connections pc
    JOIN rack_item_power_inputs pi
      ON pc.input_id = pi.id
    WHERE pi.rack_item_id = ?
  `).all(rackItemId);
}

function getAll() {
  return db.prepare(`
    SELECT * FROM power_connections
  `).all();
}

function getFreeOutlets(param) {
  return db.prepare(`
  SELECT *
  FROM rack_item_power_outlets
  WHERE id NOT IN (${param.length ? param.join(',') : 0})
  AND is_deleted = 0
  `).all();
}

module.exports = {
  connect,
  disconnectByInput,
  getByRackItem,
  getAll,
  getFreeOutlets
};
