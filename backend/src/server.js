import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import reservationRoutes from "./routes/reservations.js";
import guestRoutes from "./routes/guests.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/settings", settingsRoutes);
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ Backend draait op http://localhost:${PORT}`);
});
