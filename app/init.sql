CREATE TABLE IF NOT EXISTS racks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  height_u INTEGER NOT NULL DEFAULT 42 CHECK(height_u BETWEEN 4 AND 60),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rack_items (
  id TEXT PRIMARY KEY,
  rack_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('server','switch','pdu')),
  name TEXT NOT NULL,
  brand TEXT,
  sn TEXT,
  orientation TEXT CHECK(orientation IN ('front','back')) NOT NULL,
  height_u INTEGER NOT NULL CHECK(height_u > 0),
  position_u_start INTEGER NOT NULL CHECK(position_u_start > 0),
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rack_id) REFERENCES racks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rack_items_rack
ON rack_items(rack_id);

CREATE TABLE IF NOT EXISTS disks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_item_id TEXT NOT NULL,
  placement TEXT NOT NULL CHECK(placement IN ('front','inside','back')),
  subtype TEXT,
  type TEXT NOT NULL CHECK(type IN ('hdd','ssd','nvme')),

  slot_id TEXT,
  pci_group INTEGER,
  position_index INTEGER DEFAULT 0,

  name TEXT,
  brand TEXT,
  capacity TEXT,
  serial TEXT,
  power_on_time TEXT,
  health TEXT,
  tbw TEXT,
  remaining_time TEXT,

  is_deleted INTEGER DEFAULT 0,

  FOREIGN KEY (rack_item_id) REFERENCES rack_items(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_slot_per_item
ON disks(rack_item_id, slot_id)
WHERE slot_id IS NOT NULL AND is_deleted = 0;

CREATE TABLE IF NOT EXISTS disk_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disk_id INTEGER NOT NULL,
  timestamp DATETIME NOT NULL,
  health INTEGER,
  temperature INTEGER,
  power_on_time INTEGER,
  tbw INTEGER,
  FOREIGN KEY (disk_id) REFERENCES disks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disk_metrics_disk
ON disk_metrics(disk_id);

CREATE INDEX IF NOT EXISTS idx_disk_metrics_time
ON disk_metrics(disk_id, timestamp DESC);


CREATE TABLE IF NOT EXISTS rack_item_ports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('network','power')),
  position_index INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (rack_item_id)
    REFERENCES rack_items(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ports_item
ON rack_item_ports(rack_item_id);

CREATE TABLE IF NOT EXISTS rack_item_sockets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT, -- C13, C19, etc
  position_index INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (rack_item_id)
    REFERENCES rack_items(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sockets_item
ON rack_item_sockets(rack_item_id);
