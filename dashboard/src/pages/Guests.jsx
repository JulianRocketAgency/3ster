import { useState, useEffect } from "react";
import Layout from "./Layout.jsx";

const PAGE_SIZE = 30;

export default function Guests({ nav }) {
  const token = localStorage.getItem("token");
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + "/api/guests", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setGuests(Array.isArray(data)?data:[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Reset naar pagina 1 bij zoeken
  useEffect(() => { setPage(1); }, [search]);

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <Layout nav={nav}>
      <style>{`
        .page-title { font-size:22px; font-weight:600; color:#1d1d1f; margin-bottom:20px; }
        .search-wrap { position:relative; margin-bottom:16px; }
        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#aeaeb2; pointer-events:none; }
        .search-input { width:100%; background:#fff; border:1px solid #e5e5ea; border-radius:10px; padding:12px 14px 12px 38px; font-family:inherit; font-size:15px; color:#1d1d1f; outline:none; transition:border-color 0.15s, box-shadow 0.15s; }
        .search-input::placeholder { color:#aeaeb2; }
        .search-input:focus { border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,0.1); }
        .results-info { font-size:12px; color:#86868b; margin-bottom:12px; }
        .guest-list { display:flex; flex-direction:column; gap:8px; }
        .guest-card { background:#fff; border:1px solid #e5e5ea; border-radius:14px; padding:14px 18px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:box-shadow 0.15s, border-color 0.15s; }
        .guest-card:hover { border-color:#0071e3; box-shadow:0 2px 12px rgba(0,113,227,0.08); }
        .avatar { width:40px; height:40px; border-radius:50%; background:#e8f0fe; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:600; color:#0071e3; flex-shrink:0; }
        .guest-info { flex:1; min-width:0; }
        .guest-name { font-size:14px; font-weight:600; color:#1d1d1f; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .guest-email { font-size:12px; color:#86868b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .guest-stats { text-align:right; flex-shrink:0; }
        .guest-visits { font-size:15px; font-weight:600; color:#1d1d1f; }
        .guest-visits-lbl { font-size:11px; color:#86868b; }
        .pagination { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:20px; flex-wrap:wrap; }
        .page-btn { width:36px; height:36px; border-radius:8px; border:1px solid #e5e5ea; background:#fff; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500; color:#1d1d1f; transition:all 0.15s; display:flex; align-items:center; justify-content:center; }
        .page-btn:hover { border-color:#0071e3; color:#0071e3; }
        .page-btn.active { background:#0071e3; border-color:#0071e3; color:#fff; }
        .page-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .page-ellipsis { color:#aeaeb2; font-size:13px; padding:0 4px; }
        .empty { text-align:center; padding:60px 20px; color:#aeaeb2; font-size:14px; }
        .spinner-wrap { display:flex; justify-content:center; padding:60px; }
        .spinner { width:24px; height:24px; border:2px solid #e5e5ea; border-top-color:#0071e3; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="page-title">Gasten</div>

      <div className="search-wrap">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input className="search-input" placeholder="Zoek op naam of e-mail…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {!loading && (
        <div className="results-info">
          {filtered.length} gast{filtered.length !== 1 ? "en" : ""}
          {search && ` gevonden voor "${search}"`}
          {!search && ` · pagina ${page} van ${totalPages}`}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="empty">{search ? "Geen gasten gevonden" : "Nog geen gasten"}</div>
      ) : (
        <>
          <div className="guest-list">
            {paginated.map(g => (
              <div key={g.id} className="guest-card" onClick={() => nav.navigate("guest", g.id)}>
                <div className="avatar">{g.name.charAt(0).toUpperCase()}</div>
                <div className="guest-info">
                  <div className="guest-name">{g.name}</div>
                  <div className="guest-email">{g.email}</div>
                </div>
                <div className="guest-stats">
                  <div className="guest-visits">{g.visit_count || 0}×</div>
                  <div className="guest-visits-lbl">bezoeken</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => p-1)} disabled={page===1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              {(() => {
                const pages = [];
                const delta = 2;
                const left = Math.max(1, page - delta);
                const right = Math.min(totalPages, page + delta);

                if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
                for (let i = left; i <= right; i++) pages.push(i);
                if (right < totalPages) { if (right < totalPages-1) pages.push("..."); pages.push(totalPages); }

                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="page-ellipsis">…</span>
                  ) : (
                    <button key={p} className={`page-btn ${page===p?"active":""}`} onClick={() => setPage(p)}>{p}</button>
                  )
                );
              })()}

              <button className="page-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
