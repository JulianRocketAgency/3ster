import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import reservationRoutes from "./routes/reservations.js";
import guestRoutes from "./routes/guests.js";
import settingsRoutes from "./routes/settings.js";
import slotsRoutes from "./routes/slots.js";
import weeklyRoutes from "./routes/weekly.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://3ster.nl',
    'https://www.3ster.nl',
    'https://3ster.vendelict.nl',
    'https://reserveringen.3ster.nl',
    'https://3ster.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/slots", slotsRoutes);
app.use("/api/weekly", weeklyRoutes);
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ Backend draait op http://localhost:${PORT}`);
});
