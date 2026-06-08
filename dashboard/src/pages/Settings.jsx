import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const DAYS_NL = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
const DAY_VALS = [1,2,3,4,5,6,0];

export default function Settings({ nav }) {
  const token = localStorage.getItem("token");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [closedDates, setClosedDates] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + "/api/settings", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setSettings(data);
        setClosedDates(Array.isArray(data.closed_dates) ? data.closed_dates : []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const set = (key, val) => setSettings(s => ({...s, [key]: val}));

  const toggleDay = (val) => {
    const days = (settings.open_days||"").split(",").filter(Boolean).map(Number);
    const next = days.includes(val) ? days.filter(d => d!==val) : [...days, val];
    set("open_days", next.join(","));
  };

  const saveAll = async (overrideClosedDates) => {
    setSaving(true);
    const dates = overrideClosedDates !== undefined ? overrideClosedDates : closedDates;
    await fetch((import.meta.env.VITE_API_URL || "") + "/api/settings", {
      method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ ...settings, closed_dates: dates }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const addClosedDate = async () => {
    if (!newDate) return;
    if (closedDates.find(d => d.date === newDate)) return;
    const updated = [...closedDates, { date: newDate, reason: newReason }];
    setClosedDates(updated);
    setNewDate(""); setNewReason("");
    await saveAll(updated);
  };

  const removeClosedDate = async (i) => {
    const updated = closedDates.filter((_,idx) => idx!==i);
    setClosedDates(updated);
    await saveAll(updated);
  };

  if (loading) return (
    <Layout nav={nav}>
      <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
        <div style={{ width:24, height:24, border:"2px solid #e5e5ea", borderTopColor:"#0071e3", borderRadius:"50%", animation:"spin 0.65s linear infinite" }}/>
      </div>
    </Layout>
  );

  const openDays = (settings.open_days||"").split(",").filter(Boolean).map(Number);

  return (
    <Layout nav={nav}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .page-title { font-size:22px; font-weight:600; color:#1d1d1f; margin-bottom:24px; }
        .section { background:#fff; border:1px solid #e5e5ea; border-radius:16px; padding:22px; margin-bottom:16px; }
        .section-title { font-size:14px; font-weight:600; color:#1d1d1f; margin-bottom:16px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .field { display:flex; flex-direction:column; gap:6px; }
        .field label { font-size:12px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; }
        .field input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:10px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; transition:border-color 0.15s; width:100%; }
        .field input:focus { background:#fff; border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,0.1); }
        .day-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .day-pill { padding:8px 16px; border-radius:20px; border:2px solid; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; transition:all 0.15s; -webkit-tap-highlight-color:transparent; }
        .day-pill.open { background:#0071e3; border-color:#0071e3; color:#fff; }
        .day-pill.closed { background:#fff2f2; border-color:#ff3b30; color:#cc0000; }
        .closed-list { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
        .closed-item { display:flex; align-items:center; gap:10px; background:#ff3b30; border-radius:8px; padding:12px 14px; }
        .closed-date { font-size:13px; font-weight:600; color:#fff; min-width:130px; }
        .closed-reason { font-size:12px; color:rgba(255,255,255,0.85); flex:1; }
        .remove-btn { background:rgba(255,255,255,0.2); border:none; cursor:pointer; color:#fff; padding:5px 10px; border-radius:6px; font-family:inherit; font-size:12px; white-space:nowrap; }
        .remove-btn:hover { background:rgba(255,255,255,0.35); }
        .add-row { display:flex; gap:8px; flex-wrap:wrap; }
        .add-input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:10px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; transition:border-color 0.15s; }
        .add-input:focus { background:#fff; border-color:#0071e3; }
        .add-btn { padding:10px 18px; background:#0071e3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; white-space:nowrap; }
        .add-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .save-bar { position:sticky; bottom:16px; display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
        .btn-save { padding:12px 28px; background:#0071e3; color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:inherit; font-size:15px; font-weight:500; }
        .btn-save:hover { background:#0077ed; }
        .saved-msg { display:flex; align-items:center; gap:6px; font-size:13px; color:#30d158; font-weight:500; }
        .auto-save-note { font-size:12px; color:#86868b; margin-bottom:14px; display:flex; align-items:center; gap:5px; }
      `}</style>

      <div className="page-title">Instellingen</div>

      <div className="section">
        <div className="section-title">Capaciteit</div>
        <div className="field" style={{ maxWidth:200 }}>
          <label>Max. aantal gasten per dag</label>
          <input type="number" min="1" max="500" value={settings.max_guests||50}
            onChange={e => set("max_guests", e.target.value)}/>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Openingstijden keuken</div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:"#86868b", marginBottom:8 }}>Lunch</div>
          <div className="field-row">
            <div className="field"><label>Open</label><input type="time" value={settings.kitchen_open_lunch||"12:00"} onChange={e => set("kitchen_open_lunch",e.target.value)}/></div>
            <div className="field"><label>Gesloten</label><input type="time" value={settings.kitchen_close_lunch||"14:30"} onChange={e => set("kitchen_close_lunch",e.target.value)}/></div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, color:"#86868b", marginBottom:8 }}>Diner</div>
          <div className="field-row">
            <div className="field"><label>Open</label><input type="time" value={settings.kitchen_open_dinner||"17:00"} onChange={e => set("kitchen_open_dinner",e.target.value)}/></div>
            <div className="field"><label>Gesloten</label><input type="time" value={settings.kitchen_close_dinner||"21:30"} onChange={e => set("kitchen_close_dinner",e.target.value)}/></div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Open dagen</div>
        <p style={{ fontSize:13, color:"#86868b", marginBottom:12 }}>Klik om open/gesloten te wisselen</p>
        <div className="day-grid">
          {DAYS_NL.map((day, i) => {
            const isOpen = openDays.includes(DAY_VALS[i]);
            return (
              <button key={i} className={`day-pill ${isOpen ? "open" : "closed"}`} onClick={() => toggleDay(DAY_VALS[i])}>
                {isOpen ? "✓ " : "✕ "}{day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Extra gesloten dagen</div>
        <div className="auto-save-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Wordt automatisch opgeslagen bij toevoegen en verwijderen
        </div>
        {closedDates.length > 0 && (
          <div className="closed-list">
            {closedDates
              .sort((a,b) => a.date.localeCompare(b.date))
              .map((d,i) => (
              <div key={i} className="closed-item">
                <span className="closed-date">
                  {new Date(d.date.slice(0,10)+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}
                </span>
                <span className="closed-reason">{d.reason || "—"}</span>
                <button className="remove-btn" onClick={() => removeClosedDate(closedDates.indexOf(d))} disabled={saving}>
                  ✕ Verwijderen
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="add-row">
          <input className="add-input" type="date" value={newDate}
            onChange={e => setNewDate(e.target.value)} style={{ flex:"0 0 auto" }}/>
          <input className="add-input" type="text" placeholder="Reden (bijv. Pasen)"
            value={newReason} onChange={e => setNewReason(e.target.value)}
            style={{ flex:1, minWidth:120 }}
            onKeyDown={e => e.key==="Enter" && addClosedDate()}/>
          <button className="add-btn" onClick={addClosedDate} disabled={!newDate || saving}>
            {saving ? "Opslaan…" : "Toevoegen"}
          </button>
        </div>
      </div>

      <div className="save-bar">
        {saved && (
          <div className="saved-msg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Opgeslagen
          </div>
        )}
        <button className="btn-save" onClick={() => saveAll()} disabled={saving}>
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </Layout>
  );
}
