import { useState } from "react";

export default function Layout({ nav, children }) {
  const { logout, navigate } = nav;
  const token = localStorage.getItem("token");
  const name = token ? JSON.parse(atob(token.split(".")[1])).name : "?";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f7; }
        .layout { min-height: 100vh; background: #f5f5f7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }
        .topbar {
          background: rgba(255,255,255,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e5e5ea; padding: 0 20px; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .topbar-brand h1 { font-size: 15px; font-weight: 600; color: #1d1d1f; transition: color 0.15s; }
        .topbar-brand:hover h1 { color: #0071e3; }
        .topbar-right { display: flex; align-items: center; gap: 8px; }
        .greeting { font-size: 13px; color: #86868b; }
        .menu-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e5ea;
          background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .menu-btn:hover { background: #f5f5f7; }
        .dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #fff; border-radius: 14px; border: 1px solid #e5e5ea;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 210px; overflow: hidden; z-index: 200;
        }
        .dropdown-header { padding: 14px 16px 10px; border-bottom: 1px solid #f2f2f7; }
        .dropdown-header span { font-size: 12px; color: #86868b; }
        .dropdown-header strong { display: block; font-size: 14px; font-weight: 600; color: #1d1d1f; margin-top: 1px; }
        .dropdown-item {
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 13px 16px; display: flex; align-items: center; gap: 12px;
          font-family: inherit; font-size: 14px; color: #1d1d1f; text-align: left;
          transition: background 0.1s; -webkit-tap-highlight-color: transparent;
        }
        .dropdown-item:hover { background: #f5f5f7; }
        .dropdown-item svg { color: #86868b; flex-shrink: 0; }
        .dropdown-divider { height: 1px; background: #f2f2f7; }
        .dropdown-item.danger { color: #ff3b30; }
        .dropdown-item.danger svg { color: #ff3b30; }
        .overlay { position: fixed; inset: 0; z-index: 99; }
        .page-content { padding: 24px; max-width: 800px; margin: 0 auto; }
        @media (max-width: 600px) { .page-content { padding: 16px; } .greeting { display: none; } }
      `}</style>
      <div className="layout">
        <div className="topbar">
          <div className="topbar-brand" onClick={() => navigate("dashboard")}>
            <span>★</span>
            <h1>De 3 Ster</h1>
          </div>
          <div className="topbar-right">
            <span className="greeting">Hoi, {name}</span>
            <div style={{ position: "relative" }}>
              <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="overlay" onClick={() => setMenuOpen(false)} />
                  <div className="dropdown">
                    <div className="dropdown-header">
                      <span>Ingelogd als</span>
                      <strong>{name}</strong>
                    </div>
                    {[
                      { page: "dashboard", label: "Reserveringen", icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></> },
                      { page: "guests", label: "Gasten", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
                      { page: "settings", label: "Instellingen", icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
                    ].map(({ page, label, icon }) => (
                      <button key={page} className="dropdown-item" onClick={() => { navigate(page); setMenuOpen(false); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{icon}</svg>
                        {label}
                      </button>
                    ))}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={logout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Uitloggen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </>
  );
}
