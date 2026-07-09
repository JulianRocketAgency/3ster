import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function generateSlots(openTime, closeTime) {
  if (!openTime || !closeTime) return [];
  const slots = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let minutes = oh * 60 + om;
  const end = ch * 60 + cm;
  while (minutes < end) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    minutes += 30;
  }
  return slots;
}

function timeToMinutes(t) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

// GET /api/slots/:date
router.get("/:date", async (req, res) => {
  const { date } = req.params;
  const STAY_MINUTES = 120;

  try {
    const [settingsRows] = await pool.query("SELECT setting_key, setting_val FROM settings");
    const settings = Object.fromEntries(settingsRows.map(r => [r.setting_key, r.setting_val]));
    const maxGuests = parseInt(settings.max_guests) || 50;

    // Check dag override
    const [overrideRows] = await pool.query("SELECT * FROM day_overrides WHERE date = ?", [date]);
    const override = overrideRows[0] || null;

    // Bepaal lunch slots
    let lunchSlots = [];
    if (!override?.no_lunch) {
      const lunchOpen = override?.lunch_open || settings.kitchen_open_lunch || "12:00";
      const lunchClose = override?.lunch_close || settings.kitchen_close_lunch || "14:30";
      lunchSlots = generateSlots(lunchOpen, lunchClose);
    }

    // Bepaal diner slots
    let dinnerSlots = [];
    if (!override?.no_dinner) {
      const dinnerOpen = override?.dinner_open || settings.kitchen_open_dinner || "17:00";
      const dinnerClose = override?.dinner_close || settings.kitchen_close_dinner || "21:30";
      dinnerSlots = generateSlots(dinnerOpen, dinnerClose);
    }

    const allSlots = [...lunchSlots, ...dinnerSlots];

    // Geblokkeerde slots
    const [blocked] = await pool.query("SELECT time_slot, reason FROM blocked_slots WHERE date = ?", [date]);
    const blockedMap = Object.fromEntries(blocked.map(b => [b.time_slot.slice(0, 5), b.reason]));

    // Reserveringen
    const [reservations] = await pool.query(
      `SELECT TIME_FORMAT(time, '%H:%i') as time, guests FROM reservations WHERE date = ? AND status != 'cancelled'`,
      [date]
    );

    // Capaciteit overrides
    const [capacities] = await pool.query(
      "SELECT TIME_FORMAT(time_slot, '%H:%i') as time_slot, max_guests FROM slot_capacity WHERE date = ?",
      [date]
    );
    const capacityMap = Object.fromEntries(capacities.map(c => [c.time_slot, c.max_guests]));

    // Bezetting per slot (2 uur verblijf)
    const occupancyMap = {};
    for (const slot of allSlots) occupancyMap[slot] = 0;
    for (const res of reservations) {
      const startMin = timeToMinutes(res.time);
      const endMin = startMin + STAY_MINUTES;
      for (const slot of allSlots) {
        const slotMin = timeToMinutes(slot);
        if (slotMin >= startMin && slotMin < endMin) {
          occupancyMap[slot] = (occupancyMap[slot] || 0) + res.guests;
        }
      }
    }

    const slots = allSlots.map(slot => {
      const capacity = capacityMap[slot] || maxGuests;
      const booked = occupancyMap[slot] || 0;
      const isBlocked = slot in blockedMap;
      return {
        time: slot,
        blocked: isBlocked,
        reason: blockedMap[slot] || null,
        guests_booked: booked,
        capacity,
        available: !isBlocked && booked < capacity,
        spots_left: Math.max(0, capacity - booked),
        period: lunchSlots.includes(slot) ? "lunch" : "dinner",
      };
    });

    // Stuur ook override mee zodat frontend hem kan tonen
    res.json({ slots, override: override ? {
      lunch_open: override.lunch_open,
      lunch_close: override.lunch_close,
      dinner_open: override.dinner_open,
      dinner_close: override.dinner_close,
      no_lunch: !!override.no_lunch,
      no_dinner: !!override.no_dinner,
    } : null });
  } catch (err) {
    console.error("SLOTS ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/slots/:date/block
router.post("/:date/block", requireAuth, async (req, res) => {
  const { date } = req.params;
  const { time_slot, reason } = req.body;
  try {
    await pool.query(
      `INSERT INTO blocked_slots (date, time_slot, reason) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
      [date, time_slot, reason || null]
    );
    res.json({ message: "Slot geblokkeerd" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/slots/:date/block
router.delete("/:date/block", requireAuth, async (req, res) => {
  const { date } = req.params;
  const { time_slot } = req.body;
  try {
    await pool.query("DELETE FROM blocked_slots WHERE date = ? AND time_slot = ?", [date, time_slot]);
    res.json({ message: "Slot vrijgegeven" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/slots/:date/block-all
router.post("/:date/block-all", requireAuth, async (req, res) => {
  const { date } = req.params;
  const { reason } = req.body;
  try {
    const [settingsRows] = await pool.query("SELECT setting_key, setting_val FROM settings");
    const settings = Object.fromEntries(settingsRows.map(r => [r.setting_key, r.setting_val]));
    const [overrideRows] = await pool.query("SELECT * FROM day_overrides WHERE date = ?", [date]);
    const override = overrideRows[0] || null;
    let lunchSlots = !override?.no_lunch ? generateSlots(override?.lunch_open || settings.kitchen_open_lunch || "12:00", override?.lunch_close || settings.kitchen_close_lunch || "14:30") : [];
    let dinnerSlots = !override?.no_dinner ? generateSlots(override?.dinner_open || settings.kitchen_open_dinner || "17:00", override?.dinner_close || settings.kitchen_close_dinner || "21:30") : [];
    for (const slot of [...lunchSlots, ...dinnerSlots]) {
      await pool.query(
        `INSERT INTO blocked_slots (date, time_slot, reason) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
        [date, slot, reason || null]
      );
    }
    res.json({ message: "Hele dag geblokkeerd" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/slots/:date/block-all
router.delete("/:date/block-all", requireAuth, async (req, res) => {
  const { date } = req.params;
  try {
    await pool.query("DELETE FROM blocked_slots WHERE date = ?", [date]);
    res.json({ message: "Dag vrijgegeven" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/slots/:date/override — dag specifieke tijden instellen
router.put("/:date/override", requireAuth, async (req, res) => {
  const { date } = req.params;
  const { lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner } = req.body;
  try {
    await pool.query(
      `INSERT INTO day_overrides (date, lunch_open, lunch_close, dinner_open, dinner_close, no_lunch, no_dinner)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         lunch_open = VALUES(lunch_open), lunch_close = VALUES(lunch_close),
         dinner_open = VALUES(dinner_open), dinner_close = VALUES(dinner_close),
         no_lunch = VALUES(no_lunch), no_dinner = VALUES(no_dinner)`,
      [date, lunch_open || null, lunch_close || null, dinner_open || null, dinner_close || null, no_lunch ? 1 : 0, no_dinner ? 1 : 0]
    );
    res.json({ message: "Tijden opgeslagen" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/slots/:date/override — reset naar standaard tijden
router.delete("/:date/override", requireAuth, async (req, res) => {
  const { date } = req.params;
  try {
    await pool.query("DELETE FROM day_overrides WHERE date = ?", [date]);
    res.json({ message: "Teruggezet naar standaard" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
