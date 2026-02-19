const db = require('../db');

function getByRackItem(rackItemId) {
  return db.prepare(`
    SELECT *
    FROM rack_item_sockets
    WHERE rack_item_id = ?
      AND is_deleted = 0
    ORDER BY position_index
  `).all(rackItemId);
}

function add(rackItemId, data) {
  db.prepare(`
    INSERT INTO rack_item_sockets
      (rack_item_id, name, type, position_index)
    VALUES (?, ?, ?, ?)
  `).run(
    rackItemId,
    data.name,
    data.type || null,
    data.position_index || 0
  );
}

function softDelete(id) {
  db.prepare(`
    UPDATE rack_item_sockets
    SET is_deleted = 1
    WHERE id = ?
  `).run(id);
}

function reorder(rackItemId, orderedIds) {

  const update = db.prepare(`
    UPDATE rack_item_sockets
    SET position_index = ?
    WHERE id = ?
      AND rack_item_id = ?
  `);

  const tx = db.transaction((ids) => {
    ids.forEach((id, index) => {
      update.run(index + 1, id, rackItemId);
    });
  });

  tx(orderedIds);
}

module.exports = {
  getByRackItem,
  add,
  softDelete,
  reorder
};
