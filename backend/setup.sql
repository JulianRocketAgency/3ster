-- ─────────────────────────────────────
-- De 3 Ster — database setup
-- Uitvoeren via: docker exec -i driestar_db mysql -u driestar -psecret driestar_db < setup.sql
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(30),
  date       DATE NOT NULL,
  time       TIME NOT NULL,
  guests     TINYINT NOT NULL,
  notes      TEXT,
  status     ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eerste gebruiker: julian@3ster.nl / welkom123
-- Wachtwoord hash van: welkom123
INSERT IGNORE INTO users (name, email, password_hash) VALUES (
  'Julian',
  'julian@3ster.nl',
  '$2a$10$Ux4G3zRBHV3BnbDMJAB0wuXEfTGmMFJDniNpHRHSjdDoJgcrGFi.6'
);
