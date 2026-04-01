import { useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Guests from "./pages/Guests.jsx";
import GuestProfile from "./pages/GuestProfile.jsx";
import Settings from "./pages/Settings.jsx";
import DayView from "./pages/DayView.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("dashboard");
  const [pageParam, setPageParam] = useState(null);

  if (!token) return <Login onLogin={(t) => { localStorage.setItem("token", t); setToken(t); }} />;

  const navigate = (p, param = null) => { setPage(p); setPageParam(param); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  const nav = { navigate, logout, token };

  if (page === "guest") return <GuestProfile id={pageParam} nav={nav} />;
  if (page === "guests") return <Guests nav={nav} />;
  if (page === "settings") return <Settings nav={nav} />;
  if (page === "day") return <DayView date={pageParam} nav={nav} />;
  return <Dashboard nav={nav} />;
}
