/* motion-kit: seek-safe motion primitives for HyperFrames.
 *
 * Every function here is a pure function of time. Nothing keeps state between
 * frames, so any frame can be seeked in any order (HyperFrames' contract).
 * Drive a whole scene from one GSAP proxy tween:
 *
 *   MK.drive(tl, duration, (t) => render(t));
 *
 * Every helper is a pure function of t, so renders can seek to any frame.
 */
(function () {
  const MK = {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  MK.clamp = clamp;
  MK.lerp = lerp;

  /* ---------------------------------------------------------------- driver */

  // One proxy tween spanning the composition. onUpdate reads tl.time(), so a
  // seek to any time renders exactly that time.
  MK.drive = function (tl, duration, render) {
    const proxy = { p: 0 };
    tl.to(proxy, {
      p: 1,
      duration,
      ease: "none",
      onUpdate: () => render(tl.time()),
    }, 0);
    render(0);
  };

  /* ----------------------------------------------------------------- eases */

  MK.ease = {
    linear: (p) => p,
    inCubic: (p) => p * p * p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    inOutExpo: (p) =>
      p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
  };

  // CSS-style cubic-bezier solver. MK.ease.premium is the Taxtello curve.
  MK.bezier = function (x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(clamp(t));
    };
  };
  MK.ease.premium = MK.bezier(0.16, 1, 0.3, 1);

  // Tween p from 0 to 1 between t0 and t1 with an ease.
  MK.prog = function (t, t0, t1, ease = MK.ease.inOutCubic) {
    if (t1 <= t0) return t >= t1 ? 1 : 0;
    return ease(clamp((t - t0) / (t1 - t0)));
  };

  // Keyframe table: kf(t, [[t0, v0], [t1, v1, ease], ...]). The ease on a key
  // shapes the segment arriving at it. Values may be numbers or arrays.
  MK.kf = function (t, keys, defEase = MK.ease.inOutCubic) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      if (t <= t1) {
        const [t0, v0] = keys[i - 1];
        const p = (e || defEase)(clamp((t - t0) / (t1 - t0)));
        return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], p)) : lerp(v0, v1, p);
      }
    }
    return keys[keys.length - 1][1];
  };

  /* --------------------------------------------------------------- springs */

  // Closed-form spring step response: 0 at dt<=0, settles to 1.
  // dur ~ settle time in seconds; bounce 0 = critically damped, 0.1 = ~2% overshoot.
  MK.spring = function (dt, dur = 0.5, bounce = 0) {
    if (dt <= 0) return 0;
    const w = (2 * Math.PI) / dur * 1.15;
    const z = 1 - clamp(bounce, 0, 0.95);
    if (z >= 0.999) return 1 - (1 + w * dt) * Math.exp(-w * dt);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
  };

  // A value that changes target many times = initial + sum of one spring per
  // change. changes: [[t, target, {dur, bounce}?], ...] sorted by t.
  MK.springTrack = function (t, initial, changes, defs = {}) {
    let v = initial, prev = initial;
    for (const [tc, target, o] of changes) {
      if (t <= tc) break;
      const opt = Object.assign({ dur: 0.5, bounce: 0 }, defs, o || {});
      v += (target - prev) * MK.spring(t - tc, opt.dur, opt.bounce);
      prev = target;
    }
    return v;
  };

  // Numeric derivative of any pure function of time (px per second).
  MK.vel = function (fn, t, h = 1 / 240) {
    return (fn(t + h) - fn(t - h)) / (2 * h);
  };

  // Two-edge indicator: leading edge on a fast spring, trailing edge on a slow
  // one, so the pill stretches toward the target then catches up.
  // stops: [[t, left, right], ...] (first entry is the resting state at its t).
  MK.twoEdge = function (t, stops, o = {}) {
    const fast = { dur: o.fast || 0.32, bounce: o.bounce || 0 };
    const slow = { dur: o.slow || 0.62, bounce: o.bounce || 0 };
    let L = stops[0][1], R = stops[0][2], pL = L, pR = R;
    for (let i = 1; i < stops.length; i++) {
      const [tc, l, r] = stops[i];
      if (t <= tc) break;
      const right = l >= pL; // moving right: right edge leads
      const eR = right ? fast : slow, eL = right ? slow : fast;
      L += (l - pL) * MK.spring(t - tc, eL.dur, eL.bounce);
      R += (r - pR) * MK.spring(t - tc, eR.dur, eR.bounce);
      pL = l; pR = r;
    }
    return { left: L, right: R, width: R - L, center: (L + R) / 2 };
  };

  // Exponential approach used by @notdwd: covers `rate` of the remaining
  // distance per frame at `fps`, so shots enter already moving.
  MK.approach = function (t, t0, from, to, rate = 0.15, fps = 60) {
    if (t <= t0) return from;
    return to + (from - to) * Math.pow(1 - rate, (t - t0) * fps);
  };

  /* -------------------------------------------------------------- blur fx */

  // Directional motion blur via an SVG feGaussianBlur with separate x/y
  // deviations. Create once per element, then call .set(vx, vy) every frame
  // with velocities in px/s. k converts px/s to blur px; cap limits it.
  let fxSvg = null;
  function defs() {
    if (!fxSvg) {
      fxSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      fxSvg.setAttribute("width", "0");
      fxSvg.setAttribute("height", "0");
      fxSvg.style.position = "absolute";
      fxSvg.innerHTML = "<defs></defs>";
      document.body.appendChild(fxSvg);
    }
    return fxSvg.querySelector("defs");
  }
  MK.svgDefs = defs;

  MK.motionBlur = function (el, id, o = {}) {
    const k = o.k ?? 0.004, cap = o.cap ?? 18, floor = o.floor ?? 0.25;
    const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    f.setAttribute("id", id);
    f.setAttribute("x", "-50%"); f.setAttribute("y", "-50%");
    f.setAttribute("width", "200%"); f.setAttribute("height", "200%");
    f.innerHTML = '<feGaussianBlur stdDeviation="0 0"/>';
    defs().appendChild(f);
    const g = f.firstChild;
    return {
      set(vx, vy) {
        const bx = Math.min(cap, Math.abs(vx) * k), by = Math.min(cap, Math.abs(vy) * k);
        if (bx < floor && by < floor) { el.style.filter = ""; return; }
        g.setAttribute("stdDeviation", `${bx.toFixed(2)} ${by.toFixed(2)}`);
        el.style.filter = `url(#${id})`;
      },
    };
  };

  // Goo: blur + alpha threshold, then the sharp source composited on top so
  // the inside stays crisp. Apply filter:url(#id) to the container of blobs.
  MK.gooFilter = function (id, blur = 14) {
    const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    f.setAttribute("id", id);
    f.setAttribute("x", "-20%"); f.setAttribute("y", "-20%");
    f.setAttribute("width", "140%"); f.setAttribute("height", "140%");
    f.innerHTML =
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="b"/>` +
      `<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12" result="goo"/>` +
      `<feComposite in="SourceGraphic" in2="goo" operator="atop"/>`;
    defs().appendChild(f);
  };

  /* ---------------------------------------------------------------- cursor */

  const ARROW =
    '<svg viewBox="0 0 32 40" width="32" height="40" style="display:block;overflow:visible">' +
    '<path d="M3 2 L3 31 L10.4 24.4 L15.2 35.6 L20.4 33.4 L15.6 22.4 L25.6 22.4 Z" ' +
    'fill="#0b0b0c" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>';

  // macOS arrow cursor. Path = springTrack on x and y from waypoints, so it
  // glides and decelerates. clicks: [t, ...] press dips. hovers: [[t0,t1], ...]
  // grow windows. Returns { pos(t), render(t) }.
  MK.cursor = function (parent, o) {
    const el = document.createElement("div");
    el.className = "mk-cursor";
    el.style.cssText =
      "position:absolute;left:0;top:0;width:32px;height:40px;transform-origin:3px 2px;" +
      "filter:drop-shadow(0 6px 10px rgba(0,0,0,.22));z-index:100;will-change:auto";
    el.innerHTML = ARROW;
    parent.appendChild(el);
    const S = o.scale || 1.6;
    const way = o.path; // [[t, x, y, {dur,bounce}?], ...]
    const xs = way.slice(1).map((w) => [w[0], w[1], w[3]]);
    const ys = way.slice(1).map((w) => [w[0], w[2], w[3]]);
    const defs = { dur: o.glide || 0.55, bounce: 0 };
    const pos = (t) => ({
      x: MK.springTrack(t, way[0][1], xs, defs),
      y: MK.springTrack(t, way[0][2], ys, defs),
    });
    const press = (t) => {
      let s = 0;
      for (const c of o.clicks || []) {
        const d = t - c;
        if (d > -0.06 && d < 0.22) s = Math.max(s, d < 0 ? (d + 0.06) / 0.06 : 1 - MK.spring(d, 0.22));
      }
      // held presses (drags): down 0.06s before t0, released on a spring after t1
      for (const [a, b] of o.holds || []) {
        if (t > a - 0.06 && t <= b) s = Math.max(s, clamp((t - a + 0.06) / 0.06));
        else if (t > b && t < b + 0.3) s = Math.max(s, 1 - MK.spring(t - b, 0.22));
      }
      return s; // 0..1
    };
    const hover = (t) => {
      let h = 0;
      for (const [a, b] of o.hovers || [])
        h = Math.max(h, MK.prog(t, a, a + 0.18, MK.ease.outCubic) * (1 - MK.prog(t, b, b + 0.2, MK.ease.inOutCubic)));
      return h;
    };
    const vis = (t) => {
      if (!o.visible) return 1;
      return MK.kf(t, o.visible);
    };
    return {
      el, pos, press,
      render(t, cam) {
        const p = pos(t);
        const vx = MK.vel((u) => pos(u).x, t);
        // lean slightly into horizontal travel
        const rot = clamp(vx / 4000, -1, 1) * -12;
        let sc = S * (1 + 0.28 * hover(t)) * (1 - 0.15 * press(t));
        let x = p.x, y = p.y;
        if (cam) { x = cam.x(x); y = cam.y(y); sc *= cam.s; }
        el.style.transform = `translate(${x - 3}px,${y - 2}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        el.style.opacity = vis(t);
      },
    };
  };

  /* ---------------------------------------------------------------- camera */

  // Camera over one world layer. Track focus x/y and log-scale so zooms feel
  // even. keys: [[t, fx, fy, scale, ease?], ...]. W/H = stage size.
  MK.camera = function (keys, W, H) {
    const at = (t) => {
      const fx = MK.kf(t, keys.map((k) => [k[0], k[1], k[4]]));
      const fy = MK.kf(t, keys.map((k) => [k[0], k[2], k[4]]));
      const ls = MK.kf(t, keys.map((k) => [k[0], Math.log(k[3]), k[4]]));
      const s = Math.exp(ls);
      return {
        fx, fy, s,
        css: `translate(${W / 2}px,${H / 2}px) scale(${s}) translate(${-fx}px,${-fy}px)`,
        x: (wx) => W / 2 + (wx - fx) * s,
        y: (wy) => H / 2 + (wy - fy) * s,
      };
    };
    return at;
  };

  /* ---------------------------------------------------------------- flood */

  // A shape that grows from a rect to a circle that overscales past every
  // corner (and back). p = 0 -> rect, p = 1 -> full flood.
  // The radius is solved so the ON-SCREEN coverage follows p. A plain radius
  // (or even area) ease dumps most of the visible change into 2-3 frames once
  // the circle meets the frame edges, which QA flags as pops.
  // Pass an eased p (inOutSine-like, max slope ~1.6) over 0.35-0.5 s.
  const GX = 64, GY = 36;
  function coverage(cx, cy, r, W, H) {
    let n = 0;
    const r2 = r * r;
    for (let j = 0; j < GY; j++) {
      const y = ((j + 0.5) / GY) * H - cy;
      for (let i = 0; i < GX; i++) {
        const x = ((i + 0.5) / GX) * W - cx;
        if (x * x + y * y <= r2) n++;
      }
    }
    return n / (GX * GY);
  }
  MK.floodBox = function (p, rect, W, H) {
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    const far = Math.max(
      Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)
    );
    const r0 = Math.max(rect.w, rect.h) / 2;
    const c0 = coverage(cx, cy, r0, W, H);
    const target = lerp(c0, 1, clamp(p));
    let lo = r0, hi = far;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      if (coverage(cx, cy, mid, W, H) < target) lo = mid; else hi = mid;
    }
    // overscale past the corners over the last 15% so the edge never parks on a corner
    const r = p >= 1 ? far * 1.12 : hi * (1 + 0.12 * MK.prog(p, 0.85, 1));
    const d = 2 * r;
    const q = Math.min(1, p * 4); // rect -> circle shape morph happens early, while small
    const w = lerp(rect.w, d, q), h = lerp(rect.h, d, q);
    const rad = lerp(rect.r, d / 2, Math.min(1, q * 1.5));
    return { x: cx - w / 2, y: cy - h / 2, w, h, r: rad };
  };

  MK.setBox = function (el, b) {
    el.style.left = b.x + "px";
    el.style.top = b.y + "px";
    el.style.width = b.w + "px";
    el.style.height = b.h + "px";
    el.style.borderRadius = b.r + "px";
  };

  const mixHex = (a, b, p) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (v, sh) => (v >> sh) & 255;
    const m = (sh) => Math.round(lerp(ch(pa, sh), ch(pb, sh), p));
    return "#" + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
  };
  MK.mixHex = mixHex;

  /* ----------------------------------------------------------------- iris */

  // Six-blade iris drawn into an SVG. open = 0 closed, 1 fully open.
  // Each blade is the quadrant beyond one edge of a rotating hexagon
  // aperture, so blades overlap like a real shutter.
  MK.iris = function (svg, o = {}) {
    const n = o.blades || 6, W = o.W, H = o.H;
    const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
    const R = Math.hypot(W, H) * 0.62;
    const BIG = Math.hypot(W, H) * 3;
    // fill may be one color or a list cycled per blade (alternating shades read as a shutter)
    const fills = [].concat(o.fill || "#0b0b0c"), seam = o.seam || "rgba(255,255,255,.14)";
    svg.innerHTML = "";
    const blades = [];
    for (let i = 0; i < n; i++) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("fill", fills[i % fills.length]);
      const s = document.createElementNS("http://www.w3.org/2000/svg", "path");
      s.setAttribute("stroke", seam);
      s.setAttribute("stroke-width", o.seamWidth || 2.5);
      s.setAttribute("fill", "none");
      g.appendChild(p); g.appendChild(s);
      svg.appendChild(g);
      blades.push([p, s]);
    }
    return {
      render(open) {
        const a = Math.max(0.0001, open) * R; // aperture circumradius
        const rot = (1 - open) * (Math.PI / 3) * 1.1 + (o.rot || 0);
        const v = [];
        for (let i = 0; i < n; i++) {
          const th = rot + (i * 2 * Math.PI) / n;
          v.push([cx + a * Math.cos(th), cy + a * Math.sin(th)]);
        }
        svg.style.display = open >= 0.999 ? "none" : "";
        const seamA = clamp(open * 6);
        for (let i = 0; i < n; i++) {
          const A = v[i], B = v[(i + 1) % n];
          let dx = B[0] - A[0], dy = B[1] - A[1];
          const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
          const nx = dy, ny = -dx; // outward normal for this winding
          const P1 = [A[0] + dx * BIG, A[1] + dy * BIG];
          const P2 = [P1[0] + nx * BIG, P1[1] + ny * BIG];
          const P3 = [A[0] + nx * BIG, A[1] + ny * BIG];
          const f = (q) => q[0].toFixed(1) + " " + q[1].toFixed(1);
          blades[i][0].setAttribute("d", `M${f(A)} L${f(P1)} L${f(P2)} L${f(P3)} Z`);
          blades[i][1].setAttribute("d", `M${f(A)} L${f(P1)}`);
          blades[i][1].setAttribute("stroke-opacity", seamA.toFixed(3));
          // shade differences fade in with the seams so a closed iris matches a flat flood
          blades[i][0].setAttribute("fill", mixHex(fills[0], fills[i % fills.length], seamA));
        }
      },
    };
  };

  /* ---------------------------------------------------------- liquid glass */

  // Rounded-rect distance-field displacement map (R = x shift, G = y shift,
  // 128 = none). Generated once on a canvas, deterministic.
  MK.glassMap = function (w, h, radius, bezel) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(w, h);
    const hx = w / 2, hy = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hx, py = y + 0.5 - hy;
        // signed distance to rounded rect (negative inside)
        const qx = Math.abs(px) - (hx - radius), qy = Math.abs(py) - (hy - radius);
        const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        const sd = out + Math.min(Math.max(qx, qy), 0) - radius;
        const depth = clamp(-sd / bezel); // 0 at rim, 1 past the bezel
        // refraction strongest at the rim, pointing inward
        const k = Math.pow(1 - depth, 2.2);
        // gradient direction ~ outward normal
        let gx = px / (hx || 1), gy = py / (hy || 1);
        if (qx > 0 || qy > 0) { gx = Math.max(qx, 0) * Math.sign(px); gy = Math.max(qy, 0) * Math.sign(py); }
        const gl = Math.hypot(gx, gy) || 1;
        const i = (y * w + x) * 4;
        img.data[i] = 128 - (gx / gl) * k * 127;
        img.data[i + 1] = 128 - (gy / gl) * k * 127;
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  };

  // Chromatic liquid-glass filter: three displacement passes at slightly
  // different scales, one per channel, recombined. Apply to an element that
  // holds its own clone of the scene behind it (backdrop-filter:url() misreads
  // displacement maps in Chromium, so we never use it).
  MK.glassFilter = function (id, w, h, radius, o = {}) {
    const map = MK.glassMap(w, h, radius, o.bezel || Math.min(w, h) * 0.22);
    const s = o.scale || 70;
    const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    f.setAttribute("id", id);
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("primitiveUnits", "userSpaceOnUse");
    f.setAttribute("x", "0"); f.setAttribute("y", "0");
    f.setAttribute("width", w); f.setAttribute("height", h);
    f.setAttribute("color-interpolation-filters", "sRGB");
    const ch = (name, sc, m) =>
      `<feDisplacementMap in="SourceGraphic" in2="map" scale="${sc}" xChannelSelector="R" yChannelSelector="G" result="d${name}"/>` +
      `<feColorMatrix in="d${name}" type="matrix" values="${m}" result="c${name}"/>`;
    f.innerHTML =
      `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
      ch("r", s * 1.0, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0") +
      ch("g", s * 0.93, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0") +
      ch("b", s * 0.86, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0") +
      `<feBlend in="cr" in2="cg" mode="screen" result="rg"/>` +
      `<feBlend in="rg" in2="cb" mode="screen"/>`;
    defs().appendChild(f);
  };

  /* ------------------------------------------------------------ utilities */

  // Deterministic hash noise (no Math.random).
  MK.hash = function (n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  // Typewriter: number of chars visible at t, ~cps chars/s with a one-frame
  // hold every few chars (from @notdwd).
  MK.typed = function (t, t0, text, cps = 30) {
    if (t <= t0) return "";
    const raw = (t - t0) * cps;
    const n = Math.floor(raw - Math.floor(raw / 3) * 0.34);
    return text.slice(0, clamp(n, 0, text.length));
  };

  window.MK = MK;
})();
