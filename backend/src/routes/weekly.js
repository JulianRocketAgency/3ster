import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/weekly
router.get("/", requireAuth, async (req, res) => {
  try {
    const [weekly] = await pool.query("SELECT * FROM weekly_overrides ORDER BY day_of_week ASC");
    const [extraOpen] = await pool.query("SELECT * FROM extra_open_dates ORDER BY date ASC");
    const [closedPeriods] = await pool.query("SELECT * FROM closed_periods ORDER BY date_from ASC");
    res.json({ weekly, extraOpen, closedPeriods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/weekly/:day
router.put("/:day", requireAuth, async (req, res) => {
  const day = parseInt(req.params.day);
  if (day < 0 || day > 6) return res.status(400).json({ message: "Ongeldige dag" });
  const { lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner } = req.body;
  try {
    await pool.query(
      `INSERT INTO weekly_overrides (day_of_week, lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         lunch_open=VALUES(lunch_open), lunch_close=VALUES(lunch_close),
         dinner_open=VALUES(dinner_open), dinner_close=VALUES(dinner_close),
         no_lunch=VALUES(no_lunch), no_dinner=VALUES(no_dinner)`,
      [day, lunch_open||null, lunch_close||null, dinner_open||null, dinner_close||null, no_lunch?1:0, no_dinner?1:0]
    );
    res.json({ message: "Opgeslagen" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/weekly/:day
router.delete("/:day", requireAuth, async (req, res) => {
  const day = parseInt(req.params.day);
  try {
    await pool.query("DELETE FROM weekly_overrides WHERE day_of_week = ?", [day]);
    res.json({ message: "Verwijderd" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/weekly/extra-open
router.post("/extra-open", requireAuth, async (req, res) => {
  const { date, reason, lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner } = req.body;
  if (!date) return res.status(400).json({ message: "Datum verplicht" });
  try {
    await pool.query(
      `INSERT INTO extra_open_dates (date, reason, lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reason=VALUES(reason), lunch_open=VALUES(lunch_open), lunch_close=VALUES(lunch_close),
         dinner_open=VALUES(dinner_open), dinner_close=VALUES(dinner_close),
         no_lunch=VALUES(no_lunch), no_dinner=VALUES(no_dinner)`,
      [date, reason||null, lunch_open||null, lunch_close||null, dinner_open||null, dinner_close||null, no_lunch?1:0, no_dinner?1:0]
    );
    res.json({ message: "Extra open dag opgeslagen" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/weekly/extra-open/:date
router.delete("/extra-open/:date", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM extra_open_dates WHERE date = ?", [req.params.date]);
    res.json({ message: "Verwijderd" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/weekly/closed-period
router.post("/closed-period", requireAuth, async (req, res) => {
  const { date_from, date_to, reason } = req.body;
  if (!date_from || !date_to) return res.status(400).json({ message: "Begin- en einddatum verplicht" });
  try {
    await pool.query("INSERT INTO closed_periods (date_from, date_to, reason) VALUES (?, ?, ?)", [date_from, date_to, reason||null]);
    res.json({ message: "Gesloten periode opgeslagen" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/weekly/closed-period/:id
router.delete("/closed-period/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM closed_periods WHERE id = ?", [req.params.id]);
    res.json({ message: "Verwijderd" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
