import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ongeldig e-mailadres of wachtwoord.");
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f5f5f7;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          padding-top: max(24px, env(safe-area-inset-top));
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          -webkit-font-smoothing: antialiased;
        }

        .card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.07);
          width: 100%;
          max-width: 400px;
          padding: 48px 40px 40px;
        }

        .header { text-align: center; margin-bottom: 36px; }

        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: #f5f5f7;
          border-radius: 16px;
          margin-bottom: 20px;
          font-size: 26px;
        }

        .header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
        }

        .header p { font-size: 14px; color: #86868b; }

        .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 13px; font-weight: 500; color: #1d1d1f; }

        .field-input {
          background: #f5f5f7;
          border: 1.5px solid transparent;
          border-radius: 10px;
          padding: 14px 16px;
          font-family: inherit;
          font-size: 16px;
          color: #1d1d1f;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
        }
        .field-input::placeholder { color: #aeaeb2; }
        .field-input:focus {
          background: #fff;
          border-color: #0071e3;
          box-shadow: 0 0 0 3px rgba(0,113,227,0.12);
        }

        .pass-wrap { position: relative; }
        .pass-wrap .field-input { padding-right: 48px; }

        .show-pass {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #aeaeb2;
          display: flex; align-items: center; padding: 6px; margin: -6px;
          transition: color 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .show-pass:hover { color: #1d1d1f; }

        .error-msg {
          font-size: 13px; color: #ff3b30;
          background: rgba(255,59,48,0.06);
          border-radius: 8px; padding: 10px 14px;
          margin-bottom: 12px; text-align: center;
        }

        .submit-btn {
          width: 100%; padding: 15px; background: #0071e3; color: #fff;
          font-family: inherit; font-size: 16px; font-weight: 500;
          border: none; border-radius: 10px; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center;
          min-height: 50px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .submit-btn:hover:not(:disabled) { background: #0077ed; }
        .submit-btn:active:not(:disabled) { transform: scale(0.985); background: #006edb; }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
        .divider-line { flex: 1; height: 1px; background: #e5e5ea; }
        .divider span { font-size: 12px; color: #aeaeb2; white-space: nowrap; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (min-width: 600px) and (max-width: 900px) {
          .card { max-width: 440px; padding: 52px 48px 44px; }
        }

        @media (max-width: 599px) {
          .login-root { align-items: flex-end; padding: 0; background: #fff; }
          .card {
            max-width: 100%;
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
            padding: 36px 24px max(28px, env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className="login-root">
        <div className="card">
          <div className="header">
            <div className="logo-mark">★</div>
            <h1>De 3 Ster</h1>
            <p>Inloggen bij reserveringsbeheer</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="fields">
              <div className="field">
                <label htmlFor="email">E-mailadres</label>
                <input
                  id="email" className="field-input" type="email"
                  placeholder="naam@3ster.nl" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" inputMode="email"
                />
              </div>
              <div className="field">
                <label htmlFor="password">Wachtwoord</label>
                <div className="pass-wrap">
                  <input
                    id="password" className="field-input"
                    type={showPass ? "text" : "password"}
                    placeholder="Wachtwoord" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                  />
                  <button type="button" className="show-pass"
                    onClick={() => setShowPass(!showPass)} aria-label="Wachtwoord tonen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPass ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Inloggen"}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span>De 3 Ster · Otterlo</span>
            <div className="divider-line" />
          </div>
        </div>
      </div>
    </>
  );
}
