import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const STATUS_COLOR = { pending:"#ff9f0a", confirmed:"#30d158", cancelled:"#ff3b30" };

function fmtTime(t) { return t ? t.slice(0,5) : ""; }

export default function Incoming({ nav }) {
  const token = localStorage.getItem("token");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + "/api/reservations", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const pending = (Array.isArray(data)?data:[])
          .filter(r => r.status === "pending")
          .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        setReservations(pending);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const changeStatus = async (id, status) => {
    await fetch((import.meta.env.VITE_API_URL || "") + `/api/reservations/${id}/status`, {
      method:"PATCH",
      headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify({ status }),
    });
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const confirmAll = async () => {
    for (const r of reservations) await changeStatus(r.id, "confirmed");
  };

  return (
    <Layout nav={nav}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .page-title { font-size:22px; font-weight:600; color:#1d1d1f; }
        .confirm-all-btn { padding:10px 20px; background:#30d158; color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:inherit; font-size:14px; font-weight:500; transition:background 0.15s; }
        .confirm-all-btn:hover { background:#28b84c; }
        .date-group { margin-bottom:24px; }
        .date-label { font-size:12px; font-weight:600; color:#86868b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
        .res-card { background:#fff; border:1px solid #e5e5ea; border-radius:14px; padding:16px 18px; margin-bottom:8px; }
        .res-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .res-name { font-size:15px; font-weight:600; color:#1d1d1f; margin-bottom:4px; }
        .res-meta { font-size:13px; color:#86868b; display:flex; gap:10px; flex-wrap:wrap; }
        .res-detail { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
        .res-field-label { font-size:11px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
        .res-field-val { font-size:13px; color:#1d1d1f; }
        .res-actions { display:flex; gap:8px; }
        .btn-confirm { flex:1; padding:9px 0; border-radius:8px; border:none; cursor:pointer; background:#30d158; color:#fff; font-size:13px; font-weight:500; font-family:inherit; }
        .btn-cancel { flex:1; padding:9px 0; border-radius:8px; border:1px solid #e5e5ea; cursor:pointer; background:#fff; color:#ff3b30; font-size:13px; font-weight:500; font-family:inherit; }
        .empty { text-align:center; padding:80px 20px; }
        .empty-icon { font-size:48px; margin-bottom:16px; }
        .empty-title { font-size:17px; font-weight:600; color:#1d1d1f; margin-bottom:6px; }
        .empty-sub { font-size:14px; color:#86868b; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        .new-badge { display:inline-flex; align-items:center; gap:4px; background:#ff9f0a18; color:#ff9f0a; font-size:11px; font-weight:600; padding:"2px 8px"; border-radius:20px; padding:2px 8px; }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            Nieuwe reserveringen
            {reservations.length > 0 && (
              <span className="new-badge" style={{ marginLeft:10, fontSize:12 }}>
                {reservations.length} nieuw
              </span>
            )}
          </div>
        </div>
        {reservations.length > 1 && (
          <button className="confirm-all-btn" onClick={confirmAll}>
            ✓ Alles bevestigen ({reservations.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"/></div>
      ) : reservations.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">Alles verwerkt</div>
          <div className="empty-sub">Er zijn geen nieuwe reserveringen om te bevestigen</div>
        </div>
      ) : (
        (() => {
          // Groepeer per datum
          const groups = {};
          for (const r of reservations) {
            if (!groups[r.date]) groups[r.date] = [];
            groups[r.date].push(r);
          }
          return Object.entries(groups).map(([date, items]) => (
            <div key={date} className="date-group">
              <div className="date-label">
                {new Date(date+"T12:00:00").toLocaleDateString("nl-NL",{ weekday:"long", day:"numeric", month:"long" })}
              </div>
              {items.map(r => (
                <div key={r.id} className="res-card">
                  <div className="res-top">
                    <div>
                      <div className="res-name">{r.name}</div>
                      <div className="res-meta">
                        <span>🕐 {fmtTime(r.time)}</span>
                        <span>👥 {r.guests} personen</span>
                      </div>
                    </div>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#ff9f0a18", color:"#ff9f0a" }}>
                      ● Nieuw
                    </span>
                  </div>
                  {(r.email || r.phone || r.notes) && (
                    <div className="res-detail">
                      {r.email && <div>
                        <div className="res-field-label">E-mail</div>
                        <div className="res-field-val">
                          {r.guest_id
                            ? <span style={{ color:"#0071e3", cursor:"pointer", textDecoration:"underline" }} onClick={() => nav.navigate("guest", r.guest_id)}>{r.email}</span>
                            : r.email}
                        </div>
                      </div>}
                      {r.phone && <div>
                        <div className="res-field-label">Telefoon</div>
                        <div className="res-field-val">{r.phone}</div>
                      </div>}
                      {r.notes && <div style={{ gridColumn:"1/-1" }}>
                        <div className="res-field-label">Opmerking</div>
                        <div className="res-field-val" style={{ fontStyle:"italic" }}>{r.notes}</div>
                      </div>}
                    </div>
                  )}
                  <div className="res-actions">
                    <button className="btn-confirm" onClick={() => changeStatus(r.id,"confirmed")}>✓ Bevestigen</button>
                    <button className="btn-cancel" onClick={() => changeStatus(r.id,"cancelled")}>✕ Annuleren</button>
                  </div>
                </div>
              ))}
            </div>
          ));
        })()
      )}
    </Layout>
  );
}
