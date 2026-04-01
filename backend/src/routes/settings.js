import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/settings
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_val FROM settings");
    const settings = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_val]));
    const [closed] = await pool.query("SELECT * FROM closed_dates ORDER BY date ASC");
    settings.closed_dates = closed;
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

// PUT /api/settings
router.put("/", requireAuth, async (req, res) => {
  const { closed_dates, ...rest } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const [key, val] of Object.entries(rest)) {
      await conn.query(
        "INSERT INTO settings (setting_key, setting_val) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_val = ?",
        [key, val, val]
      );
    }

    if (closed_dates !== undefined) {
      await conn.query("DELETE FROM closed_dates");
      for (const d of closed_dates) {
        if (d.date) {
          await conn.query(
            "INSERT IGNORE INTO closed_dates (date, reason) VALUES (?, ?)",
            [d.date, d.reason || null]
          );
        }
      }
    }

    await conn.commit();
    res.json({ message: "Instellingen opgeslagen" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  } finally {
    conn.release();
  }
});

export default router;
