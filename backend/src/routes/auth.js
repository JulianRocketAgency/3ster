import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "E-mail en wachtwoord zijn verplicht" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Ongeldig e-mailadres of wachtwoord" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Ongeldig e-mailadres of wachtwoord" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout" });
  }
});

// POST /api/auth/me — token checken
router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Niet ingelogd" });
  try {
    const token = header.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ message: "Sessie verlopen" });
  }
});

export default router;
