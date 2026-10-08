/* Example run from a 5-minute video: times are cut-timeline seconds via at(); in your runs prefer wt("word"). */
/* r09 109.50-120.30: directing, one note at a time. A single preview card answers four notes typed into a chat bar:
   "Speed it up" (the loop doubles, speed chip 1x -> 2x), "Simplify" (eight elements collapse to three), "New easing"
   (the curve bends from linear to eased), "Rethink it" (the card flips into a new art direction). */
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, spark, icon, chars, type, kf } = C;
  let E = {};
  const N = [at(110.4), at(112.9), at(115.9), at(118.3)];    // note typed
  function build(stage) {
    const card = abs(stage, 420, 120, 1080, 640, 'card'); card.style.overflow = 'hidden';
    const dark = abs(card, 0, 0, 1080, 640); dark.style.background = '#1A1918';
    const lite = abs(card, 0, 0, 1080, 640); lite.style.cssText += `background:${col.oat};opacity:0`;
    const ball = abs(card, 0, 0, 90, 90); ball.style.cssText += `border-radius:50%;background:${col.coral}`;
    const track = abs(card, 140, 470, 800, 4); track.style.background = 'rgba(245,242,234,.12)';
    const many = [...Array(8)].map((_, k) => { const e = abs(card, 150 + (k % 4) * 200, 120 + Math.floor(k / 4) * 130, 160, 90); e.style.cssText += `border-radius:16px;background:${['#3A332D', '#5E5952', '#E8E6DC', '#4A3A30'][k % 4]}`; return e; });
    const speed = abs(card, 900, 30, 150, 56, 'chip mono'); speed.style.justifyContent = 'center'; speed.style.fontSize = '26px';
    const sp1 = abs(speed, 0, 0, 150, 56); sp1.style.cssText += 'display:flex;align-items:center;justify-content:center'; sp1.textContent = '1×';
    const sp2 = abs(speed, 0, 0, 150, 56); sp2.style.cssText += `display:flex;align-items:center;justify-content:center;color:${col.coral}`; sp2.textContent = '2×';
    const graph = abs(card, 640, 110, 360, 260); graph.innerHTML = `<svg width="360" height="260"><path id="cv" fill="none" stroke="${col.coral}" stroke-width="5" stroke-linecap="round"/></svg>`;
    // chat bar with the notes
    const bar = abs(stage, 460, 820, 1000, 100, 'card ui'); bar.style.cssText += `border-radius:50px;display:flex;align-items:center;gap:20px;padding:0 36px;font-size:34px;color:${col.oat}`;
    bar.innerHTML = `<span style="color:${col.mute};display:flex">${icon('user', 34, 2)}</span><span class="tx" style="position:relative;flex:1;height:100px"></span>${spark(34)}`;
    const holder = bar.querySelector('.tx');
    const notes = ['Speed it up', 'Simplify it', 'New easing', 'Rethink the visual direction'].map((n) => { const s = abs(holder, 0, 0, 800, 100); s.style.lineHeight = '100px'; return chars(s, n); });
    E = { card, dark, lite, ball, track, many, speed, sp1, sp2, graph, cv: graph.querySelector('#cv'), bar, notes };
  }
  function render(t) {
    set(E.card, enter(t, 0, { dy: 50, s0: 0.96, blur: 14, dur: 0.7 })); set(E.bar, enter(t, 0.2, { dy: 40, blur: 10 }));
    // notes type, each replaced by the next
    E.notes.forEach((cs, i) => { const vis = t >= N[i] - 0.3 && (i === 3 || t < N[i + 1] - 0.35); cs.forEach((c) => (c.parentElement.style.display = vis ? 'block' : 'none')); type(cs, t, N[i] - 0.3, 30); });
    // ball loops along the track: period halves after "speed it up"
    const k2 = p(t, N[0] + 0.5, N[0] + 0.9);
    const phase = t < N[0] + 0.5 ? t / 1.6 : (N[0] + 0.5) / 1.6 + (t - N[0] - 0.5) / (1.6 - 0.8 * k2);
    const u = phase % 1, tri = u < 0.5 ? u * 2 : 2 - u * 2;
    // easing note: linear -> eased motion of the ball
    const eNote = p(t, N[2] + 0.5, N[2] + 1.0); const eased = MK.ease.inOutCubic(tri) * eNote + tri * (1 - eNote);
    set(E.ball, { x: 140 + 710 * eased, y: 425, o: 1 });
    set(E.sp1, { o: 1 - k2, y: -20 * k2 }); set(E.sp2, { o: k2, y: 20 * (1 - k2) });
    // simplify: 8 tiles collapse into 3 (5 fly out, 3 regroup)
    const s = sp(t, N[1] + 0.5, 0.7);
    E.many.forEach((m, k) => { const keep = k === 0 || k === 2 || k === 5; const tx = keep ? [0, 0, 120][[0, 2, 5].indexOf(k)] : 0;
      set(m, { o: keep ? 1 : 1 - s, s: keep ? 1 : 1 - 0.5 * s, blur: keep ? 0 : 10 * s, x: keep ? [100, -100, 50][[0, 2, 5].indexOf(k)] * s : 0, y: keep ? [40, 40, -90][[0, 2, 5].indexOf(k)] * s : 0 }); });
    // curve: linear -> ease
    const e3 = sp(t, N[2] + 0.4, 0.7);
    E.cv.setAttribute('d', `M20 240 C ${(20 + 110 * e3).toFixed(1)} ${(240 - 0).toFixed(1)} ${(340 - 110 * e3).toFixed(1)} 20 340 20`);
    set(E.graph, enter(t, N[2] - 0.1, { dy: 20, blur: 8 }));
    // rethink: the card flips to a light art direction
    const f = p(t, N[3] + 0.5, N[3] + 1.2, ease.inOutCubic);
    set(E.card, { ...enter(t, 0, { dy: 50, s0: 0.96, blur: 14, dur: 0.7 }), ry: 180 * f > 90 ? 180 * f - 180 : 180 * f });
    set(E.lite, { o: f > 0.5 ? 1 : 0 });
    E.many.forEach((m) => { m.style.outline = f > 0.5 ? '2px solid #141413' : 'none'; });
  }
  return { build, render };
})();
