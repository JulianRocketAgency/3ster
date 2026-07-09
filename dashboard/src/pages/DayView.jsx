import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const STATUS_COLOR = { pending:"#ff9f0a", confirmed:"#30d158", cancelled:"#ff3b30" };
const STATUS_LABEL = { pending:"Nieuw", confirmed:"Bevestigd", cancelled:"Geannuleerd" };

function fmtTime(t) { return t ? t.slice(0,5) : ""; }

function StatusBadge({ status }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:500,
      padding:"3px 10px", borderRadius:20, background:STATUS_COLOR[status]+"18", color:STATUS_COLOR[status] }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:STATUS_COLOR[status],display:"inline-block" }}/>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function DayView({ date, nav }) {
  const token = localStorage.getItem("token");
  const API = import.meta.env.VITE_API_URL || "";
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [override, setOverride] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reservations");
  const [blockingAll, setBlockingAll] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Override form state
  const [overrideForm, setOverrideForm] = useState({
    no_lunch: false, lunch_open: "12:00", lunch_close: "14:30",
    no_dinner: false, dinner_open: "17:00", dinner_close: "21:30",
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideSaved, setOverrideSaved] = useState(false);

  const d = new Date(date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("nl-NL",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/reservations`, { headers }).then(r => r.json()),
      fetch(`${API}/api/slots/${date}`, { headers }).then(r => r.json()),
      fetch(`${API}/api/settings`, { headers }).then(r => r.json()),
    ]).then(([res, slotData, settings]) => {
      setReservations((Array.isArray(res)?res:[]).filter(r => r.date && r.date.slice(0,10)===date).sort((a,b) => a.time.localeCompare(b.time)));

      // Slots kunnen nu { slots, override } zijn
      if (slotData && Array.isArray(slotData.slots)) {
        setSlots(slotData.slots);
        const ov = slotData.override;
        setOverride(ov);
        if (ov) {
          setOverrideForm({
            no_lunch: ov.no_lunch || false,
            lunch_open: ov.lunch_open || settings.kitchen_open_lunch || "12:00",
            lunch_close: ov.lunch_close || settings.kitchen_close_lunch || "14:30",
            no_dinner: ov.no_dinner || false,
            dinner_open: ov.dinner_open || settings.kitchen_open_dinner || "17:00",
            dinner_close: ov.dinner_close || settings.kitchen_close_dinner || "21:30",
          });
        } else {
          setOverrideForm({
            no_lunch: false,
            lunch_open: settings.kitchen_open_lunch || "12:00",
            lunch_close: settings.kitchen_close_lunch || "14:30",
            no_dinner: false,
            dinner_open: settings.kitchen_open_dinner || "17:00",
            dinner_close: settings.kitchen_close_dinner || "21:30",
          });
        }
      } else if (Array.isArray(slotData)) {
        setSlots(slotData);
      }

      // Check gesloten
      const openDays = (settings.open_days||"").split(",").filter(Boolean).map(Number);
      const closedDates = Array.isArray(settings.closed_dates) ? settings.closed_dates : [];
      const jsDay = new Date(date+"T12:00:00").getDay();
      setIsClosed(!openDays.includes(jsDay) || closedDates.some(c => c.date && c.date.slice(0,10)===date));

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date]);

  const reloadSlots = () => {
    fetch(`${API}/api/slots/${date}`, { headers }).then(r => r.json()).then(slotData => {
      if (slotData && Array.isArray(slotData.slots)) {
        setSlots(slotData.slots);
        setOverride(slotData.override);
      } else if (Array.isArray(slotData)) {
        setSlots(slotData);
      }
    });
  };

  const changeStatus = async (id, status, cancelReason) => {
    await fetch(`${API}/api/reservations/${id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify({ status, cancel_reason: cancelReason }),
    });
    setReservations(prev => prev.map(r => r.id===id ? {...r,status} : r));
  };

  const toggleSlot = async (slot) => {
    await fetch(`${API}/api/slots/${date}/block`, {
      method: slot.blocked ? "DELETE" : "POST",
      headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify({ time_slot: slot.time }),
    });
    setSlots(prev => prev.map(s => s.time===slot.time ? {...s, blocked:!s.blocked} : s));
  };

  const toggleAllSlots = async () => {
    const allBlocked = slots.every(s => s.blocked);
    setBlockingAll(true);
    await fetch(`${API}/api/slots/${date}/block-all`, {
      method: allBlocked ? "DELETE" : "POST",
      headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify({ reason:"Gesloten" }),
    });
    setSlots(prev => prev.map(s => ({...s, blocked:!allBlocked})));
    setBlockingAll(false);
  };

  const saveOverride = async () => {
    setSavingOverride(true);
    await fetch(`${API}/api/slots/${date}/override`, {
      method: "PUT",
      headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify(overrideForm),
    });
    setSavingOverride(false);
    setOverrideSaved(true);
    setTimeout(() => setOverrideSaved(false), 2500);
    reloadSlots();
  };

  const resetOverride = async () => {
    await fetch(`${API}/api/slots/${date}/override`, { method:"DELETE", headers });
    setOverride(null);
    reloadSlots();
  };

  const total = reservations.length;
  const totalGuests = reservations.reduce((s,r) => s+(r.guests||0), 0);
  const pending = reservations.filter(r => r.status==="pending").length;
  const blockedCount = slots.filter(s => s.blocked).length;
  const allBlocked = slots.length > 0 && slots.every(s => s.blocked);
  const hasSlots = slots.length > 0 && !isClosed;
  const lunchSlots = slots.filter(s => s.period==="lunch");
  const dinnerSlots = slots.filter(s => s.period==="dinner");

  return (
    <Layout nav={nav}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .back-btn { display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-family:inherit; font-size:13px; color:#0071e3; padding:0; margin-bottom:20px; }
        .back-btn:hover { text-decoration:underline; }
        .day-title { font-size:22px; font-weight:600; color:#1d1d1f; letter-spacing:-0.3px; text-transform:capitalize; margin-bottom:16px; }
        .day-stats { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .day-stat { background:#fff; border:1px solid #e5e5ea; border-radius:12px; padding:12px 18px; min-width:80px; }
        .day-stat-val { font-size:20px; font-weight:600; color:#1d1d1f; }
        .day-stat-lbl { font-size:11px; color:#86868b; margin-top:1px; }
        .tab-bar { display:flex; background:#f5f5f7; border-radius:10px; padding:3px; margin-bottom:24px; }
        .tab { flex:1; padding:9px; border:none; background:none; border-radius:8px; font-family:inherit; font-size:13px; font-weight:500; color:#86868b; cursor:pointer; transition:all 0.15s; }
        .tab.active { background:#fff; color:#1d1d1f; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
        .res-card { background:#fff; border:1px solid #e5e5ea; border-radius:16px; overflow:hidden; margin-bottom:10px; }
        .res-card-header { padding:16px 20px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .res-name { font-size:15px; font-weight:600; color:#1d1d1f; margin-bottom:4px; }
        .res-meta { font-size:13px; color:#86868b; display:flex; gap:12px; flex-wrap:wrap; }
        .res-body { padding:0 20px 16px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .res-field-label { font-size:11px; color:#86868b; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.5px; }
        .res-field-val { font-size:14px; color:#1d1d1f; }
        .res-actions { padding:12px 20px; border-top:1px solid #f2f2f7; display:flex; gap:8px; }
        .btn-confirm { flex:1; padding:10px; border-radius:8px; border:none; cursor:pointer; background:#30d158; color:#fff; font-size:13px; font-weight:500; font-family:inherit; }
        .btn-cancel { flex:1; padding:10px; border-radius:8px; border:1px solid #e5e5ea; cursor:pointer; background:#fff; color:#ff3b30; font-size:13px; font-weight:500; font-family:inherit; }
        .btn-restore { flex:1; padding:10px; border-radius:8px; border:1px solid #e5e5ea; cursor:pointer; background:#fff; color:#86868b; font-size:13px; font-weight:500; font-family:inherit; }
        .block-all-btn { width:100%; padding:13px; border-radius:10px; border:2px solid #e5e5ea; background:#fff; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:16px; transition:all 0.2s; color:#1d1d1f; display:flex; align-items:center; justify-content:center; gap:8px; }
        .block-all-btn.all-blocked { background:#fff2f2; border-color:#ff3b30; color:#cc0000; }
        .legend { display:flex; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#86868b; }
        .legend-dot { width:10px; height:10px; border-radius:3px; }
        .period-title { font-size:12px; font-weight:600; color:#86868b; text-transform:uppercase; letter-spacing:1px; margin:0 0 10px; }
        .slot-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:8px; margin-bottom:20px; }
        .slot-btn { padding:12px 8px; border-radius:12px; border:2px solid; cursor:pointer; font-family:inherit; font-size:14px; font-weight:600; text-align:center; transition:all 0.15s; user-select:none; }
        .slot-btn.available { background:#f0faf4; border-color:#30d158; color:#1a7a3c; }
        .slot-btn.available:hover { background:#d6f5e3; }
        .slot-btn.blocked { background:#ff3b30; border-color:#cc0000; color:#fff; box-shadow:0 2px 8px rgba(255,59,48,0.3); }
        .slot-btn.full { background:#fff8ee; border-color:#ff9f0a; color:#b36000; }
        .slot-sub { font-size:11px; font-weight:400; margin-top:3px; opacity:0.85; }

        /* Override sectie */
        .override-section { background:#fff; border:1px solid #e5e5ea; border-radius:14px; padding:20px; margin-bottom:20px; }
        .override-title { font-size:14px; font-weight:600; color:#1d1d1f; margin-bottom:4px; }
        .override-sub { font-size:12px; color:#86868b; margin-bottom:16px; }
        .override-badge { display:inline-flex; align-items:center; gap:4px; background:#fff8ee; border:1px solid #ff9f0a; color:#b36000; font-size:11px; font-weight:500; padding:2px 8px; border-radius:20px; margin-left:8px; }
        .override-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
        .override-field { display:flex; flex-direction:column; gap:4px; }
        .override-label { font-size:11px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; }
        .override-input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:9px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; transition:border-color 0.15s; width:100%; }
        .override-input:focus { background:#fff; border-color:#0071e3; }
        .override-input:disabled { opacity:0.4; cursor:not-allowed; }
        .override-check { display:flex; align-items:center; gap:8px; font-size:13px; color:#1d1d1f; cursor:pointer; margin-bottom:10px; }
        .override-check input { width:16px; height:16px; cursor:pointer; accent-color:#0071e3; }
        .override-btns { display:flex; gap:8px; margin-top:4px; }
        .btn-save-override { flex:1; padding:10px; background:#0071e3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; transition:background 0.15s; }
        .btn-save-override:hover { background:#0077ed; }
        .btn-reset-override { padding:10px 16px; background:#fff; color:#ff3b30; border:1px solid #e5e5ea; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; }
        .saved-badge { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#30d158; font-weight:500; }

        .empty { text-align:center; padding:60px 20px; color:#aeaeb2; font-size:14px; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        @media(max-width:600px) { .slot-grid { grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); } .override-row { grid-template-columns:1fr; } }
      `}</style>

      <button className="back-btn" onClick={() => nav.navigate("dashboard")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Terug naar weekoverzicht
      </button>

      <div className="day-title">{dateLabel}</div>

      <div className="day-stats">
        <div className="day-stat"><div className="day-stat-val">{total}</div><div className="day-stat-lbl">Reserveringen</div></div>
        <div className="day-stat"><div className="day-stat-val">{totalGuests}</div><div className="day-stat-lbl">Gasten</div></div>
        <div className="day-stat"><div className="day-stat-val" style={{ color:pending>0?"#ff9f0a":"#1d1d1f" }}>{pending}</div><div className="day-stat-lbl">Te bevestigen</div></div>
        {hasSlots && <div className="day-stat"><div className="day-stat-val" style={{ color:blockedCount>0?"#ff3b30":"#1d1d1f" }}>{blockedCount}/{slots.length}</div><div className="day-stat-lbl">Slots gesloten</div></div>}
      </div>

      {hasSlots && (
        <div className="tab-bar">
          <button className={`tab ${activeTab==="reservations"?"active":""}`} onClick={() => setActiveTab("reservations")}>
            Reserveringen {total>0?`(${total})`:""}
          </button>
          <button className={`tab ${activeTab==="slots"?"active":""}`} onClick={() => setActiveTab("slots")}>
            Tijdslots {blockedCount>0?`(${blockedCount} gesloten)`:""}
          </button>
          <button className={`tab ${activeTab==="tijden"?"active":""}`} onClick={() => setActiveTab("tijden")}>
            Tijden {override?"⚙️":""}
          </button>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"/></div>
      ) : activeTab==="reservations" || !hasSlots ? (
        total===0
          ? <div className="empty">Geen reserveringen op deze dag</div>
          : reservations.map(r => (
            <div key={r.id} className="res-card">
              <div className="res-card-header">
                <div>
                  <div className="res-name">{r.name}</div>
                  <div className="res-meta">
                    <span>🕐 {fmtTime(r.time)}</span>
                    <span>👥 {r.guests} personen</span>
                  </div>
                </div>
                <StatusBadge status={r.status}/>
              </div>
              <div className="res-body">
                {r.email && <div><div className="res-field-label">E-mail</div>
                  <div className="res-field-val">
                    {r.guest_id
                      ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }} onClick={() => nav.navigate("guest", r.guest_id)}>{r.email}</span>
                      : r.email}
                  </div>
                </div>}
                {r.phone && <div><div className="res-field-label">Telefoon</div><div className="res-field-val">{r.phone}</div></div>}
                {r.notes && <div style={{ gridColumn:"1/-1" }}><div className="res-field-label">Opmerking</div><div className="res-field-val">{r.notes}</div></div>}
              </div>
              <div className="res-actions">
                {r.status!=="confirmed" && r.status!=="cancelled" && <button className="btn-confirm" onClick={() => changeStatus(r.id,"confirmed")}>Bevestigen</button>}
                {r.status!=="cancelled" && <button className="btn-cancel" onClick={() => changeStatus(r.id,"cancelled")}>Annuleren</button>}
                {r.status==="cancelled" && <button className="btn-restore" onClick={() => changeStatus(r.id,"pending")}>Herstellen</button>}
              </div>
            </div>
          ))
      ) : activeTab==="slots" ? (
        <>
          <button className={`block-all-btn ${allBlocked?"all-blocked":""}`} onClick={toggleAllSlots} disabled={blockingAll}>
            {allBlocked ? <>🔓 Hele dag vrijgeven</> : <>🔒 Hele dag blokkeren</>}
          </button>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot" style={{ background:"#30d158" }}/> Beschikbaar</div>
            <div className="legend-item"><div className="legend-dot" style={{ background:"#ff9f0a" }}/> Vol</div>
            <div className="legend-item"><div className="legend-dot" style={{ background:"#ff3b30" }}/> Geblokkeerd</div>
          </div>
          {lunchSlots.length>0 && <>
            <p className="period-title">🍽 Lunch</p>
            <div className="slot-grid">
              {lunchSlots.map(slot => (
                <button key={slot.time} className={`slot-btn ${slot.blocked?"blocked":slot.guests_booked>=slot.capacity?"full":"available"}`} onClick={() => toggleSlot(slot)}>
                  {slot.time}
                  <div className="slot-sub">{slot.blocked?"Gesloten":slot.guests_booked>=slot.capacity?`Vol · ${slot.guests_booked}`:`${slot.spots_left} vrij`}</div>
                </button>
              ))}
            </div>
          </>}
          {dinnerSlots.length>0 && <>
            <p className="period-title">🍷 Diner</p>
            <div className="slot-grid">
              {dinnerSlots.map(slot => (
                <button key={slot.time} className={`slot-btn ${slot.blocked?"blocked":slot.guests_booked>=slot.capacity?"full":"available"}`} onClick={() => toggleSlot(slot)}>
                  {slot.time}
                  <div className="slot-sub">{slot.blocked?"Gesloten":slot.guests_booked>=slot.capacity?`Vol · ${slot.guests_booked}`:`${slot.spots_left} vrij`}</div>
                </button>
              ))}
            </div>
          </>}
        </>
      ) : (
        // TAB: Tijden
        <div className="override-section">
          <div className="override-title">
            Tijden voor deze dag
            {override && <span className="override-badge">⚙️ Aangepast</span>}
          </div>
          <div className="override-sub">
            Stel afwijkende openingstijden in voor {dateLabel}. Laat leeg om de standaard tijden te gebruiken.
          </div>

          {/* LUNCH */}
          <label className="override-check">
            <input type="checkbox" checked={overrideForm.no_lunch} onChange={e => setOverrideForm(f => ({...f, no_lunch:e.target.checked}))}/>
            Geen lunch op deze dag
          </label>
          <div className="override-row">
            <div className="override-field">
              <label className="override-label">Lunch open</label>
              <input className="override-input" type="time" value={overrideForm.lunch_open} disabled={overrideForm.no_lunch}
                onChange={e => setOverrideForm(f => ({...f, lunch_open:e.target.value}))}/>
            </div>
            <div className="override-field">
              <label className="override-label">Lunch gesloten</label>
              <input className="override-input" type="time" value={overrideForm.lunch_close} disabled={overrideForm.no_lunch}
                onChange={e => setOverrideForm(f => ({...f, lunch_close:e.target.value}))}/>
            </div>
          </div>

          <div style={{ borderTop:"1px solid #f2f2f7", margin:"12px 0" }}/>

          {/* DINER */}
          <label className="override-check">
            <input type="checkbox" checked={overrideForm.no_dinner} onChange={e => setOverrideForm(f => ({...f, no_dinner:e.target.checked}))}/>
            Geen diner op deze dag
          </label>
          <div className="override-row">
            <div className="override-field">
              <label className="override-label">Diner open</label>
              <input className="override-input" type="time" value={overrideForm.dinner_open} disabled={overrideForm.no_dinner}
                onChange={e => setOverrideForm(f => ({...f, dinner_open:e.target.value}))}/>
            </div>
            <div className="override-field">
              <label className="override-label">Diner gesloten</label>
              <input className="override-input" type="time" value={overrideForm.dinner_close} disabled={overrideForm.no_dinner}
                onChange={e => setOverrideForm(f => ({...f, dinner_close:e.target.value}))}/>
            </div>
          </div>

          <div className="override-btns">
            {override && (
              <button className="btn-reset-override" onClick={resetOverride}>
                Terug naar standaard
              </button>
            )}
            <button className="btn-save-override" onClick={saveOverride} disabled={savingOverride}>
              {savingOverride ? "Opslaan…" : "Tijden opslaan"}
            </button>
            {overrideSaved && (
              <div className="saved-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Opgeslagen
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
