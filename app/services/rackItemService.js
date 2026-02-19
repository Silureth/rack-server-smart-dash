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

  // Collision detection
  const existing = getByRack(data.rack_id);

  for (const item of existing) {

    if (item.orientation !== data.orientation) continue;

    const existingEnd =
      item.position_u_start + item.height_u - 1;

    const newEnd =
      data.position_u_start + data.height_u - 1;

    const collision =
      data.position_u_start <= existingEnd &&
      newEnd >= item.position_u_start;

    if (collision) {
      throw new Error("U space collision detected");
    }
  }
  const allowedTypes = ['server', 'switch', 'pdu'];
  data.type = String(data.type).toLowerCase();

  if (!allowedTypes.includes(data.type)) {
    throw new Error("Invalid rack item type");
  }

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

function update(data) {
  const allowedTypes = ['server', 'switch', 'pdu'];

  if (!allowedTypes.includes(data.type)) {
    throw new Error("Invalid rack item type");
  }

  db.prepare(`
    UPDATE rack_items
    SET
      name = ?,
      brand = ?,
      sn = ?,
      type = ?,
      orientation = ?,
      height_u = ?,
      position_u_start = ?
    WHERE id = ?
  `).run(
    data.name,
    data.brand,
    data.sn,
    data.type,
    data.orientation,
    data.height_u,
    data.position_u_start,
    data.id
  );
}


function move(id, newPosition, newOrientation) {

  const item = db.prepare(`
    SELECT * FROM rack_items
    WHERE id = ? AND is_deleted = 0
  `).get(id);

  if (!item) throw new Error("Item not found");

  const rack = db.prepare(`
    SELECT * FROM racks WHERE id = ?
  `).get(item.rack_id);

  if (!rack) throw new Error("Rack not found");

  if (newPosition < 1)
    throw new Error("Invalid position");

  if (newPosition + item.height_u - 1 > rack.height_u)
    throw new Error("Exceeds rack height");

  const others = db.prepare(`
    SELECT * FROM rack_items
    WHERE rack_id = ?
    AND orientation = ?
    AND id != ?
    AND is_deleted = 0
  `).all(item.rack_id, newOrientation, id);

  for (const s of others) {

    const end = s.position_u_start + s.height_u - 1;
    const newEnd = newPosition + item.height_u - 1;

    if (
      newPosition <= end &&
      newEnd >= s.position_u_start
    ) {
      throw new Error("Collision detected");
    }
  }

  db.prepare(`
    UPDATE rack_items
    SET position_u_start = ?, orientation = ?
    WHERE id = ?
  `).run(newPosition, newOrientation, id);
}

function resize(id, newHeight) {

  const item = db.prepare(`
    SELECT * FROM rack_items
    WHERE id = ? AND is_deleted = 0
  `).get(id);

  if (!item) throw new Error("Item not found");

  const rack = db.prepare(`
    SELECT * FROM racks WHERE id = ?
  `).get(item.rack_id);

  const newEnd =
    item.position_u_start + newHeight - 1;

  if (newEnd > rack.height_u)
    throw new Error("Exceeds rack height");

  db.prepare(`
    UPDATE rack_items
    SET height_u = ?
    WHERE id = ?
  `).run(newHeight, id);
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
  update,
  move,
  resize,
  softDelete
};
