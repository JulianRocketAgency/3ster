-- ─────────────────────────────────────────────────────────
-- De 3 Ster — database migratie v2
-- Uitvoeren via:
-- docker exec -i driestar_db mysql -u driestar -psecret driestar_db < migrate.sql
-- ─────────────────────────────────────────────────────────

-- Instellingen tabel
CREATE TABLE IF NOT EXISTS settings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  setting_key  VARCHAR(100) NOT NULL UNIQUE,
  setting_val  TEXT NOT NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Standaard instellingen
INSERT IGNORE INTO settings (setting_key, setting_val) VALUES
  ('max_guests', '50'),
  ('kitchen_open_lunch', '12:00'),
  ('kitchen_close_lunch', '14:30'),
  ('kitchen_open_dinner', '17:00'),
  ('kitchen_close_dinner', '21:30'),
  ('open_days', '1,2,4,5,6'),
  ('closed_dates', '[]');

-- Extra gesloten dagen tabel
CREATE TABLE IF NOT EXISTS closed_dates (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  date   DATE NOT NULL UNIQUE,
  reason VARCHAR(200)
);

-- Gasten tabel (uniek op email)
CREATE TABLE IF NOT EXISTS guests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  phone      VARCHAR(30),
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reserveringen: guest_id toevoegen als foreign key naar guests
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_id INT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL;

-- Bestaande reserveringen koppelen aan gasten op basis van email
INSERT IGNORE INTO guests (name, email, phone)
  SELECT DISTINCT name, email, phone FROM reservations
  WHERE email IS NOT NULL AND email != '';

UPDATE reservations r
  JOIN guests g ON r.email = g.email
  SET r.guest_id = g.id
  WHERE r.guest_id IS NULL AND r.email IS NOT NULL;

