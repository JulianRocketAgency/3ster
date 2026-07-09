import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const DAYS_NL = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
const DAY_VALS = [1,2,3,4,5,6,0];
const API = import.meta.env.VITE_API_URL || "";

export default function Settings({ nav }) {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("algemeen");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [closedDates, setClosedDates] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  // Weekly overrides
  const [weeklyOverrides, setWeeklyOverrides] = useState({});
  const [savingWeekly, setSavingWeekly] = useState(null);
  const [savedWeekly, setSavedWeekly] = useState(null);
  const [extraOpenDates, setExtraOpenDates] = useState([]);
  const [closedPeriods, setClosedPeriods] = useState([]);
  const [newExtraOpen, setNewExtraOpen] = useState({ date:"", reason:"", lunch_open:"12:00", lunch_close:"14:30", dinner_open:"17:00", dinner_close:"21:30", no_lunch:false, no_dinner:false });
  const [newPeriod, setNewPeriod] = useState({ date_from:"", date_to:"", reason:"" });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings`, { headers }).then(r => r.json()),
      fetch(`${API}/api/weekly`, { headers }).then(r => r.json()),
    ]).then(([s, w]) => {
      setSettings(s);
      setClosedDates(Array.isArray(s.closed_dates) ? s.closed_dates : []);
      const wMap = {};
      if (Array.isArray(w?.weekly)) w.weekly.forEach(row => { wMap[row.day_of_week] = row; });
      else if (Array.isArray(w)) w.forEach(row => { wMap[row.day_of_week] = row; });
      setWeeklyOverrides(wMap);
      setExtraOpenDates(Array.isArray(w?.extraOpen) ? w.extraOpen : []);
      setClosedPeriods(Array.isArray(w?.closedPeriods) ? w.closedPeriods : []);
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
    await fetch(`${API}/api/settings`, {
      method:"PUT", headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify({ ...settings, closed_dates: dates }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const addClosedDate = async () => {
    if (!newDate) return;
    if (closedDates.find(d => d.date === newDate)) return;
    const updated = [...closedDates, { date: newDate, reason: newReason }];
    setClosedDates(updated); setNewDate(""); setNewReason("");
    await saveAll(updated);
  };

  const removeClosedDate = async (i) => {
    const updated = closedDates.filter((_,idx) => idx!==i);
    setClosedDates(updated); await saveAll(updated);
  };

  const getWeekly = (dayVal) => weeklyOverrides[dayVal] || {};
  const setWeekly = (dayVal, key, val) => {
    setWeeklyOverrides(prev => ({
      ...prev,
      [dayVal]: { ...(prev[dayVal] || {}), [key]: val, day_of_week: dayVal }
    }));
  };

  const saveWeekly = async (dayVal) => {
    setSavingWeekly(dayVal);
    const w = weeklyOverrides[dayVal] || {};
    if (w.no_lunch && w.no_dinner) {
      // Als beide uit dan verwijderen (terugzetten naar standaard)
      await fetch(`${API}/api/weekly/${dayVal}`, { method:"DELETE", headers });
      setWeeklyOverrides(prev => { const n = {...prev}; delete n[dayVal]; return n; });
    } else {
      await fetch(`${API}/api/weekly/${dayVal}`, {
        method:"PUT", headers:{"Content-Type":"application/json", ...headers},
        body: JSON.stringify(w),
      });
    }
    setSavingWeekly(null); setSavedWeekly(dayVal); setTimeout(() => setSavedWeekly(null), 2000);
  };

  const addExtraOpen = async () => {
    if (!newExtraOpen.date) return;
    await fetch(`${API}/api/weekly/extra-open`, {
      method:"POST", headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify(newExtraOpen),
    });
    setExtraOpenDates(prev => [...prev.filter(d => d.date !== newExtraOpen.date), { ...newExtraOpen }]);
    setNewExtraOpen({ date:"", reason:"", lunch_open:"12:00", lunch_close:"14:30", dinner_open:"17:00", dinner_close:"21:30", no_lunch:false, no_dinner:false });
  };

  const removeExtraOpen = async (date) => {
    await fetch(`${API}/api/weekly/extra-open/${date}`, { method:"DELETE", headers });
    setExtraOpenDates(prev => prev.filter(d => d.date !== date));
  };

  const addClosedPeriod = async () => {
    if (!newPeriod.date_from || !newPeriod.date_to) return;
    const res = await fetch(`${API}/api/weekly/closed-period`, {
      method:"POST", headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify(newPeriod),
    });
    const data = await res.json();
    setClosedPeriods(prev => [...prev, { ...newPeriod, id: data.id || Date.now() }]);
    setNewPeriod({ date_from:"", date_to:"", reason:"" });
  };

  const removeClosedPeriod = async (id) => {
    await fetch(`${API}/api/weekly/closed-period/${id}`, { method:"DELETE", headers });
    setClosedPeriods(prev => prev.filter(p => p.id !== id));
  };

  const resetWeekly = async (dayVal) => {
    await fetch(`${API}/api/weekly/${dayVal}`, { method:"DELETE", headers });
    setWeeklyOverrides(prev => { const n = {...prev}; delete n[dayVal]; return n; });
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
        .page-title { font-size:22px; font-weight:600; color:#1d1d1f; margin-bottom:20px; }
        .tab-bar { display:flex; background:#f5f5f7; border-radius:10px; padding:3px; margin-bottom:24px; }
        .tab { flex:1; padding:9px; border:none; background:none; border-radius:8px; font-family:inherit; font-size:13px; font-weight:500; color:#86868b; cursor:pointer; transition:all 0.15s; }
        .tab.active { background:#fff; color:#1d1d1f; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
        .section { background:#fff; border:1px solid #e5e5ea; border-radius:16px; padding:22px; margin-bottom:16px; }
        .section-title { font-size:14px; font-weight:600; color:#1d1d1f; margin-bottom:16px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .field { display:flex; flex-direction:column; gap:6px; }
        .field label { font-size:12px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; }
        .field input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:10px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; transition:border-color 0.15s; width:100%; }
        .field input:focus { background:#fff; border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,0.1); }
        .day-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .day-pill { padding:8px 16px; border-radius:20px; border:2px solid; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; transition:all 0.15s; }
        .day-pill.open { background:#0071e3; border-color:#0071e3; color:#fff; }
        .day-pill.closed { background:#fff2f2; border-color:#ff3b30; color:#cc0000; }
        .closed-list { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
        .closed-item { display:flex; align-items:center; gap:10px; background:#ff3b30; border-radius:8px; padding:12px 14px; }
        .closed-date { font-size:13px; font-weight:600; color:#fff; min-width:130px; }
        .closed-reason { font-size:12px; color:rgba(255,255,255,0.85); flex:1; }
        .remove-btn { background:rgba(255,255,255,0.2); border:none; cursor:pointer; color:#fff; padding:5px 10px; border-radius:6px; font-family:inherit; font-size:12px; }
        .add-row { display:flex; gap:8px; flex-wrap:wrap; }
        .add-input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:10px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; }
        .add-btn { padding:10px 18px; background:#0071e3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; }
        .save-bar { position:sticky; bottom:16px; display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
        .btn-save { padding:12px 28px; background:#0071e3; color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:inherit; font-size:15px; font-weight:500; }
        .saved-msg { display:flex; align-items:center; gap:6px; font-size:13px; color:#30d158; font-weight:500; }
        .auto-save-note { font-size:12px; color:#86868b; margin-bottom:14px; display:flex; align-items:center; gap:5px; }

        /* Weekly overrides */
        .weekday-card { background:#fff; border:1px solid #e5e5ea; border-radius:14px; overflow:hidden; margin-bottom:12px; }
        .weekday-header { padding:14px 18px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
        .weekday-name { font-size:15px; font-weight:600; color:#1d1d1f; }
        .weekday-badge { font-size:11px; font-weight:500; padding:2px 8px; border-radius:20px; }
        .weekday-badge.custom { background:#fff8ee; color:#b36000; border:1px solid #f0d090; }
        .weekday-badge.standard { background:#f0faf4; color:#1a7a3c; border:1px solid #c0e8c0; }
        .weekday-body { padding:0 18px 18px; border-top:1px solid #f2f2f7; }
        .check-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#1d1d1f; cursor:pointer; margin:12px 0 8px; }
        .check-row input { width:16px; height:16px; accent-color:#0071e3; cursor:pointer; }
        .time-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
        .time-field { display:flex; flex-direction:column; gap:4px; }
        .time-label { font-size:11px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; }
        .time-input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:9px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; width:100%; }
        .time-input:focus { background:#fff; border-color:#0071e3; }
        .time-input:disabled { opacity:0.4; }
        .weekday-btns { display:flex; gap:8px; margin-top:12px; }
        .btn-save-week { flex:1; padding:9px; background:#0071e3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; }
        .btn-reset-week { padding:9px 14px; background:#fff; color:#ff3b30; border:1px solid #e5e5ea; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; }
        .week-saved { font-size:12px; color:#30d158; font-weight:500; display:flex; align-items:center; gap:4px; }
      `}</style>

      <div className="page-title">Instellingen</div>

      <div className="tab-bar">
        <button className={`tab ${tab==="algemeen"?"active":""}`} onClick={() => setTab("algemeen")}>Algemeen</button>
        <button className={`tab ${tab==="weekdagen"?"active":""}`} onClick={() => setTab("weekdagen")}>Per weekdag</button>
      </div>

      {tab === "algemeen" && (
        <>
          <div className="section">
            <div className="section-title">Capaciteit</div>
            <div className="field" style={{ maxWidth:200 }}>
              <label>Max. aantal gasten per dag</label>
              <input type="number" min="1" max="500" value={settings.max_guests||50} onChange={e => set("max_guests",e.target.value)}/>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Standaard openingstijden keuken</div>
            <p style={{ fontSize:12, color:"#86868b", marginBottom:14 }}>Deze tijden gelden voor alle dagen, tenzij je per weekdag of dag andere tijden instelt.</p>
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
              {DAYS_NL.map((day,i) => {
                const isOpen = openDays.includes(DAY_VALS[i]);
                return (
                  <button key={i} className={`day-pill ${isOpen?"open":"closed"}`} onClick={() => toggleDay(DAY_VALS[i])}>
                    {isOpen?"✓ ":"✕ "}{day}
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
                {closedDates.sort((a,b)=>a.date.localeCompare(b.date)).map((d,i) => (
                  <div key={i} className="closed-item">
                    <span className="closed-date">{new Date(d.date+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}</span>
                    <span className="closed-reason">{d.reason||"—"}</span>
                    <button className="remove-btn" onClick={() => removeClosedDate(closedDates.indexOf(d))} disabled={saving}>✕ Verwijderen</button>
                  </div>
                ))}
              </div>
            )}
            <div className="add-row">
              <input className="add-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ flex:"0 0 auto" }}/>
              <input className="add-input" type="text" placeholder="Reden (bijv. Pasen)" value={newReason} onChange={e => setNewReason(e.target.value)} style={{ flex:1, minWidth:120 }} onKeyDown={e => e.key==="Enter" && addClosedDate()}/>
              <button className="add-btn" onClick={addClosedDate} disabled={!newDate||saving}>{saving?"Opslaan…":"Toevoegen"}</button>
            </div>
          </div>

          <div className="save-bar">
            {saved && <div className="saved-msg"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Opgeslagen</div>}
            <button className="btn-save" onClick={() => saveAll()} disabled={saving}>{saving?"Opslaan…":"Opslaan"}</button>
          </div>
        </>
      )}

      {tab === "weekdagen" && (
        <>
          <p style={{ fontSize:13, color:"#86868b", marginBottom:20 }}>
            Stel per weekdag afwijkende tijden in. Deze hebben voorrang op de standaard tijden, maar een dag-specifieke instelling heeft altijd de hoogste prioriteit.
          </p>
          {DAYS_NL.map((dayName, i) => {
            const dayVal = DAY_VALS[i];
            const w = getWeekly(dayVal);
            const hasOverride = !!weeklyOverrides[dayVal];

            return (
              <div key={dayVal} className="weekday-card">
                <div className="weekday-header">
                  <span className="weekday-name">{dayName}</span>
                  <span className={`weekday-badge ${hasOverride?"custom":"standard"}`}>
                    {hasOverride ? "⚙️ Aangepast" : "Standaard tijden"}
                  </span>
                </div>
                <div className="weekday-body">
                  <label className="check-row">
                    <input type="checkbox" checked={!!w.no_lunch} onChange={e => setWeekly(dayVal,"no_lunch",e.target.checked)}/>
                    Geen lunch op {dayName.toLowerCase()}
                  </label>
                  <div className="time-row">
                    <div className="time-field">
                      <label className="time-label">Lunch open</label>
                      <input className="time-input" type="time" disabled={!!w.no_lunch}
                        value={w.lunch_open || settings?.kitchen_open_lunch || "12:00"}
                        onChange={e => setWeekly(dayVal,"lunch_open",e.target.value)}/>
                    </div>
                    <div className="time-field">
                      <label className="time-label">Lunch gesloten</label>
                      <input className="time-input" type="time" disabled={!!w.no_lunch}
                        value={w.lunch_close || settings?.kitchen_close_lunch || "14:30"}
                        onChange={e => setWeekly(dayVal,"lunch_close",e.target.value)}/>
                    </div>
                  </div>

                  <label className="check-row">
                    <input type="checkbox" checked={!!w.no_dinner} onChange={e => setWeekly(dayVal,"no_dinner",e.target.checked)}/>
                    Geen diner op {dayName.toLowerCase()}
                  </label>
                  <div className="time-row">
                    <div className="time-field">
                      <label className="time-label">Diner open</label>
                      <input className="time-input" type="time" disabled={!!w.no_dinner}
                        value={w.dinner_open || settings?.kitchen_open_dinner || "17:00"}
                        onChange={e => setWeekly(dayVal,"dinner_open",e.target.value)}/>
                    </div>
                    <div className="time-field">
                      <label className="time-label">Diner gesloten</label>
                      <input className="time-input" type="time" disabled={!!w.no_dinner}
                        value={w.dinner_close || settings?.kitchen_close_dinner || "21:30"}
                        onChange={e => setWeekly(dayVal,"dinner_close",e.target.value)}/>
                    </div>
                  </div>

                  <div className="weekday-btns">
                    {hasOverride && <button className="btn-reset-week" onClick={() => resetWeekly(dayVal)}>Standaard</button>}
                    <button className="btn-save-week" onClick={() => saveWeekly(dayVal)} disabled={savingWeekly===dayVal}>
                      {savingWeekly===dayVal ? "Opslaan…" : `${dayName} opslaan`}
                    </button>
                    {savedWeekly===dayVal && <div className="week-saved">✓ Opgeslagen</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </Layout>
  );
}
