import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function generateSlots(openTime, closeTime) {
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
  const STAY_MINUTES = 120; // gasten zitten 2 uur

  try {
    const [settingsRows] = await pool.query("SELECT setting_key, setting_val FROM settings");
    const settings = Object.fromEntries(settingsRows.map(r => [r.setting_key, r.setting_val]));
    const maxGuests = parseInt(settings.max_guests) || 50;

    const lunchSlots = generateSlots(settings.kitchen_open_lunch || "12:00", settings.kitchen_close_lunch || "14:30");
    const dinnerSlots = generateSlots(settings.kitchen_open_dinner || "17:00", settings.kitchen_close_dinner || "21:30");
    const allSlots = [...lunchSlots, ...dinnerSlots];

    // Geblokkeerde slots
    const [blocked] = await pool.query("SELECT time_slot, reason FROM blocked_slots WHERE date = ?", [date]);
    const blockedMap = Object.fromEntries(blocked.map(b => [b.time_slot.slice(0, 5), b.reason]));

    // Alle reserveringen van die dag
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

    // Bereken bezetting per slot rekening houdend met 2 uur verblijf
    const occupancyMap = {};
    for (const slot of allSlots) occupancyMap[slot] = 0;

    for (const res of reservations) {
      const startMin = timeToMinutes(res.time);
      const endMin = startMin + STAY_MINUTES;
      for (const slot of allSlots) {
        const slotMin = timeToMinutes(slot);
        // Slot valt binnen de verblijfsduur van deze reservering
        if (slotMin >= startMin && slotMin < endMin) {
          occupancyMap[slot] = (occupancyMap[slot] || 0) + res.guests;
        }
      }
    }

    const slots = allSlots.map(slot => {
      const capacity = capacityMap[slot] || maxGuests;
      const booked = occupancyMap[slot] || 0;
      const isBlocked = slot in blockedMap;
      const isFull = booked >= capacity;
      return {
        time: slot,
        blocked: isBlocked,
        reason: blockedMap[slot] || null,
        guests_booked: booked,
        capacity,
        available: !isBlocked && !isFull,
        spots_left: Math.max(0, capacity - booked),
        period: lunchSlots.includes(slot) ? "lunch" : "dinner",
      };
    });

    res.json(slots);
  } catch (err) {
    console.error("SLOTS ERROR:", err.message, err.stack);
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
    console.error("SLOTS ERROR:", err.message, err.stack);
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
    console.error("SLOTS ERROR:", err.message, err.stack);
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
    const allSlots = [
      ...generateSlots(settings.kitchen_open_lunch || "12:00", settings.kitchen_close_lunch || "14:30"),
      ...generateSlots(settings.kitchen_open_dinner || "17:00", settings.kitchen_close_dinner || "21:30"),
    ];
    for (const slot of allSlots) {
      await pool.query(
        `INSERT INTO blocked_slots (date, time_slot, reason) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
        [date, slot, reason || null]
      );
    }
    res.json({ message: "Hele dag geblokkeerd" });
  } catch (err) {
    console.error("SLOTS ERROR:", err.message, err.stack);
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
    console.error("SLOTS ERROR:", err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});

export default router;
