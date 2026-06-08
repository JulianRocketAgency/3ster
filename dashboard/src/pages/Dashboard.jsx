import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const DAYS = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];

function getMonday(date) {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); d.setHours(0,0,0,0); return d;
}
function getWeekNumber(d) {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() || 7));
  const y = new Date(date.getFullYear(),0,4);
  return 1 + Math.round(((date-y)/86400000-3+(y.getDay()||7))/7);
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function fmt(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDisplay(date) { return date.toLocaleDateString("nl-NL",{day:"numeric",month:"short"}); }
function fmtTime(t) { return t ? t.slice(0,5) : ""; }

const STATUS_LABEL = { pending:"Nieuw", confirmed:"Bevestigd", cancelled:"Geannuleerd" };
const STATUS_COLOR = { pending:"#ff9f0a", confirmed:"#30d158", cancelled:"#ff3b30" };

function StatusBadge({ status }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:500,
      padding:"3px 10px", borderRadius:20, background:STATUS_COLOR[status]+"18", color:STATUS_COLOR[status] }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:STATUS_COLOR[status],display:"inline-block" }}/>
      {STATUS_LABEL[status]}
    </span>
  );
}

function PendingModal({ reservations, onStatusChange, onClose }) {
  const pending = reservations.filter(r => r.status === "pending");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:"#fff", borderRadius:20, width:"100%", maxWidth:520, maxHeight:"80vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #f2f2f7", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:"#1d1d1f" }}>Nog te bevestigen</div>
            <div style={{ fontSize:13, color:"#86868b", marginTop:2 }}>{pending.length} reservering{pending.length!==1?"en":""}</div>
          </div>
          <button onClick={onClose} style={{ background:"#f5f5f7", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ overflowY:"auto", padding:"12px 16px", flex:1 }}>
          {pending.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#aeaeb2", fontSize:14 }}>Alle reserveringen zijn verwerkt 🎉</div>
          ) : pending.map(r => (
            <div key={r.id} style={{ background:"#fff", border:"1px solid #e5e5ea", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#1d1d1f", marginBottom:3 }}>{r.name}</div>
                  <div style={{ fontSize:13, color:"#86868b", display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span>📅 {new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"short"})}</span>
                    <span>🕐 {fmtTime(r.time)}</span>
                    <span>👥 {r.guests} personen</span>
                  </div>
                  {r.notes && <div style={{ fontSize:12, color:"#86868b", marginTop:4, fontStyle:"italic" }}>{r.notes}</div>}
                </div>
                <StatusBadge status={r.status}/>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => onStatusChange(r.id,"confirmed")} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", background:"#30d158", color:"#fff", fontSize:13, fontWeight:500, fontFamily:"inherit" }}>✓ Bevestigen</button>
                <button onClick={() => onStatusChange(r.id,"cancelled")} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"1px solid #e5e5ea", cursor:"pointer", background:"#fff", color:"#ff3b30", fontSize:13, fontWeight:500, fontFamily:"inherit" }}>✕ Annuleren</button>
              </div>
            </div>
          ))}
        </div>
        {pending.length > 0 && (
          <div style={{ padding:"12px 16px", borderTop:"1px solid #f2f2f7" }}>
            <button onClick={async () => { for (const r of pending) await onStatusChange(r.id,"confirmed"); }} style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", cursor:"pointer", background:"#0071e3", color:"#fff", fontSize:14, fontWeight:500, fontFamily:"inherit" }}>
              Alles bevestigen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReservationRow({ res, onStatusChange, nav }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const changeStatus = async (status) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    await fetch((import.meta.env.VITE_API_URL || "") + `/api/reservations/${res.id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status }),
    });
    setLoading(false); onStatusChange(res.id, status);
  };
  return (
    <div style={{ borderRadius:12, background:"#fff", border:"1px solid #e5e5ea", overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#1d1d1f", minWidth:44 }}>{fmtTime(res.time)}</span>
        <span style={{ fontSize:13, color:"#1d1d1f", flex:1, fontWeight:500 }}>{res.name}</span>
        <span style={{ fontSize:12, color:"#86868b", display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{res.guests}
        </span>
        <StatusBadge status={res.status}/>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" style={{ transform:open?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #f2f2f7" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"12px 0" }}>
            {res.email && <div style={{ fontSize:12 }}><div style={{ color:"#86868b", marginBottom:2 }}>E-mail</div>
              <div style={{ color:"#1d1d1f" }}>{res.guest_id ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }} onClick={() => nav.navigate("guest", res.guest_id)}>{res.email}</span> : res.email}</div>
            </div>}
            {res.phone && <div style={{ fontSize:12 }}><div style={{ color:"#86868b", marginBottom:2 }}>Telefoon</div><div style={{ color:"#1d1d1f" }}>{res.phone}</div></div>}
            {res.notes && <div style={{ fontSize:12, gridColumn:"1/-1" }}><div style={{ color:"#86868b", marginBottom:2 }}>Opmerking</div><div style={{ color:"#1d1d1f" }}>{res.notes}</div></div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {res.status!=="confirmed" && res.status!=="cancelled" && <button onClick={() => changeStatus("confirmed")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", background:"#30d158", color:"#fff", fontSize:13, fontWeight:500, opacity:loading?0.6:1 }}>Bevestigen</button>}
            {res.status!=="cancelled" && <button onClick={() => changeStatus("cancelled")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #e5e5ea", cursor:"pointer", background:"#fff", color:"#ff3b30", fontSize:13, fontWeight:500, opacity:loading?0.6:1 }}>Annuleren</button>}
            {res.status==="cancelled" && <button onClick={() => changeStatus("pending")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #e5e5ea", cursor:"pointer", background:"#fff", color:"#86868b", fontSize:13, fontWeight:500 }}>Herstellen</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ date, reservations, onStatusChange, isToday, nav, isClosed, closedReason, isRegularClosed }) {
  const [open, setOpen] = useState(isToday && !isClosed && !isRegularClosed);
  const dayName = DAYS[date.getDay()===0?6:date.getDay()-1];
  const count = reservations.length;
  const guests = reservations.reduce((s,r) => s+(r.guests||0), 0);
  const pending = reservations.filter(r => r.status==="pending").length;

  // Gesloten dag styling
  if (isClosed) {
    return (
      <div style={{ borderRadius:12, overflow:"hidden", position:"relative" }}>
        <div style={{
          position:"absolute", inset:0,
          background:"repeating-linear-gradient(45deg, #ffe4e4 0, #ffe4e4 10px, #fff0f0 10px, #fff0f0 20px)",
          border:"1.5px solid #ffcdd2", borderRadius:12,
        }}/>
        <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:10, position:"relative" }}>
          <span style={{ fontSize:14, fontWeight:600, color:"#cc0000" }}>{dayName}</span>
          <span style={{ fontSize:13, color:"#e57373" }}>{fmtDisplay(date)}{closedReason ? ` · ${closedReason}` : ""}</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:20, background:"#ffcdd2", color:"#c62828" }}>Gesloten</span>
            <button onClick={() => nav.navigate("day", fmt(date))} style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:20, background:"rgba(198,40,40,0.1)", color:"#c62828", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Bekijken →</button>
          </div>
        </div>
      </div>
    );
  }

  if (isRegularClosed) {
    return (
      <div style={{ borderRadius:12, overflow:"hidden", position:"relative" }}>
        <div style={{
          position:"absolute", inset:0,
          background:"repeating-linear-gradient(45deg, #ffe4e4 0, #ffe4e4 10px, #fff0f0 10px, #fff0f0 20px)",
          border:"1.5px solid #ffcdd2", borderRadius:12,
        }}/>
        <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:10, position:"relative" }}>
          <span style={{ fontSize:14, fontWeight:600, color:"#cc0000" }}>{dayName}</span>
          <span style={{ fontSize:13, color:"#e57373" }}>{fmtDisplay(date)}</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:20, background:"#ffcdd2", color:"#c62828" }}>Gesloten</span>
            <button onClick={() => nav.navigate("day", fmt(date))} style={{ fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:20, background:"rgba(198,40,40,0.1)", color:"#c62828", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Bekijken →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius:16, background:"#fff", border: isToday ? "1.5px solid #0071e3" : "1px solid #e5e5ea", overflow:"hidden", boxShadow: isToday ? "0 4px 20px rgba(0,113,227,0.1)" : "none" }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <button onClick={() => setOpen(!open)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <span style={{ fontSize:15, fontWeight:600, color:"#1d1d1f" }}>{dayName}</span>
              {isToday && <span style={{ fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:20, background:"#0071e3", color:"#fff" }}>Vandaag</span>}
            </div>
            <span style={{ fontSize:13, color:"#86868b" }}>{fmtDisplay(date)}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {count > 0 ? (
              <>
                <span style={{ fontSize:12, color:"#86868b" }}>{count} reservering{count!==1?"en":""} · {guests} gast{guests!==1?"en":""}</span>
                {pending > 0 && <span style={{ background:"#ff9f0a18", color:"#ff9f0a", fontSize:12, fontWeight:500, padding:"2px 8px", borderRadius:20 }}>{pending} nieuw</span>}
              </>
            ) : <span style={{ fontSize:12, color:"#c7c7cc" }}>Geen reserveringen</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" style={{ transform:open?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>
        <button onClick={() => nav.navigate("day", fmt(date))}
          style={{ background:"none", border:"none", borderLeft:"1px solid #f2f2f7", padding:"0 16px", cursor:"pointer", color:"#aeaeb2", transition:"color 0.15s, background 0.15s", flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.color="#0071e3"; e.currentTarget.style.background="#f0f7ff"; }}
          onMouseLeave={e => { e.currentTarget.style.color="#aeaeb2"; e.currentTarget.style.background="none"; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      </div>
      {open && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #f2f2f7" }}>
          {count===0
            ? <p style={{ fontSize:13, color:"#c7c7cc", textAlign:"center", padding:"24px 0" }}>Geen reserveringen op deze dag</p>
            : <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
                {reservations.sort((a,b) => a.time.localeCompare(b.time)).map(r =>
                  <ReservationRow key={r.id} res={r} onStatusChange={onStatusChange} nav={nav}/>)}
              </div>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ nav }) {
  const token = localStorage.getItem("token");
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);

  const weekDates = Array.from({length:7}, (_,i) => addDays(weekStart,i));
  const weekNumber = getWeekNumber(weekStart);
  const weekLabel = `${fmtDisplay(weekDates[0])} – ${fmtDisplay(weekDates[6])}`;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch((import.meta.env.VITE_API_URL || "") + "/api/reservations", { headers:{ Authorization:`Bearer ${token}` } }).then(r => r.json()),
      fetch((import.meta.env.VITE_API_URL || "") + "/api/settings", { headers:{ Authorization:`Bearer ${token}` } }).then(r => r.json()),
    ]).then(([res, set]) => {
      setReservations(Array.isArray(res)?res:[]);
      setSettings(set);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    const token = localStorage.getItem("token");
    await fetch((import.meta.env.VITE_API_URL || "") + `/api/reservations/${id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status }),
    });
    setReservations(prev => prev.map(r => r.id===id ? {...r,status} : r));
  };

  const today = fmt(new Date());
  const openDays = settings ? (settings.open_days||"").split(",").filter(Boolean).map(Number) : [1,2,3,4,5,6];
  const closedDates = settings ? (Array.isArray(settings.closed_dates) ? settings.closed_dates.map(d => ({...d, date: String(d.date).slice(0,10)})) : []) : [];

  const resByDay = weekDates.map(d => {
    const dateStr = fmt(d);
    const jsDay = d.getDay(); // 0=zo, 1=ma, ...
    const isRegularClosed = !openDays.includes(jsDay);
    const closedEntry = closedDates.find(c => c.date === dateStr);
    const isClosed = !!closedEntry;
    return {
      date:d,
      reservations: reservations.filter(r => r.date===dateStr),
      isToday: dateStr===today,
      isRegularClosed,
      isClosed,
      closedReason: closedEntry?.reason || null,
    };
  });

  const weekRes = reservations.filter(r => weekDates.some(d => fmt(d)===r.date));
  const totalWeek = weekRes.length;
  const totalGuests = weekRes.reduce((s,r) => s+(r.guests||0), 0);
  const totalPending = weekRes.filter(r => r.status==="pending").length;

  return (
    <Layout nav={nav}>
      {showPending && (
        <PendingModal reservations={weekRes} onStatusChange={handleStatusChange} onClose={() => setShowPending(false)}/>
      )}
      <style>{`
        .week-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .week-info { display:flex; flex-direction:column; gap:2px; }
        .week-number { font-size:11px; font-weight:600; color:#0071e3; letter-spacing:1px; text-transform:uppercase; }
        .week-label { font-size:17px; font-weight:600; color:#1d1d1f; }
        .week-btns { display:flex; gap:8px; }
        .week-btn { width:34px; height:34px; border-radius:8px; border:1px solid #e5e5ea; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .week-btn:hover { background:#f5f5f7; }
        .today-btn { padding:0 14px; height:34px; border-radius:8px; border:1px solid #e5e5ea; background:#fff; cursor:pointer; font-family:inherit; font-size:13px; color:#0071e3; font-weight:500; transition:background 0.15s; }
        .today-btn:hover { background:#f5f5f7; }
        .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        .stat { background:#fff; border-radius:14px; padding:16px 20px; border:1px solid #e5e5ea; }
        .stat.clickable { cursor:pointer; transition:border-color 0.15s, box-shadow 0.15s; }
        .stat.clickable:hover { border-color:#ff9f0a; box-shadow:0 2px 12px rgba(255,159,10,0.15); }
        .stat-value { font-size:26px; font-weight:600; color:#1d1d1f; }
        .stat-label { font-size:12px; color:#86868b; margin-top:2px; }
        .days { display:flex; flex-direction:column; gap:10px; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:600px) { .stats { gap:8px; } .stat { padding:12px 14px; } .stat-value { font-size:20px; } }
      `}</style>

      <div className="week-nav">
        <div className="week-info">
          <span className="week-number">Week {weekNumber}</span>
          <span className="week-label">{weekLabel}</span>
        </div>
        <div className="week-btns">
          <button className="today-btn" onClick={() => setWeekStart(getMonday(new Date()))}>Vandaag</button>
          <button className="week-btn" onClick={() => setWeekStart(d => addDays(d,-7))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="week-btn" onClick={() => setWeekStart(d => addDays(d,7))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-value">{totalWeek}</div><div className="stat-label">Reserveringen</div></div>
        <div className="stat"><div className="stat-value">{totalGuests}</div><div className="stat-label">Gasten</div></div>
        <div className={`stat ${totalPending>0?"clickable":""}`} onClick={() => totalPending>0 && setShowPending(true)}>
          <div className="stat-value" style={{ color:totalPending>0?"#ff9f0a":"#1d1d1f", display:"flex", alignItems:"center", gap:8 }}>
            {totalPending}
            {totalPending>0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
          </div>
          <div className="stat-label" style={{ color:totalPending>0?"#ff9f0a":"#86868b" }}>
            {totalPending>0?"Klik om te verwerken":"Nog te bevestigen"}
          </div>
        </div>
      </div>

      {loading
        ? <div className="spinner-wrap"><div className="spinner"/></div>
        : <div className="days">
            {resByDay.map(({ date, reservations, isToday, isClosed, closedReason, isRegularClosed }) =>
              <DayCard key={fmt(date)} date={date} reservations={reservations}
                onStatusChange={handleStatusChange} isToday={isToday} nav={nav}
                isClosed={isClosed} closedReason={closedReason} isRegularClosed={isRegularClosed}/>)}
          </div>}
    </Layout>
  );
}
