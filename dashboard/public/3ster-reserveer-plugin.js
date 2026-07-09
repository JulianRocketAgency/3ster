/**
 * ═══════════════════════════════════════════════════
 *  De 3 Ster — Reserveringswidget Plugin v1.0
 *  Door Rocket Agency · www.rocket-agency.nl
 * ═══════════════════════════════════════════════════
 *
 *  INSTALLATIE (kopieer dit naar je website):
 *  ─────────────────────────────────────────
 *  Plak onderaan elke pagina, vóór </body>:
 *
 *  <script src="https://3ster.vercel.app/3ster-reserveer-plugin.js"></script>
 *
 *  De zweefknop rechtsonder verschijnt automatisch.
 *
 *  WIDGET IN PAGINA (optioneel):
 *  ─────────────────────────────
 *  Voeg dit toe op je reserveringspagina:
 *
 *  <div id="driestar-widget-inline"></div>
 *  <script>DrieStarReserveer.inline('driestar-widget-inline')</script>
 *
 *  KNOP ZELF TOEVOEGEN:
 *  ────────────────────
 *  <button onclick="DrieStarReserveer.open()">Reserveer een tafel</button>
 */

(function () {
  'use strict';

  const API = 'https://3ster-production.up.railway.app';

  // ── KLEURENPALET (passend bij 3ster.vendelict.nl) ──
  const C = {
    bg:       '#1a1207',
    surface:  '#241a0a',
    card:     '#ffffff',
    accent:   '#c8922a',
    accentD:  '#a8761e',
    text:     '#1a1207',
    muted:    '#7a6a52',
    border:   '#e8dcc8',
    light:    '#fdf8f0',
    red:      '#c0392b',
    green:    '#2e7d32',
  };

  // ── FONTS ──
  const FONT = "'Crimson Text', Georgia, serif";
  const FONT_UI = "'DM Sans', system-ui, sans-serif";

  // ── STATE ──
  let state = {
    open: false,
    step: 0,
    date: '', time: '', guests: 2,
    name: '', email: '', phone: '', notes: '',
    slots: [], loadingSlots: false,
    submitting: false, done: false, error: '',
    settings: null, dayStatus: null,
    inlineId: null,
  };

  const STEPS = ['Datum & tijd', 'Uw gegevens', 'Bevestigen'];

  // ── HELPERS ──
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function fmtDate(str) {
    if (!str) return '';
    return new Date(str + 'T12:00:00').toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  function isDayClosed(d) {
    if (!state.settings) return false;
    const open = (state.settings.open_days || '').split(',').filter(Boolean).map(Number);
    const extra = Array.isArray(state.settings.closed_dates) ? state.settings.closed_dates : [];
    const day = new Date(d + 'T12:00:00').getDay();
    return !open.includes(day) || extra.some(c => c.date && c.date.slice(0,10) === d);
  }

  function getClosedReason(d) {
    if (!state.settings) return null;
    const extra = Array.isArray(state.settings.closed_dates) ? state.settings.closed_dates : [];
    return (extra.find(c => c.date && c.date.slice(0,10) === d) || {}).reason || null;
  }

  // ── API ──
  async function loadSettings() {
    try {
      const r = await fetch(`${API}/api/settings`);
      if (r.ok) state.settings = await r.json();
    } catch(e) {}
  }

  async function loadSlots(date) {
    state.loadingSlots = true; state.time = ''; state.dayStatus = null;
    render();
    if (isDayClosed(date)) {
      state.slots = []; state.loadingSlots = false; state.dayStatus = 'closed';
      render(); return;
    }
    try {
      const r = await fetch(`${API}/api/slots/${date}`);
      const d = await r.json();
      state.slots = Array.isArray(d) ? d : [];
      state.dayStatus = state.slots.filter(s => s.available).length > 0 ? 'open' : 'no_slots';
    } catch(e) { state.slots = []; state.dayStatus = 'no_slots'; }
    state.loadingSlots = false;
    render();
  }

  async function submitReservation() {
    state.submitting = true; state.error = ''; render();
    try {
      const r = await fetch(`${API}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name, email: state.email, phone: state.phone,
          date: state.date, time: state.time, guests: state.guests, notes: state.notes,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Er ging iets mis');
      state.done = true;
    } catch(e) { state.error = e.message; }
    state.submitting = false; render();
  }

  // ── CSS ──
  function injectCSS() {
    if (document.getElementById('ds-style')) return;
    const s = document.createElement('style');
    s.id = 'ds-style';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

      .ds-float {
        position: fixed; bottom: 28px; right: 28px; z-index: 99990;
        background: ${C.bg};
        color: #f5e6c8;
        border: none; border-radius: 50px;
        padding: 14px 24px 14px 18px;
        font-family: ${FONT_UI}; font-size: 15px; font-weight: 500;
        cursor: pointer; display: flex; align-items: center; gap: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        transition: transform 0.2s, box-shadow 0.2s;
        letter-spacing: 0.01em;
      }
      .ds-float:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.45); }
      .ds-float-icon {
        width: 32px; height: 32px; background: ${C.accent};
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 15px; flex-shrink: 0;
      }

      .ds-overlay {
        position: fixed; inset: 0; z-index: 99991;
        background: rgba(10,6,2,0.65);
        backdrop-filter: blur(6px);
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0;
        opacity: 0; pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .ds-overlay.ds-open { opacity: 1; pointer-events: all; }

      .ds-modal {
        background: ${C.light};
        width: 100%; max-width: 520px;
        max-height: 92vh;
        border-radius: 24px 24px 0 0;
        overflow-y: auto;
        padding: 0 0 32px;
        transform: translateY(40px);
        transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
        position: relative;
      }
      .ds-overlay.ds-open .ds-modal { transform: translateY(0); }

      @media (min-width: 600px) {
        .ds-overlay { align-items: center; padding: 24px; }
        .ds-modal { border-radius: 20px; max-height: 88vh; }
      }

      .ds-modal-header {
        background: ${C.bg};
        padding: 28px 28px 24px;
        position: relative;
        border-radius: 24px 24px 0 0;
      }
      @media (min-width: 600px) { .ds-modal-header { border-radius: 20px 20px 0 0; } }

      .ds-modal-handle {
        width: 40px; height: 4px; background: rgba(255,255,255,0.2);
        border-radius: 2px; margin: 0 auto 20px;
        display: block;
      }
      @media (min-width: 600px) { .ds-modal-handle { display: none; } }

      .ds-modal-title {
        font-family: ${FONT}; font-size: 28px; font-weight: 600;
        color: #f5e6c8; margin: 0 0 4px; letter-spacing: -0.3px;
      }
      .ds-modal-subtitle { font-family: ${FONT_UI}; font-size: 13px; color: rgba(245,230,200,0.55); letter-spacing: 0.05em; text-transform: uppercase; }

      .ds-close {
        position: absolute; top: 20px; right: 20px;
        width: 34px; height: 34px; border-radius: 50%;
        background: rgba(255,255,255,0.1); border: none; cursor: pointer;
        color: rgba(245,230,200,0.7); font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s;
      }
      .ds-close:hover { background: rgba(255,255,255,0.2); }

      .ds-steps {
        display: flex; align-items: center; padding: 20px 28px 0;
        margin-bottom: 4px;
      }
      .ds-step { display: flex; flex-direction: column; align-items: center; gap: 3px; }
      .ds-step-dot {
        width: 24px; height: 24px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-family: ${FONT_UI}; font-size: 11px; font-weight: 500;
        transition: all 0.2s;
      }
      .ds-step-lbl { font-family: ${FONT_UI}; font-size: 10px; white-space: nowrap; }
      .ds-step-line { flex: 1; height: 1px; margin: 0 6px; margin-bottom: 16px; }

      .ds-body { padding: 20px 28px 0; }

      .ds-field { margin-bottom: 16px; }
      .ds-label {
        display: block; font-family: ${FONT_UI}; font-size: 12px; font-weight: 500;
        color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
      }
      .ds-input {
        width: 100%; background: #fff; border: 1.5px solid ${C.border};
        border-radius: 10px; padding: 12px 14px;
        font-family: ${FONT_UI}; font-size: 15px; color: ${C.text}; outline: none;
        transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
        -webkit-appearance: none; appearance: none;
      }
      .ds-input:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(200,146,42,0.15); }
      textarea.ds-input { height: 72px; resize: vertical; }

      .ds-guests { display: flex; flex-wrap: wrap; gap: 7px; }
      .ds-g {
        width: 42px; height: 42px; border-radius: 10px;
        border: 1.5px solid ${C.border}; background: #fff;
        font-family: ${FONT_UI}; font-size: 15px; color: ${C.text};
        cursor: pointer; transition: all 0.15s;
      }
      .ds-g:hover { border-color: ${C.accent}; }
      .ds-g.ds-sel { background: ${C.accent}; border-color: ${C.accent}; color: #fff; }

      .ds-period { font-family: ${FONT_UI}; font-size: 11px; font-weight: 500; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin: 14px 0 8px; }
      .ds-slots { display: flex; flex-wrap: wrap; gap: 7px; }
      .ds-slot {
        padding: 9px 14px; border-radius: 10px;
        border: 1.5px solid ${C.border}; background: #fff;
        font-family: ${FONT_UI}; font-size: 14px; color: ${C.text};
        cursor: pointer; transition: all 0.15s;
      }
      .ds-slot:hover { border-color: ${C.accent}; }
      .ds-slot.ds-sel { background: ${C.accent}; border-color: ${C.accent}; color: #fff; }

      .ds-btn {
        width: 100%; padding: 14px; border: none; border-radius: 10px;
        font-family: ${FONT_UI}; font-size: 15px; font-weight: 500;
        cursor: pointer; transition: all 0.15s; margin-top: 8px;
      }
      .ds-btn-primary { background: ${C.bg}; color: #f5e6c8; }
      .ds-btn-primary:hover { background: #2d1f0a; }
      .ds-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .ds-btn-sec { background: #fff; color: ${C.text}; border: 1.5px solid ${C.border} !important; }
      .ds-btn-row { display: flex; gap: 8px; margin-top: 8px; }
      .ds-btn-row .ds-btn { margin-top: 0; }

      .ds-notice {
        border-radius: 10px; padding: 11px 14px;
        font-family: ${FONT_UI}; font-size: 13px; margin-top: 8px;
      }
      .ds-notice-red { background: #fdf2f2; border: 1px solid #f5c6c6; color: ${C.red}; }
      .ds-notice-amber { background: #fdf8ec; border: 1px solid #f5e0a0; color: #8a6000; }

      .ds-summary { background: #fff; border: 1px solid ${C.border}; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; }
      .ds-sum-title { font-family: ${FONT}; font-size: 18px; font-weight: 600; color: ${C.text}; margin-bottom: 12px; }
      .ds-sum-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid ${C.border}; }
      .ds-sum-row:last-child { border-bottom: none; }
      .ds-sum-lbl { font-family: ${FONT_UI}; font-size: 12px; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.05em; }
      .ds-sum-val { font-family: ${FONT_UI}; font-size: 14px; font-weight: 500; color: ${C.text}; }

      .ds-error { font-family: ${FONT_UI}; font-size: 13px; color: ${C.red}; background: #fdf2f2; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; text-align: center; }

      .ds-done { text-align: center; padding: 12px 0 8px; }
      .ds-done-icon { font-size: 48px; margin-bottom: 12px; }
      .ds-done-title { font-family: ${FONT}; font-size: 26px; font-weight: 600; color: ${C.text}; margin-bottom: 8px; }
      .ds-done-text { font-family: ${FONT_UI}; font-size: 14px; color: ${C.muted}; line-height: 1.7; margin-bottom: 20px; }

      .ds-divider { height: 1px; background: ${C.border}; margin: 8px 0 16px; }

      .ds-footer { font-family: ${FONT_UI}; font-size: 11px; color: #c0b09a; text-align: center; margin-top: 20px; }
      .ds-footer a { color: #c0b09a; text-decoration: none; }
      .ds-footer a:hover { text-decoration: underline; }

      /* Inline widget */
      .ds-inline-wrap {
        background: ${C.light}; border: 1px solid ${C.border};
        border-radius: 16px; overflow: hidden; max-width: 520px;
      }
      .ds-inline-wrap .ds-modal-header { border-radius: 16px 16px 0 0; }
      .ds-inline-wrap .ds-modal-handle { display: none; }
    `;
    document.head.appendChild(s);
  }

  // ── RENDER ──
  function stepsHTML() {
    return `<div class="ds-steps">${STEPS.map((lbl, i) => {
      const done = i < state.step, active = i === state.step;
      const bg = done ? C.green : active ? C.accent : C.border;
      const col = (done || active) ? '#fff' : C.muted;
      const lc = done ? C.green : active ? C.accent : '#d0c0a8';
      return `<div class="ds-step">
        <div class="ds-step-dot" style="background:${bg};color:${col}">${done ? '✓' : i+1}</div>
        <div class="ds-step-lbl" style="color:${lc};font-weight:${active?500:400}">${lbl}</div>
      </div>${i < STEPS.length-1 ? `<div class="ds-step-line" style="background:${lc}"></div>` : ''}`;
    }).join('')}</div>`;
  }

  function bodyHTML() {
    if (state.done) {
      return `<div class="ds-body"><div class="ds-done">
        <div class="ds-done-icon">🍽</div>
        <div class="ds-done-title">Reservering ontvangen</div>
        <div class="ds-done-text">Bedankt, ${state.name}! Uw reservering bij De 3 Ster is in goede orde ontvangen.${state.email ? '<br>U ontvangt een bevestiging per e-mail.' : ''}</div>
        <div class="ds-summary">
          <div class="ds-sum-row"><span class="ds-sum-lbl">Datum</span><span class="ds-sum-val">${fmtDate(state.date)}</span></div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Tijd</span><span class="ds-sum-val">${state.time}</span></div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Personen</span><span class="ds-sum-val">${state.guests}</span></div>
        </div>
        <button class="ds-btn ds-btn-sec" onclick="DrieStarReserveer._reset()">Nieuwe reservering maken</button>
      </div>
      <div class="ds-footer"><a href="https://www.rocket-agency.nl" target="_blank">Reserveringssysteem door Rocket Agency</a></div>
      </div>`;
    }

    if (state.step === 0) {
      const avail = state.slots.filter(s => s.available);
      const lunch = avail.filter(s => s.period === 'lunch');
      const dinner = avail.filter(s => s.period === 'dinner');
      const closed = state.dayStatus === 'closed';
      const noSlots = state.dayStatus === 'no_slots';
      return `<div class="ds-body">
        <div class="ds-field">
          <label class="ds-label">Datum</label>
          <input class="ds-input" type="date" id="ds-d" value="${state.date}" min="${today()}" onchange="DrieStarReserveer._date(this.value)" />
          ${closed ? `<div class="ds-notice ds-notice-red">🔴 ${getClosedReason(state.date) ? `Gesloten — ${getClosedReason(state.date)}` : 'Op deze dag zijn wij gesloten'}</div>` : ''}
        </div>
        ${state.date && !closed ? `
        <div class="ds-field">
          <label class="ds-label">Aantal personen</label>
          <div class="ds-guests">${[1,2,3,4,5,6,7,8].map(n => `<button class="ds-g ${state.guests===n?'ds-sel':''}" onclick="DrieStarReserveer._guests(${n})">${n}</button>`).join('')}</div>
        </div>
        <div class="ds-field">
          <label class="ds-label">Tijdstip</label>
          ${state.loadingSlots ? `<p style="font-family:${FONT_UI};font-size:13px;color:${C.muted}">Beschikbaarheid laden…</p>` :
            noSlots ? `<div class="ds-notice ds-notice-amber">Geen beschikbare tijden op deze dag. Kies een andere datum.</div>` : `
            ${lunch.length ? `<div class="ds-period">🍽 Lunch</div><div class="ds-slots">${lunch.map(s => `<button class="ds-slot ${state.time===s.time?'ds-sel':''}" onclick="DrieStarReserveer._time('${s.time}')">${s.time}</button>`).join('')}</div>` : ''}
            ${dinner.length ? `<div class="ds-period">🍷 Diner</div><div class="ds-slots">${dinner.map(s => `<button class="ds-slot ${state.time===s.time?'ds-sel':''}" onclick="DrieStarReserveer._time('${s.time}')">${s.time}</button>`).join('')}</div>` : ''}
          `}
        </div>` : ''}
        <div class="ds-divider"></div>
        <button class="ds-btn ds-btn-primary" onclick="DrieStarReserveer._go(1)" ${!state.date||!state.time||closed?'disabled':''}>Volgende →</button>
        <div class="ds-footer"><a href="https://www.rocket-agency.nl" target="_blank">Reserveringssysteem door Rocket Agency</a></div>
      </div>`;
    }

    if (state.step === 1) {
      return `<div class="ds-body">
        <div class="ds-field"><label class="ds-label">Naam *</label><input class="ds-input" id="ds-f-name" type="text" value="${state.name}" placeholder="Uw naam" /></div>
        <div class="ds-field"><label class="ds-label">E-mailadres</label><input class="ds-input" id="ds-f-email" type="email" value="${state.email}" placeholder="Voor de bevestiging" /></div>
        <div class="ds-field"><label class="ds-label">Telefoon</label><input class="ds-input" id="ds-f-phone" type="tel" value="${state.phone}" placeholder="Optioneel" /></div>
        <div class="ds-field"><label class="ds-label">Opmerkingen</label><textarea class="ds-input" id="ds-f-notes" placeholder="Allergieën, speciale wensen…">${state.notes}</textarea></div>
        <div class="ds-divider"></div>
        <div class="ds-btn-row">
          <button class="ds-btn ds-btn-sec" onclick="DrieStarReserveer._go(0)">← Terug</button>
          <button class="ds-btn ds-btn-primary" onclick="DrieStarReserveer._saveAndNext()" style="flex:1">Controleer →</button>
        </div>
        <div class="ds-footer"><a href="https://www.rocket-agency.nl" target="_blank">Reserveringssysteem door Rocket Agency</a></div>
      </div>`;
    }

    if (state.step === 2) {
      return `<div class="ds-body">
        <div class="ds-summary">
          <div class="ds-sum-title">Uw reservering</div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Datum</span><span class="ds-sum-val">${fmtDate(state.date)}</span></div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Tijd</span><span class="ds-sum-val">${state.time}</span></div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Personen</span><span class="ds-sum-val">${state.guests}</span></div>
          <div class="ds-sum-row"><span class="ds-sum-lbl">Naam</span><span class="ds-sum-val">${state.name}</span></div>
          ${state.email ? `<div class="ds-sum-row"><span class="ds-sum-lbl">E-mail</span><span class="ds-sum-val">${state.email}</span></div>` : ''}
          ${state.phone ? `<div class="ds-sum-row"><span class="ds-sum-lbl">Telefoon</span><span class="ds-sum-val">${state.phone}</span></div>` : ''}
          ${state.notes ? `<div class="ds-sum-row"><span class="ds-sum-lbl">Opmerking</span><span class="ds-sum-val">${state.notes}</span></div>` : ''}
        </div>
        ${state.error ? `<div class="ds-error">${state.error}</div>` : ''}
        <div class="ds-btn-row">
          <button class="ds-btn ds-btn-sec" onclick="DrieStarReserveer._go(1)">← Terug</button>
          <button class="ds-btn ds-btn-primary" onclick="DrieStarReserveer._submit()" style="flex:1" ${state.submitting?'disabled':''}>
            ${state.submitting ? 'Even geduld…' : 'Reservering plaatsen'}
          </button>
        </div>
        <p style="font-family:${FONT_UI};font-size:11px;color:${C.muted};text-align:center;margin-top:10px">U ontvangt een bevestiging per e-mail.</p>
        <div class="ds-footer"><a href="https://www.rocket-agency.nl" target="_blank">Reserveringssysteem door Rocket Agency</a></div>
      </div>`;
    }
    return '';
  }

  function headerHTML(closeable = true) {
    return `<div class="ds-modal-header">
      <div class="ds-modal-handle"></div>
      ${closeable ? `<button class="ds-close" onclick="DrieStarReserveer.close()">✕</button>` : ''}
      <div class="ds-modal-title">Tafel reserveren</div>
      <div class="ds-modal-subtitle">Eetcafé De 3 Ster · Otterlo</div>
    </div>`;
  }

  function render() {
    // Popup modal
    const modal = document.getElementById('ds-modal');
    if (modal) {
      modal.innerHTML = headerHTML(true) + stepsHTML() + bodyHTML();
    }
    // Inline widget
    if (state.inlineId) {
      const el = document.getElementById(state.inlineId);
      if (el) {
        el.innerHTML = `<div class="ds-inline-wrap">${headerHTML(false)}${stepsHTML()}${bodyHTML()}</div>`;
      }
    }
  }

  // ── PUBLIC API ──
  window.DrieStarReserveer = {
    open() {
      document.getElementById('ds-overlay').classList.add('ds-open');
      document.body.style.overflow = 'hidden';
    },
    close() {
      document.getElementById('ds-overlay').classList.remove('ds-open');
      document.body.style.overflow = '';
    },
    inline(id) {
      state.inlineId = id;
      render();
    },
    _go(step) { state.step = step; render(); },
    _date(v) { state.date = v; loadSlots(v); },
    _guests(n) { state.guests = n; render(); },
    _time(t) { state.time = t; render(); },
    _field(k, v) { state[k] = v; },
    _submit() { submitReservation(); },
    _saveAndNext() {
      const n = document.getElementById('ds-f-name');
      const e = document.getElementById('ds-f-email');
      const p = document.getElementById('ds-f-phone');
      const nt = document.getElementById('ds-f-notes');
      if (n) state.name = n.value.trim();
      if (e) state.email = e.value.trim();
      if (p) state.phone = p.value.trim();
      if (nt) state.notes = nt.value.trim();
      if (!state.name) {
        if (n) { n.style.borderColor = '#c0392b'; n.focus(); }
        return;
      }
      state.step = 2; render();
    },
    _reset() {
      state = { ...state, step:0, date:'', time:'', guests:2, name:'', email:'', phone:'', notes:'', slots:[], loadingSlots:false, submitting:false, done:false, error:'', dayStatus:null };
      render();
    },
  };

  // ── INIT ──
  function init() {
    injectCSS();

    // Overlay + modal
    const overlay = document.createElement('div');
    overlay.id = 'ds-overlay';
    overlay.className = 'ds-overlay';
    overlay.innerHTML = `<div id="ds-modal" class="ds-modal"></div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) DrieStarReserveer.close(); });
    document.body.appendChild(overlay);

    // Zweefknop
    const btn = document.createElement('button');
    btn.className = 'ds-float';
    btn.innerHTML = `<span class="ds-float-icon">🍽</span> Reserveer een tafel`;
    btn.onclick = () => DrieStarReserveer.open();
    document.body.appendChild(btn);

    loadSettings().then(() => render());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
