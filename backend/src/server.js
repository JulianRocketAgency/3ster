import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import reservationRoutes from "./routes/reservations.js";
import guestRoutes from "./routes/guests.js";
import settingsRoutes from "./routes/settings.js";
import slotsRoutes from "./routes/slots.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/slots", slotsRoutes);
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ Backend draait op http://localhost:${PORT}`);
});

// Tijdelijke mail test
app.get("/api/test-mail", async (req, res) => {
  try {
    const { sendReservationConfirmation } = await import("./services/email.js");
    await sendReservationConfirmation({
      name: "Test",
      email: req.query.email || "julian@rocket-agency.nl",
      date: "2026-06-12",
      time: "18:00",
      guests: 2,
      notes: "Test mail"
    });
    res.json({ ok: true });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});
