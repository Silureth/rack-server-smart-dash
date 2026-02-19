const db = require('../db');

function getByRackItem(rackItemId) {

  const rackItem = db.prepare(`
    SELECT * FROM rack_items
    WHERE id = ? AND is_deleted = 0
  `).get(rackItemId);

  if (!rackItem) throw new Error("Rack item not found");

  const disks = db.prepare(`
    SELECT * FROM disks
    WHERE rack_item_id = ?
    AND is_deleted = 0
    ORDER BY placement, position_index
  `).all(rackItemId);

  return {
    front: disks.filter(d => d.placement === 'front'),
    inside: disks.filter(d => d.placement === 'inside'),
    back: disks.filter(d => d.placement === 'back')
  };
}

function add(rackItemId, data) {

  db.prepare(`
    INSERT INTO disks (
      rack_item_id,
      placement,
      subtype,
      type,
      slot_id,
      pci_group,
      position_index,
      name,
      brand,
      capacity,
      serial,
      power_on_time,
      health,
      tbw,
      remaining_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rackItemId,
    data.placement,
    data.subtype,
    data.type,
    data.slot_id || null,
    data.pci_group ? parseInt(data.pci_group) : null,
    data.position_index || 0,
    data.name,
    data.brand,
    data.capacity,
    data.serial,
    data.power_on_time,
    data.health,
    data.tbw,
    data.remaining_time
  );
}

function softDelete(diskId) {
  db.prepare(`
    UPDATE disks
    SET is_deleted = 1
    WHERE id = ?
  `).run(diskId);
}

module.exports = {
  getByRackItem,
  add,
  softDelete
};
