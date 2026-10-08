/* From the 30 s demo in docs/ (made with this skill); media paths point at clips cut from that project. */
/* r01 3.71-12.30 (ff): "The cuts, captions, transitions, motion graphics, visual effects, and even the graphics you're
   looking at right now were created through code with AI."
   CONCEPT: a program monitor plays this very shot while its timeline builds under it; each edit he names happens to the
   live picture on its word (the clip gets sliced and closes up, his own words caption it, a wipe crosses it, a lower
   third springs in, a grade splits it). On "right now" the camera pulls back: the whole editor is a window called
   r01.html, which flips over on "code" to the code that is drawing it, and the spark wakes up on "AI". */
/*MEDIA[{"id":"th","src":"assets/media/th_r01.mp4","x":0,"y":0,"w":1040,"h":585,"start":0},
        {"id":"raw","src":"assets/media/th_r01.mp4","x":0,"y":0,"w":1040,"h":585,"start":0}]MEDIA*/
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, icon, chars, type, kf, spark } = C;
  let E = {};
  const T = { cuts: wt('cuts,'), caps: wt('captions,'), trans: wt('transitions,'), mg: wt('motion'), vfx: wt('visual'),
    and: wt('And'), right: wt('right'), were: wt('were'), code: wt('code'), ai: wt('AI.') };
  const MX = 440, MY = 80, MW = 1040, MH = 585, TX = 520, TW = 960, TY = 712;
  function build(stage) {
    const F = abs(stage, 0, 0, 1920, 1080); F.style.transformOrigin = '960px 540px';             // front face: the editor
    const frame = abs(F, 40, 30, 1840, 1020, 'win'); frame.innerHTML = `<div class="wbar"><i></i><i></i><i></i><span>r01.html</span></div>`;
    frame.style.background = '#121110';
    const mon = abs(F, MX, MY, MW, MH); mon.style.cssText += 'border-radius:18px;overflow:hidden;background:#000;box-shadow:0 0 0 1px rgba(245,242,234,.12),0 30px 90px rgba(0,0,0,.6)';
    const vw = document.getElementById('vw_th'), rw = document.getElementById('vw_raw');
    [vw, rw].forEach((v) => { mon.appendChild(v); Object.assign(v.style, { left: 0, top: 0, width: MW + 'px', height: MH + 'px', opacity: 1 }); });
    rw.style.filter = 'saturate(.15) brightness(.78) contrast(.9)';                               // the "before" side of the grade split
    const split = abs(mon, 0, 0, 3, MH); split.style.background = col.ivory;
    const wipe = abs(mon, 0, 0, MW, MH); wipe.style.background = col.coral;
    const cap = abs(mon, 0, MH - 92, MW, 60); cap.style.cssText += 'display:flex;justify-content:center';
    const capIn = h('div', { cls: 'ui', style: { padding: '10px 22px', borderRadius: '14px', background: 'rgba(10,10,10,.66)', fontSize: '30px', fontWeight: 600, color: '#fff', display: 'flex', gap: '10px' } });
    const cw = ['captions,', 'transitions,', 'motion', 'graphics,'].map((w) => { const s = h('span', {}, w); capIn.appendChild(s); return s; }); cap.appendChild(capIn);
    const lt = abs(mon, 40, 40, 420, 96); lt.style.cssText += `display:flex;align-items:center;gap:18px;padding:0 24px;border-radius:16px;background:rgba(14,13,12,.82);box-shadow:inset 3px 0 0 ${col.coral}`;
    lt.innerHTML = `${spark(40)}<div><div class="ui" style="font-size:28px;font-weight:600">Griffin Wooldridge</div><div class="ui" style="font-size:20px;color:${col.mute}">edited with Opus 5.5</div></div>`;
    // timeline: four tracks, each appears on its word; icon heads on the left
    const tracks = [['film', 0], ['text', T.caps], ['sparkles', T.mg], ['eye', T.vfx]].map(([ic, t0], i) => {
      const row = abs(F, MX, TY + i * 66, MW, 56); const hd = abs(row, 0, 0, 56, 56); hd.style.cssText += `display:flex;align-items:center;justify-content:center;color:${col.mute}`; hd.innerHTML = icon(ic, 30, 2);
      const tr = abs(row, 80, 0, TW, 56, 'track'); return { row, hd, tr, t0 };
    });
    // video clip in three pieces: the middle one is the flub that gets cut out
    const pcs = [[0, 360], [360, 120], [480, 480]].map(([x, w], i) => { const c = abs(tracks[0].tr, x, 6, w, 44); c.style.cssText += `border-radius:9px;background:${i === 1 ? '#5A4A40' : '#3A332D'};box-shadow:inset 0 0 0 1px rgba(245,242,234,.10)`; return { c, x, w }; });
    const blade = abs(tracks[0].tr, 360, -14, 3, 84); blade.style.background = col.coral;
    const blade2 = abs(tracks[0].tr, 480, -14, 3, 84); blade2.style.background = col.coral;
    const dia = abs(tracks[0].tr, 351, 16, 24, 24); dia.innerHTML = icon('diamond', 24, 0, 'none'); dia.style.cssText += `background:${col.coral};transform-origin:50% 50%;border-radius:4px`;
    const capClips = [0, 1, 2, 3].map((k) => { const c = abs(tracks[1].tr, 40 + k * 190, 10, 170, 36); c.style.cssText += 'border-radius:8px;background:#2E2B28'; return c; });
    const mgClip = abs(tracks[2].tr, 40, 8, 300, 40); mgClip.style.cssText += `border-radius:9px;background:${col.coral}`;
    const fxClip = abs(tracks[3].tr, 0, 14, TW, 28); fxClip.style.cssText += 'border-radius:8px;background:rgba(245,242,234,.18)';
    const ph = abs(F, TX + 80, TY - 12, 2, 4 * 66); ph.style.background = col.ivory;
    // back face: the code drawing all of this
    const B = abs(stage, 210, 150, 1500, 780, 'win'); B.innerHTML = `<div class="wbar"><i></i><i></i><i></i><span>r01.js</span><span id="bsp" style="margin-left:auto;display:flex"></span></div><div class="wbody"></div>`;
    B.style.background = '#121110'; B.querySelector('#bsp').innerHTML = spark(30);
    const lines = [[0, '<span class="c">// the picture you just watched, as code</span>'], [0, '<span class="k">function</span> <span class="n">render</span>(t) {'],
      [1, '<span class="k">const</span> k = p(t, T.right, T.right + <span class="n">0.9</span>, ease.premium)'], [1, 'world.style.transform = <span class="s">`scale(${1 - 0.38 * k})`</span>'],
      [1, 'cut(clip, T.cuts)  <span class="c">// slice and close the gap</span>'], [1, 'caption(words, T.captions)'], [1, 'wipe(monitor, T.transitions)'],
      [1, 'lowerThird(T.motion)'], [1, 'grade(split, T.visual)'], [1, 'flip(window, T.code)'], [0, '}']];
    const rows = C.code(B.querySelector('.wbody'), lines); B.querySelector('.code').style.cssText += 'font-size:36px;line-height:58px;padding:36px 60px';
    const bsp = B.querySelector('#bsp');
    E = { F, frame, mon, vw, rw, split, wipe, cap, cw, lt, tracks, pcs, blade, blade2, dia, capClips, mgClip, fxClip, ph, B, rows, bsp };
  }
  function render(t) {
    const dur = window.DUR;
    // build the editor in
    set(E.mon, enter(t, -0.1, { dy: 40, s0: 0.95, blur: 14, dur: 0.6 }));
    E.tracks.forEach((tk, i) => set(tk.row, enter(t, i ? tk.t0 - 0.12 : 0.0, { dx: -30, dy: 0, blur: 8, dur: 0.45 })));
    // playhead runs with the footage
    E.ph.style.transform = `translateX(${(Math.min(t, T.right) / T.right * 900).toFixed(1)}px)`;
    // CUTS: two blades drop, the middle piece collapses, the right piece slides left to close the gap
    const b = sp(t, T.cuts, 0.25); set(E.blade, { o: b * (1 - p(t, T.cuts + 0.5, T.cuts + 0.7)), sy: b }); set(E.blade2, { o: p(t, T.cuts + 0.08, T.cuts + 0.12) * (1 - p(t, T.cuts + 0.5, T.cuts + 0.7)) });
    const col_ = sp(t, T.cuts + 0.3, 0.45);
    E.pcs[1].c.style.width = (120 * (1 - col_)).toFixed(1) + 'px'; E.pcs[1].c.style.opacity = (1 - col_).toFixed(2);
    E.pcs[2].c.style.left = (480 - 120 * col_).toFixed(1) + 'px';
    // the picture "jumps" on the cut: a 2-frame punch on the monitor, like the hard cut it is
    const jump = t > T.cuts + 0.3 && t < T.cuts + 0.38 ? 1.04 : 1;
    // CAPTIONS: his real words, active word amber
    const ce = enter(t, T.caps - 0.05, { dy: 20, blur: 8, dur: 0.4 }); set(E.cap, { ...ce, o: ce.o * (1 - p(t, T.vfx + 0.3, T.vfx + 0.5)) });
    const ws = [T.caps, T.trans, T.mg, wt('graphics,')]; E.cw.forEach((s, i) => { s.style.color = t >= ws[i] && t < (ws[i + 1] || ws[i] + 0.6) ? '#FFB020' : '#fff'; });
    E.capClips.forEach((c, i) => set(c, enter(t, T.caps + i * 0.08, { dy: 0, dx: -16, blur: 6, dur: 0.35 })));
    // TRANSITIONS: a coral wipe crosses the picture, a transition diamond lands on the join
    const wp = p(t, T.trans, T.trans + 0.5, ease.inOutCubic), bx = -260 + wp * (MW + 260);   // a 220 px coral band sweeps across
    E.wipe.style.clipPath = `inset(0 ${Math.max(0, MW - bx - 220).toFixed(1)}px 0 ${Math.max(0, bx).toFixed(1)}px)`; E.wipe.style.opacity = wp > 0 && wp < 1 ? 0.92 : 0;
    const dd = sp(t, T.trans + 0.25, 0.5, 0.3); set(E.dia, { o: dd > 0 ? 1 : 0, s: dd, r: 45 });
    // MOTION GRAPHICS: a lower third springs in on the picture; a coral clip lands on its track
    set(E.lt, life(t, T.mg, T.and + 0.2, { dx: -60, dy: 0, blur: 12, dur: 0.55, bounce: 0.08 }));
    const mc = sp(t, T.mg + 0.05, 0.5); set(E.mgClip, { sx: Math.max(0.001, mc), sy: 1, o: mc > 0 ? 1 : 0 }); E.mgClip.style.transformOrigin = '0 50%';
    // VISUAL EFFECTS: the grade wipes on, raw on the left of a moving split line, graded on the right
    const g = p(t, T.vfx, T.vfx + 0.9, ease.inOutCubic), gx = (1 - g) * MW;
    E.rw.style.clipPath = `inset(0 ${(MW - gx).toFixed(1)}px 0 0)`; E.rw.style.opacity = t < T.vfx ? 1 : (g < 1 ? 1 : 0);
    E.split.style.transform = `translateX(${gx.toFixed(1)}px)`; E.split.style.opacity = g > 0 && g < 1 ? 1 : 0;
    const fx = sp(t, T.vfx + 0.05, 0.5); set(E.fxClip, { sx: Math.max(0.001, fx), sy: 1, o: fx > 0 ? 1 : 0 }); E.fxClip.style.transformOrigin = '0 50%';
    // before the grade arrives the raw copy covers everything (the footage starts ungraded)
    if (t < T.vfx) E.rw.style.clipPath = 'none';
    E.mon.style.transform += ` scale(${jump})`;
    // "...the graphics you're looking at RIGHT NOW": pull back, this editor is a window
    const k = p(t, T.right - 0.15, T.right + 0.75, ease.premium);
        set(E.frame, { o: k });
    // "were created through CODE": the window flips over to the code behind it
    const f1 = p(t, T.were + 0.05, T.were + 0.35, ease.inCubic), f2 = p(t, T.were + 0.35, T.were + 0.7, ease.outCubic);
    set(E.F, { s: 1 - 0.2 * k, ry: 90 * f1, o: f1 < 1 ? 1 : 0 });
    set(E.B, { ry: -90 * (1 - f2), o: f2 > 0 ? 1 : 0, s: 0.9 + 0.1 * f2 });
    E.rows.forEach((r, i) => set(r, enter(t, T.were + 0.45 + i * 0.09, { dx: -24, dy: 0, blur: 6, dur: 0.35 })));
    // "AI": the spark in the window bar wakes up
    const a = sp(t, T.ai, 0.6, 0.15); set(E.bsp, { s: 1 + 0.6 * a * (1 - p(t, T.ai + 0.5, T.ai + 1.0)), r: 180 * a });
  }
  return { build, render };
})();
