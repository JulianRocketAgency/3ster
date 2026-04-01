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

function ReservationRow({ res, onStatusChange, nav }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const changeStatus = async (status) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    await fetch(`/api/reservations/${res.id}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status }),
    });
    setLoading(false); onStatusChange(res.id, status);
  };
  return (
    <div style={{ borderRadius:12, background:"#fff", border:"1px solid #e5e5ea", overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", background:"none", border:"none",
        cursor:"pointer", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#1d1d1f", minWidth:44 }}>{fmtTime(res.time)}</span>
        <span style={{ fontSize:13, color:"#1d1d1f", flex:1, fontWeight:500 }}>{res.name}</span>
        <span style={{ fontSize:12, color:"#86868b", display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>{res.guests}
        </span>
        <StatusBadge status={res.status}/>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2"
          style={{ transform:open?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid #f2f2f7" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"12px 0" }}>
            {res.email && (
              <div style={{ fontSize:12 }}>
                <div style={{ color:"#86868b", marginBottom:2 }}>E-mail</div>
                <div style={{ color:"#1d1d1f" }}>
                  {res.guest_id
                    ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }}
                        onClick={() => nav.navigate("guest", res.guest_id)}>{res.email}</span>
                    : res.email}
                </div>
              </div>
            )}
            {res.phone && <div style={{ fontSize:12 }}><div style={{ color:"#86868b", marginBottom:2 }}>Telefoon</div><div style={{ color:"#1d1d1f" }}>{res.phone}</div></div>}
            {res.notes && <div style={{ fontSize:12, gridColumn:"1/-1" }}><div style={{ color:"#86868b", marginBottom:2 }}>Opmerking</div><div style={{ color:"#1d1d1f" }}>{res.notes}</div></div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {res.status !== "confirmed" && <button onClick={() => changeStatus("confirmed")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", background:"#30d158", color:"#fff", fontSize:13, fontWeight:500, opacity:loading?0.6:1 }}>Bevestigen</button>}
            {res.status !== "cancelled" && <button onClick={() => changeStatus("cancelled")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #e5e5ea", cursor:"pointer", background:"#fff", color:"#ff3b30", fontSize:13, fontWeight:500, opacity:loading?0.6:1 }}>Annuleren</button>}
            {res.status === "cancelled" && <button onClick={() => changeStatus("pending")} disabled={loading} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #e5e5ea", cursor:"pointer", background:"#fff", color:"#86868b", fontSize:13, fontWeight:500 }}>Herstellen</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ date, reservations, onStatusChange, isToday, nav }) {
  const [open, setOpen] = useState(isToday);
  const dayName = DAYS[date.getDay()===0?6:date.getDay()-1];
  const count = reservations.length;
  const guests = reservations.reduce((s,r) => s+(r.guests||0), 0);
  const pending = reservations.filter(r => r.status==="pending").length;
  return (
    <div style={{ borderRadius:16, background:"#fff",
      border: isToday ? "1.5px solid #0071e3" : "1px solid #e5e5ea",
      overflow:"hidden", boxShadow: isToday ? "0 4px 20px rgba(0,113,227,0.1)" : "none" }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <button onClick={() => setOpen(!open)} style={{ flex:1, background:"none", border:"none", cursor:"pointer",
          padding:"16px 20px", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2"
              style={{ transform:open?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>
        <button onClick={() => nav.navigate("day", fmt(date))} title="Open dagweergave"
          style={{ background:"none", border:"none", borderLeft:"1px solid #f2f2f7", padding:"0 16px",
            cursor:"pointer", color:"#aeaeb2", transition:"color 0.15s, background 0.15s", flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.color="#0071e3"; e.currentTarget.style.background="#f0f7ff"; }}
          onMouseLeave={e => { e.currentTarget.style.color="#aeaeb2"; e.currentTarget.style.background="none"; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
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
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({length:7}, (_,i) => addDays(weekStart,i));
  const weekNumber = getWeekNumber(weekStart);
  const weekLabel = `${fmtDisplay(weekDates[0])} – ${fmtDisplay(weekDates[6])}`;

  useEffect(() => {
    setLoading(true);
    fetch("/api/reservations", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(data => { setReservations(Array.isArray(data)?data:[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = (id, status) =>
    setReservations(prev => prev.map(r => r.id===id ? {...r,status} : r));

  const today = fmt(new Date());
  const resByDay = weekDates.map(d => ({
    date:d, reservations:reservations.filter(r => r.date===fmt(d)), isToday:fmt(d)===today
  }));
  const weekRes = reservations.filter(r => weekDates.some(d => fmt(d)===r.date));
  const totalWeek = weekRes.length;
  const totalGuests = weekRes.reduce((s,r) => s+(r.guests||0), 0);
  const totalPending = weekRes.filter(r => r.status==="pending").length;

  return (
    <Layout nav={nav}>
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
        <div className="stat">
          <div className="stat-value" style={{ color:totalPending>0?"#ff9f0a":"#1d1d1f" }}>{totalPending}</div>
          <div className="stat-label">Nog te bevestigen</div>
        </div>
      </div>

      {loading
        ? <div className="spinner-wrap"><div className="spinner"/></div>
        : <div className="days">
            {resByDay.map(({ date, reservations, isToday }) =>
              <DayCard key={fmt(date)} date={date} reservations={reservations}
                onStatusChange={handleStatusChange} isToday={isToday} nav={nav}/>)}
          </div>}
    </Layout>
  );
}
