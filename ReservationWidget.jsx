import { useState, useEffect } from "react";

const STEPS = ["Datum & tijd", "Gegevens", "Bevestig"];

function StepIndicator({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:32 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:600,
              background: i < current ? "#30d158" : i === current ? "#0071e3" : "#e5e5ea",
              color: i <= current ? "#fff" : "#86868b",
              transition:"all 0.2s",
            }}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontSize:11, color: i === current ? "#0071e3" : "#86868b", fontWeight: i === current ? 500 : 400, whiteSpace:"nowrap" }}>{label}</span>
          </div>
          {i < STEPS.length-1 && (
            <div style={{ width:48, height:2, background: i < current ? "#30d158" : "#e5e5ea", margin:"0 4px", marginBottom:18, transition:"background 0.2s" }}/>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ReservationWidget({ apiBase = "" }) {
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const [form, setForm] = useState({
    date: "",
    time: "",
    guests: 2,
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const set = (key, val) => setForm(f => ({...f, [key]: val}));

  // Laad slots als datum verandert
  useEffect(() => {
    if (!form.date) return;
    setLoadingSlots(true);
    setForm(f => ({...f, time:""}));
    fetch(`${apiBase}/api/slots/${form.date}`)
      .then(r => r.json())
      .then(data => { setSlots(Array.isArray(data)?data:[]); setLoadingSlots(false); })
      .catch(() => setLoadingSlots(false));
  }, [form.date]);

  const availableSlots = slots.filter(s => s.available);

  const submitReservation = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/reservations`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Er ging iets mis");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDateNL = (str) => {
    if (!str) return "";
    return new Date(str+"T12:00:00").toLocaleDateString("nl-NL",{ weekday:"long", day:"numeric", month:"long" });
  };

  if (done) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:22, fontWeight:600, color:"#1d1d1f", marginBottom:8 }}>Reservering ontvangen!</h2>
          <p style={{ fontSize:15, color:"#86868b", lineHeight:1.6, marginBottom:24 }}>
            Bedankt {form.name}! We hebben uw reservering in goede orde ontvangen.<br/>
            {form.email && "U ontvangt een bevestiging per e-mail."}
          </p>
          <div style={{ background:"#f5f5f7", borderRadius:12, padding:"16px 20px", textAlign:"left", marginBottom:24 }}>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Datum</span><span style={styles.detailVal}>{fmtDateNL(form.date)}</span></div>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Tijd</span><span style={styles.detailVal}>{form.time}</span></div>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Personen</span><span style={styles.detailVal}>{form.guests}</span></div>
          </div>
          <button onClick={() => { setDone(false); setStep(0); setForm({date:"",time:"",guests:2,name:"",email:"",phone:"",notes:""}); }}
            style={styles.btnSecondary}>Nieuwe reservering</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:600, color:"#1d1d1f", marginBottom:4 }}>Reserveren</h2>
        <p style={{ fontSize:14, color:"#86868b" }}>De 3 Ster · Otterlo</p>
      </div>

      <StepIndicator current={step}/>

      {/* STAP 1 — Datum & tijd */}
      {step === 0 && (
        <div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Datum</label>
            <input type="date" style={styles.input} value={form.date} min={todayStr}
              onChange={e => set("date", e.target.value)}/>
          </div>

          {form.date && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Aantal personen</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => set("guests", n)} style={{
                    width:44, height:44, borderRadius:10, border:"1.5px solid",
                    borderColor: form.guests===n ? "#0071e3" : "#e5e5ea",
                    background: form.guests===n ? "#0071e3" : "#fff",
                    color: form.guests===n ? "#fff" : "#1d1d1f",
                    fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}

          {form.date && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Kies een tijd</label>
              {loadingSlots ? (
                <p style={{ fontSize:13, color:"#86868b" }}>Beschikbaarheid laden...</p>
              ) : availableSlots.length === 0 ? (
                <div style={{ background:"#fff2f2", border:"1px solid #ffcdd2", borderRadius:10, padding:"12px 16px" }}>
                  <p style={{ fontSize:13, color:"#cc0000", margin:0 }}>Geen beschikbare tijden op deze dag. Kies een andere datum.</p>
                </div>
              ) : (
                <>
                  {["lunch","dinner"].map(period => {
                    const periodSlots = availableSlots.filter(s => s.period===period);
                    if (!periodSlots.length) return null;
                    return (
                      <div key={period} style={{ marginBottom:16 }}>
                        <p style={{ fontSize:11, fontWeight:600, color:"#86868b", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                          {period==="lunch" ? "🍽 Lunch" : "🍷 Diner"}
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {periodSlots.map(slot => (
                            <button key={slot.time} onClick={() => set("time", slot.time)} style={{
                              padding:"10px 16px", borderRadius:10, border:"1.5px solid",
                              borderColor: form.time===slot.time ? "#0071e3" : "#e5e5ea",
                              background: form.time===slot.time ? "#0071e3" : "#fff",
                              color: form.time===slot.time ? "#fff" : "#1d1d1f",
                              fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
                            }}>
                              {slot.time}
                              <span style={{ fontSize:11, marginLeft:6, opacity:0.75 }}>({slot.spots_left} vrij)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          <button onClick={() => setStep(1)} disabled={!form.date || !form.time} style={styles.btnPrimary}>
            Volgende →
          </button>
        </div>
      )}

      {/* STAP 2 — Gegevens */}
      {step === 1 && (
        <div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Naam *</label>
            <input style={styles.input} type="text" placeholder="Uw naam" value={form.name}
              onChange={e => set("name", e.target.value)}/>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mailadres</label>
            <input style={styles.input} type="email" placeholder="Voor de bevestiging" value={form.email}
              onChange={e => set("email", e.target.value)}/>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Telefoonnummer</label>
            <input style={styles.input} type="tel" placeholder="Optioneel" value={form.phone}
              onChange={e => set("phone", e.target.value)}/>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Opmerkingen</label>
            <textarea style={{...styles.input, height:80, resize:"vertical"}}
              placeholder="Allergieën, speciale wensen..." value={form.notes}
              onChange={e => set("notes", e.target.value)}/>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep(0)} style={styles.btnSecondary}>← Terug</button>
            <button onClick={() => setStep(2)} disabled={!form.name} style={{...styles.btnPrimary, flex:1}}>
              Volgende →
            </button>
          </div>
        </div>
      )}

      {/* STAP 3 — Bevestig */}
      {step === 2 && (
        <div>
          <div style={{ background:"#f5f5f7", borderRadius:14, padding:"20px 24px", marginBottom:24 }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:"#1d1d1f", marginBottom:14 }}>Uw reservering</h3>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Datum</span><span style={styles.detailVal}>{fmtDateNL(form.date)}</span></div>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Tijd</span><span style={styles.detailVal}>{form.time}</span></div>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Personen</span><span style={styles.detailVal}>{form.guests}</span></div>
            <div style={styles.detailRow}><span style={styles.detailLabel}>Naam</span><span style={styles.detailVal}>{form.name}</span></div>
            {form.email && <div style={styles.detailRow}><span style={styles.detailLabel}>E-mail</span><span style={styles.detailVal}>{form.email}</span></div>}
            {form.phone && <div style={styles.detailRow}><span style={styles.detailLabel}>Telefoon</span><span style={styles.detailVal}>{form.phone}</span></div>}
            {form.notes && <div style={{ marginTop:10 }}><span style={styles.detailLabel}>Opmerking</span><p style={{ fontSize:14, color:"#1d1d1f", margin:"4px 0 0" }}>{form.notes}</p></div>}
          </div>

          {error && <p style={{ fontSize:13, color:"#ff3b30", background:"rgba(255,59,48,0.06)", borderRadius:8, padding:"10px 14px", marginBottom:16, textAlign:"center" }}>{error}</p>}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep(1)} style={styles.btnSecondary}>← Terug</button>
            <button onClick={submitReservation} disabled={submitting} style={{...styles.btnPrimary, flex:1}}>
              {submitting ? "Versturen..." : "Reservering plaatsen"}
            </button>
          </div>

          <p style={{ fontSize:11, color:"#aeaeb2", textAlign:"center", marginTop:12 }}>
            U ontvangt een bevestiging per e-mail zodra uw reservering is geplaatst.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background:"#fff", borderRadius:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.07)",
    padding:"36px 32px", maxWidth:480, margin:"0 auto",
    fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", WebkitFontSmoothing:"antialiased",
  },
  fieldGroup: { marginBottom:20 },
  label: { display:"block", fontSize:13, fontWeight:500, color:"#1d1d1f", marginBottom:6 },
  input: {
    width:"100%", background:"#f5f5f7", border:"1.5px solid transparent", borderRadius:10,
    padding:"13px 14px", fontFamily:"inherit", fontSize:15, color:"#1d1d1f", outline:"none",
    boxSizing:"border-box", transition:"border-color 0.15s",
  },
  btnPrimary: {
    width:"100%", padding:"14px", background:"#0071e3", color:"#fff", border:"none",
    borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:500,
    transition:"background 0.15s", opacity:1,
  },
  btnSecondary: {
    padding:"14px 20px", background:"#f5f5f7", color:"#1d1d1f", border:"none",
    borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:500,
  },
  detailRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #e5e5ea" },
  detailLabel: { fontSize:13, color:"#86868b" },
  detailVal: { fontSize:14, fontWeight:500, color:"#1d1d1f", textTransform:"capitalize" },
};
