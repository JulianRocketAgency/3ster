import { useState } from "react";

export default function CancelModal({ reservation, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reservation.id, "cancelled", reason);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:"#fff", borderRadius:16, width:"100%", maxWidth:420, padding:28, boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize:17, fontWeight:600, color:"#1d1d1f", marginBottom:6 }}>Reservering annuleren</h3>
        <p style={{ fontSize:13, color:"#86868b", marginBottom:20 }}>
          Reservering van <strong>{reservation.name}</strong> annuleren?
          {reservation.email && " De gast ontvangt een e-mail."}
        </p>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#86868b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
            Reden van annulering (optioneel)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Bijv. restaurant gesloten, geen beschikbaarheid..."
            style={{ width:"100%", background:"#f5f5f7", border:"1.5px solid transparent", borderRadius:10, padding:"12px 14px", fontFamily:"inherit", fontSize:14, color:"#1d1d1f", outline:"none", resize:"vertical", height:80, boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="#0071e3"}
            onBlur={e => e.target.style.borderColor="transparent"}
          />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:"#f5f5f7", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:500, color:"#1d1d1f" }}>
            Terug
          </button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex:1, padding:"11px", background:"#ff3b30", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:500, color:"#fff", opacity:loading?0.6:1 }}>
            {loading ? "Annuleren..." : "Annuleren bevestigen"}
          </button>
        </div>
      </div>
    </div>
  );
}
