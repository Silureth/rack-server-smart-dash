// const db = require('../db');
// const { v4: uuidv4 } = require('uuid');

// function getByRack(rackId) {
//   return db.prepare(`
//     SELECT * FROM rack_items
//     WHERE rack_id = ?
//     AND is_deleted = 0
//   `).all(rackId);
// }

// function create(data) {
//   const {
//     rack_id,
//     name,
//     brand,
//     sn,
//     type,
//     orientation,
//     height_u,
//     position_u_start
//   } = data;

//   const existing = getByRack(rack_id);

//   for (const s of existing) {
//     const existingEnd = s.position_u_start + s.height_u - 1;
//     const newEnd = position_u_start + height_u - 1;

//     const collision =
//       position_u_start <= existingEnd &&
//       newEnd >= s.position_u_start &&
//       s.orientation === orientation;

//     if (collision) {
//       throw new Error("U space collision detected");
//     }
//   }

//   db.prepare(`
//     INSERT INTO rack_items (
//       id, rack_id, name, brand, sn, type,
//       orientation, height_u, position_u_start
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `).run(
//     uuidv4(),
//     rack_id,
//     name,
//     brand,
//     sn,
//     type,
//     orientation,
//     height_u,
//     position_u_start
//   );
// }

// function updateServer(data) {

//   db.prepare(`
//     UPDATE rack_items
//     SET
//       name = ?,
//       brand = ?,
//       sn = ?,
//       type = ?,
//       orientation = ?,
//       height_u = ?,
//       position_u_start = ?
//     WHERE id = ?
//   `).run(
//     data.name,
//     data.brand,
//     data.sn,
//     data.type,
//     data.orientation,
//     parseInt(data.height_u),
//     parseInt(data.position_u_start),
//     data.id
//   );
// }


// function move(id, newPosition, newOrientation) {

//   const server = db.prepare(`
//     SELECT * FROM rack_items
//     WHERE id = ? AND is_deleted = 0
//   `).get(id);

//   if (!server) throw new Error("Server not found");

//   const rack = db.prepare(`
//     SELECT * FROM racks WHERE id = ?
//   `).get(server.rack_id);

//   if (!rack) throw new Error("Rack not found");

//   if (newPosition < 1)
//     throw new Error("Invalid position");

//   if (newPosition + server.height_u - 1 > rack.height_u)
//     throw new Error("Exceeds rack height");

//   const others = db.prepare(`
//     SELECT * FROM rack_items
//     WHERE rack_id = ?
//     AND orientation = ?
//     AND id != ?
//     AND is_deleted = 0
//   `).all(server.rack_id, newOrientation, id);

//   for (const s of others) {
//     const end = s.position_u_start + s.height_u - 1;
//     const newEnd = newPosition + server.height_u - 1;

//     if (
//       newPosition <= end &&
//       newEnd >= s.position_u_start
//     ) {
//       throw new Error("Collision detected");
//     }
//   }

//   db.prepare(`
//     UPDATE rack_items
//     SET position_u_start = ?, orientation = ?
//     WHERE id = ?
//   `).run(newPosition, newOrientation, id);
// }

// function softDelete(id) {
//   db.prepare(`
//     UPDATE rack_items
//     SET is_deleted = 1
//     WHERE id = ?
//   `).run(id);
// }
// function resize(id, newHeight) {

//   if (![1, 2].includes(newHeight))
//     throw new Error("Invalid height");

//   const server = db.prepare(`
//     SELECT * FROM rack_items
//     WHERE id = ? AND is_deleted = 0
//   `).get(id);

//   if (!server) throw new Error("Server not found");

//   const rack = db.prepare(`
//     SELECT * FROM racks WHERE id = ?
//   `).get(server.rack_id);

//   const newEnd =
//     server.position_u_start + newHeight - 1;

//   if (newEnd > rack.height_u)
//     throw new Error("Exceeds rack height");

//   const others = db.prepare(`
//     SELECT * FROM rack_items
//     WHERE rack_id = ?
//     AND orientation = ?
//     AND id != ?
//     AND is_deleted = 0
//   `).all(server.rack_id, server.orientation, id);

//   for (const s of others) {
//     const end = s.position_u_start + s.height_u - 1;

