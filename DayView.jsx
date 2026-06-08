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
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("reservations"); // reservations | slots
  const [blockingAll, setBlockingAll] = useState(false);

  const d = new Date(date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("nl-NL",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations", { headers }).then(r => r.json()),
      fetch(`/api/slots/${date}`, { headers }).then(r => r.json()),
    ]).then(([res, sl]) => {
      setReservations((Array.isArray(res)?res:[]).filter(r => r.date===date).sort((a,b) => a.time.localeCompare(b.time)));
      setSlots(Array.isArray(sl) ? sl : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date]);

  const changeStatus = async (id, status) => {
    await fetch(`/api/reservations/${id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", ...headers},
      body: JSON.stringify({ status }),
    });
    setReservations(prev => prev.map(r => r.id===id ? {...r,status} : r));
  };

  const toggleSlot = async (slot) => {
    const isBlocked = slot.blocked;
    if (isBlocked) {
      await fetch(`/api/slots/${date}/block`, {
        method:"DELETE", headers:{"Content-Type":"application/json", ...headers},
        body: JSON.stringify({ time_slot: slot.time }),
      });
    } else {
      await fetch(`/api/slots/${date}/block`, {
        method:"POST", headers:{"Content-Type":"application/json", ...headers},
        body: JSON.stringify({ time_slot: slot.time }),
      });
    }
    setSlots(prev => prev.map(s => s.time===slot.time ? {...s, blocked:!isBlocked, available:isBlocked && !s.guests_booked>=s.capacity} : s));
  };

  const toggleAllSlots = async () => {
    const allBlocked = slots.every(s => s.blocked);
    setBlockingAll(true);
    if (allBlocked) {
      await fetch(`/api/slots/${date}/block-all`, { method:"DELETE", headers });
      setSlots(prev => prev.map(s => ({...s, blocked:false})));
    } else {
      await fetch(`/api/slots/${date}/block-all`, {
        method:"POST", headers:{"Content-Type":"application/json", ...headers},
        body: JSON.stringify({ reason: "Gesloten" }),
      });
      setSlots(prev => prev.map(s => ({...s, blocked:true})));
    }
    setBlockingAll(false);
  };

  const total = reservations.length;
  const guests = reservations.reduce((s,r) => s+(r.guests||0), 0);
  const pending = reservations.filter(r => r.status==="pending").length;
  const lunchSlots = slots.filter(s => s.period==="lunch");
  const dinnerSlots = slots.filter(s => s.period==="dinner");
  const allBlocked = slots.length > 0 && slots.every(s => s.blocked);

  return (
    <Layout nav={nav}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .back-btn { display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-family:inherit; font-size:13px; color:#0071e3; padding:0; margin-bottom:20px; }
        .back-btn:hover { text-decoration:underline; }
        .day-title { font-size:22px; font-weight:600; color:#1d1d1f; letter-spacing:-0.3px; text-transform:capitalize; margin-bottom:16px; }
        .day-stats { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .day-stat { background:#fff; border:1px solid #e5e5ea; border-radius:12px; padding:12px 18px; }
        .day-stat-val { font-size:20px; font-weight:600; color:#1d1d1f; }
        .day-stat-lbl { font-size:11px; color:#86868b; margin-top:1px; }
        .tab-bar { display:flex; background:#f5f5f7; border-radius:10px; padding:3px; margin-bottom:20px; }
        .tab { flex:1; padding:8px; border:none; background:none; border-radius:8px; font-family:inherit; font-size:13px; font-weight:500; color:#86868b; cursor:pointer; transition:all 0.15s; }
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
        .slot-section-title { font-size:12px; font-weight:600; color:#86868b; text-transform:uppercase; letter-spacing:1px; margin:16px 0 10px; }
        .slot-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:8px; margin-bottom:8px; }
        .slot-btn { padding:10px 6px; border-radius:10px; border:1.5px solid; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; text-align:center; transition:all 0.15s; position:relative; -webkit-tap-highlight-color:transparent; }
        .slot-btn.available { background:#f0faf4; border-color:#30d158; color:#1d7a3a; }
        .slot-btn.blocked { background:#fff2f2; border-color:#ff3b30; color:#cc0000; }
        .slot-btn.full { background:#fff8ee; border-color:#ff9f0a; color:#b36000; }
        .slot-sub { font-size:10px; font-weight:400; margin-top:2px; opacity:0.8; }
        .block-all-btn { width:100%; padding:12px; border-radius:10px; border:1px solid #e5e5ea; background:#fff; font-family:inherit; font-size:14px; font-weight:500; cursor:pointer; margin-bottom:16px; transition:all 0.15s; color:#1d1d1f; }
        .block-all-btn.all-blocked { background:#fff2f2; border-color:#ff3b30; color:#cc0000; }
        .block-all-btn:hover { background:#f5f5f7; }
        .legend { display:flex; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#86868b; }
        .legend-dot { width:10px; height:10px; border-radius:3px; }
        .empty { text-align:center; padding:60px 20px; color:#aeaeb2; font-size:14px; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        @media(max-width:600px) { .slot-grid { grid-template-columns:repeat(auto-fill,minmax(80px,1fr)); } }
      `}</style>

      <button className="back-btn" onClick={() => nav.navigate("dashboard")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Terug naar weekoverzicht
      </button>

      <div className="day-title">{dateLabel}</div>

      <div className="day-stats">
        <div className="day-stat"><div className="day-stat-val">{total}</div><div className="day-stat-lbl">Reserveringen</div></div>
        <div className="day-stat"><div className="day-stat-val">{guests}</div><div className="day-stat-lbl">Gasten</div></div>
        <div className="day-stat"><div className="day-stat-val" style={{ color:pending>0?"#ff9f0a":"#1d1d1f" }}>{pending}</div><div className="day-stat-lbl">Nog te bevestigen</div></div>
        <div className="day-stat"><div className="day-stat-val">{slots.filter(s=>s.blocked).length}/{slots.length}</div><div className="day-stat-lbl">Slots gesloten</div></div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${view==="reservations"?"active":""}`} onClick={() => setView("reservations")}>Reserveringen</button>
        <button className={`tab ${view==="slots"?"active":""}`} onClick={() => setView("slots")}>Tijdslots beheren</button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"/></div>
      ) : view === "reservations" ? (
        total === 0
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
                      ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }}
                          onClick={() => nav.navigate("guest", r.guest_id)}>{r.email}</span>
                      : r.email}
                  </div>
                </div>}
                {r.phone && <div><div className="res-field-label">Telefoon</div><div className="res-field-val">{r.phone}</div></div>}
                {r.notes && <div style={{ gridColumn:"1/-1" }}><div className="res-field-label">Opmerking</div><div className="res-field-val">{r.notes}</div></div>}
              </div>
              <div className="res-actions">
                {r.status!=="confirmed" && <button className="btn-confirm" onClick={() => changeStatus(r.id,"confirmed")}>Bevestigen</button>}
                {r.status!=="cancelled" && <button className="btn-cancel" onClick={() => changeStatus(r.id,"cancelled")}>Annuleren</button>}
                {r.status==="cancelled" && <button className="btn-restore" onClick={() => changeStatus(r.id,"pending")}>Herstellen</button>}
              </div>
            </div>
          ))
      ) : (
        <>
          <button className={`block-all-btn ${allBlocked?"all-blocked":""}`} onClick={toggleAllSlots} disabled={blockingAll}>
            {allBlocked ? "🔓 Hele dag vrijgeven" : "🔒 Hele dag blokkeren"}
          </button>

          <div className="legend">
            <div className="legend-item"><div className="legend-dot" style={{ background:"#30d158" }}/> Beschikbaar</div>
            <div className="legend-item"><div className="legend-dot" style={{ background:"#ff9f0a" }}/> Vol</div>
            <div className="legend-item"><div className="legend-dot" style={{ background:"#ff3b30" }}/> Geblokkeerd</div>
          </div>

          {lunchSlots.length > 0 && (
            <>
              <div className="slot-section-title">Lunch</div>
              <div className="slot-grid">
                {lunchSlots.map(slot => (
                  <button key={slot.time}
                    className={`slot-btn ${slot.blocked ? "blocked" : slot.guests_booked >= slot.capacity ? "full" : "available"}`}
                    onClick={() => toggleSlot(slot)}
                    title={slot.blocked ? "Klik om te openen" : "Klik om te blokkeren"}>
                    {slot.time}
                    <div className="slot-sub">
                      {slot.blocked ? "Gesloten" : slot.guests_booked >= slot.capacity ? `Vol (${slot.guests_booked})` : `${slot.spots_left} vrij`}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {dinnerSlots.length > 0 && (
            <>
              <div className="slot-section-title">Diner</div>
              <div className="slot-grid">
                {dinnerSlots.map(slot => (
                  <button key={slot.time}
                    className={`slot-btn ${slot.blocked ? "blocked" : slot.guests_booked >= slot.capacity ? "full" : "available"}`}
                    onClick={() => toggleSlot(slot)}
                    title={slot.blocked ? "Klik om te openen" : "Klik om te blokkeren"}>
                    {slot.time}
                    <div className="slot-sub">
                      {slot.blocked ? "Gesloten" : slot.guests_booked >= slot.capacity ? `Vol (${slot.guests_booked})` : `${slot.spots_left} vrij`}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
