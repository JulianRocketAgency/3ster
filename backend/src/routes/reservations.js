import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendReservationConfirmation, sendReservationConfirmed, sendReservationCancelled } from "../services/email.js";

const router = Router();

function fmtDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// GET /api/reservations
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, g.id as guest_id FROM reservations r
       LEFT JOIN guests g ON r.email = g.email
       ORDER BY r.date ASC, r.time ASC`
    );
    res.json(rows.map(r => ({ ...r, date: fmtDate(r.date) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

// POST /api/reservations — nieuwe reservering
router.post("/", async (req, res) => {
  const { name, email, phone, date, time, guests, notes } = req.body;
  if (!name || !date || !time || !guests) {
    return res.status(400).json({ message: "Naam, datum, tijd en aantal gasten zijn verplicht" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let guestId = null;
    if (email) {
      await conn.query(
        `INSERT INTO guests (name, email, phone)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = IF(name = '', VALUES(name), name),
           phone = IF(phone IS NULL OR phone = '', VALUES(phone), phone)`,
        [name, email, phone || null]
      );
      const [g] = await conn.query("SELECT id FROM guests WHERE email = ?", [email]);
      guestId = g[0]?.id || null;
    }
    const [result] = await conn.query(
      `INSERT INTO reservations (name, email, phone, date, time, guests, notes, status, guest_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [name, email || null, phone || null, date, time, guests, notes || null, guestId]
    );
    await conn.commit();

    // Stuur ontvangstbevestiging
    if (email) {
      sendReservationConfirmation({ name, email, date, time, guests, notes })
        .catch(err => console.error("Mail fout:", err));
    }

    res.status(201).json({ id: result.insertId, message: "Reservering ontvangen" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  } finally {
    conn.release();
  }
});

// PATCH /api/reservations/:id/status
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status, cancel_reason } = req.body;
  const allowed = ["pending", "confirmed", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Ongeldige status" });

  try {
    // Haal huidige status op om dubbele mails te voorkomen
    const [current] = await pool.query("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
    if (!current[0]) return res.status(404).json({ message: "Niet gevonden" });

    const oldStatus = current[0].status;

    await pool.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);

    const r = current[0];

    // Stuur mail alleen als status écht verandert
    if (r.email && status !== oldStatus) {
      if (status === "confirmed") {
        sendReservationConfirmed({
          name: r.name, email: r.email,
          date: fmtDate(r.date), time: r.time, guests: r.guests
        }).catch(err => console.error("Mail fout:", err));
      } else if (status === "cancelled") {
        sendReservationCancelled({
          name: r.name, email: r.email,
          date: fmtDate(r.date), time: r.time, guests: r.guests,
          reason: cancel_reason || null
        }).catch(err => console.error("Mail fout:", err));
      }
    }

    res.json({ message: "Status bijgewerkt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

export default router;
