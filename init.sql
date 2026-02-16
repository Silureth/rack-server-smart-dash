CREATE TABLE IF NOT EXISTS racks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  height_u INTEGER NOT NULL DEFAULT 42,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  rack_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  sn TEXT,
  type TEXT,
  orientation TEXT CHECK(orientation IN ('front','back')) NOT NULL,
  height_u INTEGER CHECK(height_u IN (1,2)) NOT NULL,
  position_u_start INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE INDEX IF NOT EXISTS idx_servers_rack ON servers(rack_id);

CREATE TABLE disks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL,
  placement TEXT NOT NULL,
  subtype TEXT,
  type TEXT NOT NULL,
  name TEXT,
  brand TEXT,
  capacity TEXT,
  serial TEXT,
  power_on_time TEXT,
  health TEXT,
  tbw TEXT,
  remaining_time TEXT,
  is_deleted INTEGER DEFAULT 0
);
