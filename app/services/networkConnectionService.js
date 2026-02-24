const db = require('../db');

function connect(portA, portB) {
  db.prepare(`
    INSERT INTO network_connections (port_a_id, port_b_id)
    VALUES (?, ?)
  `).run(portA, portB);
}

function disconnect(portId) {
  db.prepare(`
    DELETE FROM network_connections
    WHERE port_a_id = ?
       OR port_b_id = ?
  `).run(portId, portId);
}

// function getAll() {
//   return db.prepare(`
//     SELECT * FROM network_connections
//   `).all();
// }

function getAll() {
  return db.prepare(`
    SELECT 
      nc.id,
      nc.port_a_id,
      nc.port_b_id,

      pa.name  AS port_a_name,
      ra.name  AS rack_a_name,

      pb.name  AS port_b_name,
      rb.name  AS rack_b_name

    FROM network_connections nc

    JOIN rack_item_ports pa ON pa.id = nc.port_a_id
    JOIN rack_items ra ON ra.id = pa.rack_item_id

    JOIN rack_item_ports pb ON pb.id = nc.port_b_id
    JOIN rack_items rb ON rb.id = pb.rack_item_id
  `).all();
}

function getFreePorts(param) {
  return db.prepare(`
  SELECT *
  FROM rack_item_ports
  WHERE id NOT IN (${param.length ? param.join(',') : 0})
  AND is_deleted = 0
  `).all();
}

module.exports = { connect, disconnect, getAll, getFreePorts };
