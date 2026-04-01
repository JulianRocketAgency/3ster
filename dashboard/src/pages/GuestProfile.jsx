import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const STATUS_COLOR = { pending:"#ff9f0a", confirmed:"#30d158", cancelled:"#ff3b30" };
const STATUS_LABEL = { pending:"Nieuw", confirmed:"Bevestigd", cancelled:"Geannuleerd" };

export default function GuestProfile({ id, nav }) {
  const token = localStorage.getItem("token");
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/guests/${id}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(data => { setGuest(data); setForm({ name:data.name, phone:data.phone||"", notes:data.notes||"" }); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/guests/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body: JSON.stringify(form),
    });
    setGuest(g => ({...g, ...form})); setSaving(false); setEditing(false);
  };

  if (loading) return <Layout nav={nav}><div style={{ display:"flex", justifyContent:"center", padding:60 }}><div style={{ width:24,height:24,border:"2px solid #e5e5ea",borderTopColor:"#0071e3",borderRadius:"50%",animation:"spin 0.65s linear infinite" }}/></div></Layout>;
  if (!guest) return <Layout nav={nav}><p style={{ color:"#86868b", textAlign:"center", padding:60 }}>Gast niet gevonden</p></Layout>;

  const lastVisit = guest.last_visit ? new Date(guest.last_visit?.slice(0,10)+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"}) : "—";

  return (
    <Layout nav={nav}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .back-btn { display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-family:inherit; font-size:13px; color:#0071e3; padding:0; margin-bottom:20px; }
        .back-btn:hover { text-decoration:underline; }
        .profile-card { background:#fff; border:1px solid #e5e5ea; border-radius:20px; padding:28px; margin-bottom:16px; }
        .profile-top { display:flex; align-items:center; gap:16px; margin-bottom:24px; }
        .big-avatar { width:64px; height:64px; border-radius:50%; background:#e8f0fe; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:600; color:#0071e3; flex-shrink:0; }
        .profile-name { font-size:20px; font-weight:600; color:#1d1d1f; margin-bottom:3px; }
        .profile-email { font-size:13px; color:#86868b; }
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
        .mini-stat { text-align:center; background:#f5f5f7; border-radius:12px; padding:14px 10px; }
        .mini-stat-val { font-size:22px; font-weight:600; color:#1d1d1f; }
        .mini-stat-lbl { font-size:11px; color:#86868b; margin-top:2px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .field { display:flex; flex-direction:column; gap:4px; }
        .field-label { font-size:11px; color:#86868b; text-transform:uppercase; letter-spacing:0.5px; }
        .field-val { font-size:14px; color:#1d1d1f; }
        .field-input { background:#f5f5f7; border:1.5px solid transparent; border-radius:8px; padding:10px 12px; font-family:inherit; font-size:14px; color:#1d1d1f; outline:none; transition:border-color 0.15s, box-shadow 0.15s; width:100%; }
        .field-input:focus { background:#fff; border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,0.1); }
        .edit-btns { display:flex; gap:8px; margin-top:16px; }
        .btn-save { flex:1; padding:10px; background:#0071e3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-family:inherit; font-size:14px; font-weight:500; }
        .btn-cancel-edit { flex:1; padding:10px; background:#fff; color:#1d1d1f; border:1px solid #e5e5ea; border-radius:8px; cursor:pointer; font-family:inherit; font-size:14px; }
        .btn-edit { padding:8px 16px; background:#fff; color:#0071e3; border:1px solid #0071e3; border-radius:8px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; }
        .section-title { font-size:15px; font-weight:600; color:#1d1d1f; margin-bottom:12px; }
        .history-item { background:#fff; border:1px solid #e5e5ea; border-radius:12px; padding:14px 16px; margin-bottom:8px; display:flex; align-items:center; gap:12px; }
        .history-date { font-size:13px; font-weight:500; color:#1d1d1f; min-width:100px; }
        .history-detail { font-size:12px; color:#86868b; flex:1; }
        .empty-history { color:#aeaeb2; font-size:13px; text-align:center; padding:32px; }
      `}</style>

      <button className="back-btn" onClick={() => nav.navigate("guests")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Terug naar gasten
      </button>

      <div className="profile-card">
        <div className="profile-top">
          <div className="big-avatar">{guest.name.charAt(0).toUpperCase()}</div>
          <div style={{ flex:1 }}>
            <div className="profile-name">{guest.name}</div>
            <div className="profile-email">{guest.email}</div>
          </div>
          {!editing && <button className="btn-edit" onClick={() => setEditing(true)}>Bewerken</button>}
        </div>

        <div className="stats-row">
          <div className="mini-stat"><div className="mini-stat-val">{guest.visit_count||0}</div><div className="mini-stat-lbl">Bezoeken</div></div>
          <div className="mini-stat"><div className="mini-stat-val">{guest.total_guests_hosted||0}</div><div className="mini-stat-lbl">Gasten totaal</div></div>
          <div className="mini-stat"><div className="mini-stat-val" style={{ fontSize:14, marginTop:4 }}>{lastVisit}</div><div className="mini-stat-lbl">Laatste bezoek</div></div>
        </div>

        {editing ? (
          <>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Naam</label>
                <input className="field-input" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}/>
              </div>
              <div className="field">
                <label className="field-label">Telefoon</label>
                <input className="field-input" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="—"/>
              </div>
              <div className="field" style={{ gridColumn:"1/-1" }}>
                <label className="field-label">Interne notitie</label>
                <input className="field-input" value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} placeholder="Bijv. vaste gast, allergieën…"/>
              </div>
            </div>
            <div className="edit-btns">
              <button className="btn-cancel-edit" onClick={() => setEditing(false)}>Annuleren</button>
              <button className="btn-save" onClick={save} disabled={saving}>{saving?"Opslaan…":"Opslaan"}</button>
            </div>
          </>
        ) : (
          <div className="field-row">
            <div className="field"><div className="field-label">Telefoon</div><div className="field-val">{guest.phone||"—"}</div></div>
            <div className="field"><div className="field-label">Klant sinds</div><div className="field-val">{new Date(guest.created_at).toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}</div></div>
            {guest.notes && <div className="field" style={{ gridColumn:"1/-1" }}><div className="field-label">Notitie</div><div className="field-val">{guest.notes}</div></div>}
          </div>
        )}
      </div>

      <div className="section-title">Reserveringsgeschiedenis</div>
      {!guest.reservations || guest.reservations.length === 0 ? (
        <div className="empty-history">Geen eerdere reserveringen</div>
      ) : (
        guest.reservations.map(r => (
          <div key={r.id} className="history-item">
            <div className="history-date">{new Date(r.date).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"})}</div>
            <div className="history-detail">{r.time?.slice(0,5)} · {r.guests} personen{r.notes ? ` · ${r.notes}` : ""}</div>
            <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:500,
              padding:"2px 8px", borderRadius:20, background:STATUS_COLOR[r.status]+"18", color:STATUS_COLOR[r.status] }}>
              {STATUS_LABEL[r.status]}
            </span>
          </div>
        ))
      )}
    </Layout>
  );
}
