/* Example run from a 5-minute video: times are cut-timeline seconds via at(); in your runs prefer wt("word"). */
/* r18 244.40-263.90: who this opens editing up to. Three panels on one wall, the camera moves panel to panel:
   1 "never touched a graph editor": a curve editor greys out, a plain request makes the bounce.
   2 "doesn't know how to build an expression": wiggle(5, 20) gets struck, "shake it gently" replaces it.
   3 "an experienced editor": a day bar of keyframing / masking / resizing / moving shrinks block by block and "Directing"
     takes the freed time. */
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, spark, icon, chars, type, kf } = C;
  let E = {};
  const T = { dir: at(244.48), p1: at(247.44), ge: at(248.2), mg: at(249.46), p2: at(251.26), ex: at(252.2), desc: at(253.84), p3: at(256.12), less: at(258.0),
    kf: at(258.54), mk: at(259.44), rs: at(260.1), mv: at(260.98), dirx: at(262.84) };
  const PX = (i) => 960 + i * 1700;
  function build(stage) {
    const W = abs(stage, 0, 0, 6000, 1080, 'world');
    const ttl = abs(stage, 0, 70, 1920, 70, 'disp'); ttl.style.cssText += 'font-size:52px;text-align:center'; ttl.innerHTML = 'video editing, <i>opened up</i>';
    const pan = [0, 1, 2].map((i) => { const g = abs(W, PX(i) - 760, 190, 1520, 780); return g; });
    // persona chip helper
    const who = (g, txt) => { const c = abs(g, 0, 0, 1520, 70, 'ui'); c.style.cssText += `display:flex;align-items:center;gap:16px;font-size:34px;font-weight:500;color:${col.oat}`; c.innerHTML = `<span style="width:56px;height:56px;border-radius:50%;background:#2A2826;display:flex;align-items:center;justify-content:center;color:${col.coral}">${icon('user', 30, 2)}</span>${txt}`; return c; };
    const w1 = who(pan[0], 'Never touched a graph editor'), w2 = who(pan[1], "Doesn't know After Effects expressions"), w3 = who(pan[2], 'An experienced editor');
    // 1 graph editor -> request -> bounce
    const ge = abs(pan[0], 0, 110, 700, 460, 'card'); ge.innerHTML = `<div class="lbl" style="position:absolute;left:30px;top:24px">GRAPH EDITOR</div><svg width="700" height="460" style="position:absolute"><path d="M60 400 C 260 400 300 90 640 90" fill="none" stroke="${col.mute}" stroke-width="4"/><circle cx="260" cy="400" r="10" fill="${col.ivory}"/><circle cx="300" cy="90" r="10" fill="${col.ivory}"/></svg>`;
    const geX = abs(ge, 0, 0, 700, 460); geX.style.cssText += 'background:rgba(14,13,12,.6);border-radius:24px';
    const rq1 = abs(pan[0], 780, 110, 740, 100, 'card ui'); rq1.style.cssText += `border-radius:50px;display:flex;align-items:center;gap:18px;padding:0 30px;font-size:32px;color:${col.oat}`; rq1.innerHTML = `${spark(32)}<span class="tx"></span>`;
    const r1cs = chars(rq1.querySelector('.tx'), 'Make the logo land with a bounce');
    const stg1 = abs(pan[0], 780, 250, 740, 320, 'card'); const ball = abs(stg1, 330, 0, 90, 90); ball.style.cssText += `border-radius:24px;background:${col.coral}`;
    const floor = abs(stg1, 120, 260, 500, 4); floor.style.background = 'rgba(245,242,234,.15)';
    // 2 expression -> plain words
    const ex = abs(pan[1], 0, 110, 700, 300, 'card'); ex.innerHTML = `<div class="lbl" style="position:absolute;left:30px;top:24px">EXPRESSION</div><div class="mono" style="position:absolute;left:30px;top:110px;font-size:56px;color:${col.coralHi}">wiggle(5, 20)</div>`;
    const exS = abs(ex, 20, 150, 660, 8); exS.style.cssText += `background:${col.coral};transform-origin:0 50%;border-radius:4px`;
    const rq2 = abs(pan[1], 780, 110, 740, 100, 'card ui'); rq2.style.cssText += `border-radius:50px;display:flex;align-items:center;gap:18px;padding:0 30px;font-size:32px;color:${col.oat}`; rq2.innerHTML = `${spark(32)}<span class="tx"></span>`;
    const r2cs = chars(rq2.querySelector('.tx'), 'Shake the title gently, then settle');
    const stg2 = abs(pan[1], 780, 250, 740, 320, 'card'); const tt = abs(stg2, 0, 110, 740, 100, 'disp'); tt.style.cssText += 'font-size:84px;text-align:center'; tt.textContent = 'Breaking';
    // 3 day bar
    const bar = abs(pan[2], 0, 180, 1520, 140); bar.style.cssText += 'border-radius:20px;background:#171615;overflow:hidden;display:flex';
    const segs = [['Keyframing', 330, '#3A332D'], ['Masking', 260, '#33302C'], ['Resizing', 220, '#3A332D'], ['Moving things', 300, '#33302C'], ['Directing', 140, col.coral]].map(([n, w, c]) => {
      const s = h('div', { cls: 'ui', style: { width: w + 'px', height: '140px', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', color: c === col.coral ? '#141413' : col.oat, borderRight: '2px solid #0E0D0C' } }, n);
      bar.appendChild(s); return { s, w }; });
    const bl = abs(pan[2], 0, 120, 600, 40, 'mono'); bl.style.cssText += `font-size:22px;color:${col.mute};letter-spacing:.12em`; bl.textContent = 'A DAY OF EDITING';
    E = { W, ttl, pan, w1, w2, w3, ge, geX, rq1, r1cs, stg1, ball, ex, exS, rq2, r2cs, stg2, tt, bar, segs, bl };
  }
  function render(t) {
    set(E.ttl, enter(t, 0, { dy: -20, blur: 10 }));
    const camX = kf(t, [[0, PX(0)], [T.p2 - 0.4, PX(0)], [T.p2 + 0.3, PX(1), ease.premium], [T.p3 - 0.4, PX(1)], [T.p3 + 0.3, PX(2), ease.premium]]);
    E.W.style.transform = `translateX(${(960 - camX).toFixed(2)}px)`;
    // 1
    set(E.w1, enter(t, T.p1 - 0.3, { dy: 20, blur: 8 })); set(E.ge, enter(t, T.ge - 0.4, { dy: 40, blur: 12 }));
    set(E.geX, { o: p(t, T.mg - 0.3, T.mg) }); set(E.rq1, enter(t, T.mg - 0.2, { dx: 40, dy: 0, blur: 10 })); type(E.r1cs, t, T.mg, 30);
    set(E.stg1, enter(t, T.mg + 0.6, { dy: 30, blur: 10 }));
    const bt = Math.max(0, t - (T.mg + 1.0)); const y = 170 * (1 - Math.min(1, bt * 2.2)) * 0 + (bt < 0.45 ? 170 * (bt / 0.45) ** 2 : 170 - 120 * Math.abs(Math.sin((bt - 0.45) * 6)) * Math.exp(-(bt - 0.45) * 3));
    set(E.ball, { y: t > T.mg + 1.0 ? y : 0, sy: 1 });
    // 2
    set(E.w2, enter(t, T.p2 - 0.2, { dy: 20, blur: 8 })); set(E.ex, enter(t, T.p2, { dy: 40, blur: 12 }));
    const s2 = p(t, T.desc - 0.4, T.desc - 0.1, ease.outExpo); set(E.exS, { sx: Math.max(0.001, s2), sy: 1, r: -8, o: s2 > 0 ? 1 : 0 });
    set(E.rq2, enter(t, T.desc - 0.1, { dx: 40, dy: 0, blur: 10 })); type(E.r2cs, t, T.desc + 0.1, 30);
    set(E.stg2, enter(t, T.desc + 0.6, { dy: 30, blur: 10 }));
    const sh = t > T.desc + 1.1 ? Math.sin((t - T.desc - 1.1) * 40) * 8 * Math.exp(-(t - T.desc - 1.1) * 2.2) : 0; set(E.tt, { x: sh });
    // 3
    set(E.w3, enter(t, T.p3 - 0.2, { dy: 20, blur: 8 })); set(E.bar, enter(t, T.p3 + 0.2, { dy: 40, blur: 12 })); set(E.bl, enter(t, T.p3 + 0.3, { dy: 10, blur: 6 }));
    const shr = [T.kf, T.mk, T.rs, T.mv].map((tt) => sp(t, tt, 0.6));
    const freed = E.segs.slice(0, 4).reduce((a, s, i) => a + s.w * 0.7 * shr[i], 0);
    E.segs.forEach((s, i) => { if (i < 4) { s.s.style.width = (s.w * (1 - 0.7 * shr[i])).toFixed(1) + 'px'; s.s.style.color = `rgba(232,230,220,${(1 - shr[i]).toFixed(2)})`; } else s.s.style.width = (s.w + freed * sp(t, T.dirx - 0.6, 0.8) + freed * 0).toFixed(1) + 'px'; });
  }
  return { build, render };
})();
