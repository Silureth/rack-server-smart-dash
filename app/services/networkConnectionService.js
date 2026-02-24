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

function getAll() {
  return db.prepare(`
    SELECT * FROM network_connections
  `).all();
}

function getFreePorts(param) {
  return db.prepare(`
  SELECT *
  FROM rack_item_ports
  WHERE id NOT IN (${param.length ? param.join(',') : 0})
  `).all();
}

module.exports = { connect, disconnect, getAll, getFreePorts };
