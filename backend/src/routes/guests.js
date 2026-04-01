import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/guests — alle gasten
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.*,
        COUNT(r.id) as visit_count,
        MAX(r.date) as last_visit,
        SUM(r.guests) as total_guests
       FROM guests g
       LEFT JOIN reservations r ON g.email = r.email AND r.status != 'cancelled'
       GROUP BY g.id
       ORDER BY visit_count DESC, g.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

// GET /api/guests/:id — gast profiel met alle reserveringen
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [[guest]] = await pool.query(
      `SELECT g.*,
        COUNT(r.id) as visit_count,
        MAX(r.date) as last_visit,
        SUM(r.guests) as total_guests_hosted
       FROM guests g
       LEFT JOIN reservations r ON g.email = r.email AND r.status != 'cancelled'
       WHERE g.id = ?
       GROUP BY g.id`,
      [req.params.id]
    );
    if (!guest) return res.status(404).json({ message: "Gast niet gevonden" });

    const [reservations] = await pool.query(
      `SELECT * FROM reservations WHERE email = ? ORDER BY date DESC`,
      [guest.email]
    );

    res.json({ ...guest, reservations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

// PATCH /api/guests/:id — gast bijwerken
router.patch("/:id", requireAuth, async (req, res) => {
  const { name, phone, notes } = req.body;
  try {
    await pool.query(
      "UPDATE guests SET name = ?, phone = ?, notes = ? WHERE id = ?",
      [name, phone, notes, req.params.id]
    );
    res.json({ message: "Gast bijgewerkt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

export default router;
