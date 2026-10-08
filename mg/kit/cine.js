/* cine.js: shared building blocks for the Opus 5.5 cinematic MG (on top of motion-kit.js).
 * Every style is a pure function of t (seek-safe). Each run defines window.RUN = {dur, build(stage), render(t)}.
 * Look: warm-black film stage, ivory type, one coral accent, Fraunces display + Geist UI + Geist Mono.
 */
(function () {
  const C = {};
  const MK = window.MK;
  C.col = { bg: '#0E0D0C', slate: '#1F1E1D', slate2: '#2A2826', line: 'rgba(245,242,234,.10)', ivory: '#F5F2EA',
            mute: '#8B857B', dim: '#5E5952', coral: '#D97757', coralHi: '#E8916F', oat: '#E8E6DC' };
  const clamp = MK.clamp, lerp = MK.lerp;
  C.clamp = clamp; C.lerp = lerp;

  /* ------------------------------------------------------------ DOM helpers */
  C.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'style') Object.assign(el.style, v);
      else if (k === 'cls') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    return el;
  };
  C.abs = function (parent, x, y, w, h, cls = '', html = '') {
    const el = C.h('div', { cls: 'a ' + cls, html });
    Object.assign(el.style, { left: x + 'px', top: y + 'px' });
    if (w != null) el.style.width = w + 'px';
    if (h != null) el.style.height = h + 'px';
    parent.appendChild(el);
    return el;
  };
  // transform/opacity/blur setter; blur only when > 0.05 (keeps fast capture when still)
  C.set = function (el, o) {
    if (!el) return;
    const x = o.x || 0, y = o.y || 0, s = o.s == null ? 1 : o.s, r = o.r || 0;
    const sx = o.sx == null ? s : o.sx, sy = o.sy == null ? s : o.sy;
    let tf = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    if (o.rx || o.ry) tf = `perspective(1600px) ${tf} rotateX(${(o.rx || 0).toFixed(2)}deg) rotateY(${(o.ry || 0).toFixed(2)}deg)`;
    if (r) tf += ` rotate(${r.toFixed(2)}deg)`;
    if (sx !== 1 || sy !== 1) tf += ` scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    el.style.transform = tf;
    if (o.o != null) el.style.opacity = clamp(o.o).toFixed(3);
    const b = o.blur || 0;
    el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    if (o.clip != null) el.style.clipPath = o.clip;
  };

  /* --------------------------------------------------------------- motion */
  // Entrance: spring in from an offset with a blur that follows speed (closed form, pure).
  // returns {o, x, y, s, blur} to merge into C.set
  C.enter = function (t, t0, o = {}) {
    const dur = o.dur || 0.7, dx = o.dx || 0, dy = o.dy == null ? 40 : o.dy, s0 = o.s0 == null ? 0.96 : o.s0, b0 = o.blur == null ? 16 : o.blur;
    if (t < t0) return { o: 0, x: dx, y: dy, s: s0, blur: b0 };
    const p = MK.spring(t - t0, dur, o.bounce || 0);
    const fade = clamp((t - t0) / (dur * 0.35));
    return { o: fade, x: dx * (1 - p), y: dy * (1 - p), s: s0 + (1 - s0) * p, blur: b0 * Math.pow(1 - p, 2) };
  };
  // Exit: accelerate away with blur (never a slow fade)
  C.exit = function (t, t0, o = {}) {
    const dur = o.dur || 0.35, dx = o.dx || 0, dy = o.dy == null ? -30 : o.dy;
    if (t < t0) return { o: 1, x: 0, y: 0, blur: 0 };
    const p = MK.ease.inCubic(clamp((t - t0) / dur));
    return { o: 1 - p, x: dx * p, y: dy * p, blur: 14 * p, s: 1 - 0.03 * p };
  };
  // combine enter + exit
  C.life = function (t, t0, t1, o = {}) {
    const a = C.enter(t, t0, o), b = t1 == null ? { o: 1, x: 0, y: 0, blur: 0 } : C.exit(t, t1, o.out || {});
    return { o: a.o * b.o, x: (a.x || 0) + (b.x || 0), y: (a.y || 0) + (b.y || 0), s: (a.s == null ? 1 : a.s) * (b.s == null ? 1 : b.s), blur: (a.blur || 0) + (b.blur || 0) };
  };
  C.p = MK.prog; C.kf = MK.kf; C.ease = MK.ease; C.spring = MK.spring;
  C.sp = (t, t0, dur = 0.6, bounce = 0) => (t < t0 ? 0 : MK.spring(t - t0, dur, bounce));

  /* ------------------------------------------------------------ typography */
  // split text into word spans (kinetic type); returns array of spans
  C.words = function (parent, text, cls = '') {
    parent.innerHTML = '';
    return text.split(' ').map((w, i, arr) => {
      const s = C.h('span', { cls: 'kw ' + cls }, w);
      parent.appendChild(s);
      if (i < arr.length - 1) parent.appendChild(document.createTextNode(' '));
      return s;
    });
  };
  C.chars = function (parent, text, cls = '') {
    parent.innerHTML = '';
    return [...text].map((ch) => { const s = C.h('span', { cls: 'kc ' + cls }, ch === ' ' ? ' ' : ch); parent.appendChild(s); return s; });
  };
  // typewriter reveal on char spans (opacity only, seek-safe)
  C.type = function (spans, t, t0, cps = 26) {
    const n = Math.floor(Math.max(0, t - t0) * cps);
    spans.forEach((s, i) => { s.style.opacity = i < n ? 1 : 0; });
    return Math.min(n, spans.length);
  };

  /* ---------------------------------------------------------------- parts */
  C.spark = function (size = 80, color = C.col.coral) {   // Claude asterisk
    return `<svg viewBox="0 0 100 100" style="width:${size}px;height:${size}px;display:block"><g fill="${color}">` +
      [0, 30, 60, 90, 120, 150].map((a) => `<rect x="46" y="6" width="8" height="88" rx="4" transform="rotate(${a} 50 50)"/>`).join('') + '</g></svg>';
  };
  C.win = function (parent, x, y, w, h, title = '', o = {}) {
    const el = C.abs(parent, x, y, w, h, 'win' + (o.light ? ' light' : ''));
    el.innerHTML = `<div class="wbar"><i></i><i></i><i></i><span>${title}</span></div><div class="wbody"></div>`;
    el.body = el.querySelector('.wbody');
    return el;
  };
  // code editor content: lines = [[indent, html], ...]
  C.code = function (parent, lines) {
    const box = C.h('div', { cls: 'code' });
    const rows = lines.map(([ind, html], i) => {
      const r = C.h('div', { cls: 'cl', html: `<b>${String(i + 1).padStart(2, ' ')}</b><span style="padding-left:${ind * 22}px">${html}</span>` });
      box.appendChild(r); return r;
    });
    parent.appendChild(box);
    return rows;
  };
  C.icon = function (name, s = 48, sw = 1.8, col = 'currentColor') {
    const P = C.ICONS[name];
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P}</svg>`;
  };
  C.ICONS = {
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    sparkles: '<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8-5.8-1.9 5.8-1.9z"/>',
    wave: '<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    play: '<path d="M6 3l14 9-14 9V3z" fill="currentColor"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    split: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-6"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    diamond: '<path d="M12 2 22 12 12 22 2 12Z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.7-6L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.7 6L3 16M3 21v-5h5"/>',
  };

  /* --------------------------------------------------------- waveform svg */
  C.wave = function (w, h, n, seed = 1, col = C.col.mute) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.37 + seed) * Math.cos(i * 0.11 + seed * 2)) * (0.5 + MK.hash(i + seed * 97) * 0.5);
      const x = (i + 0.5) * (w / n), bh = Math.max(2, a * h);
      d += `<rect x="${(x - w / n * 0.3).toFixed(1)}" y="${((h - bh) / 2).toFixed(1)}" width="${(w / n * 0.6).toFixed(1)}" height="${bh.toFixed(1)}" rx="1"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" style="width:${w}px;height:${h}px;display:block"><g fill="${col}">${d}</g></svg>`;
  };

  /* --------------------------------------------------------------- boot */
  C.boot = function () {
    const R = window.RUN; R.dur = R.dur || window.DUR;
    const stage = document.getElementById('stage');
    R.build(stage);
    const tl = gsap.timeline({ paused: true });
    MK.drive(tl, R.dur, (t) => R.render(t));
    window.__timelines = window.__timelines || {};
    window.__timelines['root'] = tl;
  };
  window.C = C;
})();