//     if (
//       server.position_u_start <= end &&
//       newEnd >= s.position_u_start
//     ) {
//       throw new Error("Collision detected");
//     }
//   }

//   db.prepare(`
//     UPDATE rack_items
//     SET height_u = ?
//     WHERE id = ?
//   `).run(newHeight, id);
// }

// function getDisks(rackItemId) {

//   const server = db.prepare(`
//     SELECT * FROM rack_items WHERE id = ?
//   `).get(serverId);

//   const disks = db.prepare(`
//   SELECT * FROM disks
//   WHERE rack_item_id = ?
//   AND is_deleted = 0
//   ORDER BY placement, position_index
// `).all(serverId);


//   return {
//     server,
//     disks: {
//       front: disks.filter(d => d.placement === 'front'),
//       inside: disks.filter(d => d.placement === 'inside'),
//       back: disks.filter(d => d.placement === 'back')
//     }
//   };
// }

// function addDisk(serverId, data) {

//   db.prepare(`
//     INSERT INTO disks
//     (rack_item_id, placement, subtype, type,
//      slot_id, pci_group, position_index,
//      name, brand, capacity,
//      serial, power_on_time, health, tbw, remaining_time)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `).run(
//     serverId,
//     data.placement,
//     data.subtype,
//     data.type,
//     data.slot_id || null,
//     data.pci_group ? parseInt(data.pci_group) : null,
//     data.position_index || 0,
//     data.name,
//     data.brand,
//     data.capacity,
//     data.serial,
//     data.power_on_time,
//     data.health,
//     data.tbw,
//     data.remaining_time
//   );
// }


// function deleteDisk(diskId) {

//   const disk = db.prepare(`
//     SELECT rack_item_id, placement
//     FROM disks
//     WHERE id = ?
//   `).get(diskId);

//   db.prepare(`
//     UPDATE disks
//     SET is_deleted = 1
//     WHERE id = ?
//   `).run(diskId);

//   if (disk) {
//     const disks = db.prepare(`
//       SELECT id FROM disks
//       WHERE rack_item_id = ?
//       AND placement = ?
//       AND is_deleted = 0
//       ORDER BY position_index
//     `).all(disk.rack_item_id, disk.placement);

//     reorderDisks(disk.rack_item_id, disk.placement, disks.map(d => d.id));
//   }
// }


// function updateDisk(diskId, payload) {

//   const disk = db.prepare(`
//     SELECT * FROM disks
//     WHERE id = ? AND is_deleted = 0
//   `).get(diskId);

//   if (!disk) throw new Error("Disk not found");

//   // Normalize slot_id
//   const slotId =
//     payload.slot_id && payload.slot_id.trim() !== ""
//       ? payload.slot_id.trim()
//       : null;

//   // Only check duplicates if slotId exists
//   if (slotId) {
//     const existing = db.prepare(`
//     SELECT id FROM disks
//     WHERE rack_item_id = ?
//     AND slot_id = ?
//     AND id != ?
//     AND is_deleted = 0
//   `).get(disk.rack_item_id, slotId, diskId);

//     if (existing) {
//       throw new Error("Duplicate Slot ID");
//     }
//   }


//   db.prepare(`
//   UPDATE disks
//   SET
//     slot_id = ?,
//     pci_group = ?,
//     brand = ?,
//     name = ?,
//     serial = ?
//   WHERE id = ?
// `).run(
//     slotId,
//     payload.pci_group !== "" ? parseInt(payload.pci_group) : null,
//     payload.brand,
//     payload.name,
//     payload.serial,
//     diskId
//   );

// }


// function reorderDisks(serverId, placement, orderedIds) {

//   const update = db.prepare(`
//     UPDATE disks
//     SET position_index = ?
//     WHERE id = ?
//     AND rack_item_id = ?
//     AND placement = ?
//   `);

//   const transaction = db.transaction((ids) => {
//     ids.forEach((diskId, index) => {
//       update.run(index + 1, diskId, serverId, placement);
//     });
//   });

//   transaction(orderedIds);
// }







// module.exports = {
//   getByRack,
//   create,
//   updateServer,
//   move,
//   softDelete,
//   resize,
//   getDisks,
//   addDisk,
//   deleteDisk,
//   updateDisk,
//   reorderDisks
// };
