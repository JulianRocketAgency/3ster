import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const STATUS_LABEL = { pending:"Nieuw", confirmed:"Bevestigd", cancelled:"Geannuleerd" };
const STATUS_COLOR = { pending:"#ff9f0a", confirmed:"#30d158", cancelled:"#ff3b30" };

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
  const [loading, setLoading] = useState(true);

  const d = new Date(date + "T00:00:00");
  const dayName = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"][d.getDay()];
  const dateLabel = d.toLocaleDateString("nl-NL",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });

  useEffect(() => {
    fetch("/api/reservations", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setReservations((Array.isArray(data)?data:[]).filter(r => r.date===date).sort((a,b) => a.time.localeCompare(b.time)));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [date]);

  const changeStatus = async (id, status) => {
    await fetch(`/api/reservations/${id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status }),
    });
    setReservations(prev => prev.map(r => r.id===id ? {...r,status} : r));
  };

  const total = reservations.length;
  const guests = reservations.reduce((s,r) => s+(r.guests||0), 0);
  const pending = reservations.filter(r => r.status==="pending").length;

  return (
    <Layout nav={nav}>
      <style>{`
        .back-btn { display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-family:inherit; font-size:13px; color:#0071e3; padding:0; margin-bottom:20px; -webkit-tap-highlight-color:transparent; }
        .back-btn:hover { text-decoration:underline; }
        .day-header { margin-bottom:20px; }
        .day-title { font-size:22px; font-weight:600; color:#1d1d1f; letter-spacing:-0.3px; text-transform:capitalize; }
        .day-stats { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .day-stat { background:#fff; border:1px solid #e5e5ea; border-radius:12px; padding:12px 18px; }
        .day-stat-val { font-size:20px; font-weight:600; color:#1d1d1f; }
        .day-stat-lbl { font-size:11px; color:#86868b; margin-top:1px; }
        .res-card { background:#fff; border:1px solid #e5e5ea; border-radius:16px; overflow:hidden; margin-bottom:12px; }
        .res-card-header { padding:18px 20px; display:flex; align-items:flex-start; justify-content:space-between; gap:12; }
        .res-name { font-size:16px; font-weight:600; color:#1d1d1f; margin-bottom:4px; }
        .res-meta { font-size:13px; color:#86868b; display:flex; gap:12px; flex-wrap:wrap; }
        .res-body { padding:0 20px 18px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .res-field-label { font-size:11px; color:#86868b; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.5px; }
        .res-field-val { font-size:14px; color:#1d1d1f; }
        .res-actions { padding:12px 20px; border-top:1px solid #f2f2f7; display:flex; gap:8px; }
        .btn-confirm { flex:1; padding:10px; border-radius:8px; border:none; cursor:pointer; background:#30d158; color:#fff; font-size:13px; font-weight:500; font-family:inherit; }
        .btn-cancel { flex:1; padding:10px; border-radius:8px; border:1px solid #e5e5ea; cursor:pointer; background:#fff; color:#ff3b30; font-size:13px; font-weight:500; font-family:inherit; }
        .btn-restore { flex:1; padding:10px; border-radius:8px; border:1px solid #e5e5ea; cursor:pointer; background:#fff; color:#86868b; font-size:13px; font-weight:500; font-family:inherit; }
        .empty { text-align:center; padding:60px 20px; color:#aeaeb2; font-size:14px; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <button className="back-btn" onClick={() => nav.navigate("dashboard")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Terug naar weekoverzicht
      </button>

      <div className="day-header">
        <div className="day-title">{dateLabel}</div>
      </div>

      <div className="day-stats">
        <div className="day-stat"><div className="day-stat-val">{total}</div><div className="day-stat-lbl">Reserveringen</div></div>
        <div className="day-stat"><div className="day-stat-val">{guests}</div><div className="day-stat-lbl">Gasten</div></div>
        <div className="day-stat"><div className="day-stat-val" style={{ color:pending>0?"#ff9f0a":"#1d1d1f" }}>{pending}</div><div className="day-stat-lbl">Nog te bevestigen</div></div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"/></div>
      ) : total === 0 ? (
        <div className="empty">Geen reserveringen op deze dag</div>
      ) : (
        reservations.map(r => (
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
              {r.email && (
                <div>
                  <div className="res-field-label">E-mail</div>
                  <div className="res-field-val">
                    {r.guest_id
                      ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }}
                          onClick={() => nav.navigate("guest", r.guest_id)}>{r.email}</span>
                      : r.email}
                  </div>
                </div>
              )}
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
      )}
    </Layout>
  );
}
