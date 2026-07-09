import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const DAYS = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];

// GET /api/weekly — alle weekdag overrides
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM weekly_overrides ORDER BY day_of_week ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/weekly/:day — weekdag override opslaan (0=zo, 1=ma, ...)
router.put("/:day", requireAuth, async (req, res) => {
  const day = parseInt(req.params.day);
  if (day < 0 || day > 6) return res.status(400).json({ message: "Ongeldige dag" });
  const { lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner } = req.body;
  try {
    await pool.query(
      `INSERT INTO weekly_overrides (day_of_week, lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         lunch_open = VALUES(lunch_open), lunch_close = VALUES(lunch_close),
         dinner_open = VALUES(dinner_open), dinner_close = VALUES(dinner_close),
         no_lunch = VALUES(no_lunch), no_dinner = VALUES(no_dinner)`,
      [day, lunch_open || null, lunch_close || null, dinner_open || null, dinner_close || null, no_lunch ? 1 : 0, no_dinner ? 1 : 0]
    );
    res.json({ message: `${DAYS[day]} opgeslagen` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/weekly/:day — weekdag override verwijderen
router.delete("/:day", requireAuth, async (req, res) => {
  const day = parseInt(req.params.day);
  try {
    await pool.query("DELETE FROM weekly_overrides WHERE day_of_week = ?", [day]);
    res.json({ message: "Teruggezet naar standaard" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
