/* Example run from a 5-minute video: times are cut-timeline seconds via at(); in your runs prefer wt("word"). */
/* r08 83.50-109.50: "describe the outcome ... take these four stages and animate them as a process". One object, never cut:
   the idea (a bulb) -> stretches into a prompt pill -> the prompt text pours down into a code editor that writes itself ->
   the code folds into coloured blocks that become the finished animation. Then the camera pulls back to show it as
   "its interpretation", three manual tools get struck through (didn't keyframe / position / decide), and the stages close
   into an idea -> review -> iterate loop the spark orbits. */
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, spark, icon, chars, type, kf, code } = C;
  let E = {};
  const T = {
    desc: at(84.46), four: at(87.52), idea: at(90.22), prompt: at(91.44), ai: at(92.4), code: at(92.94), anim: at(94.16), fin: at(95.5),
    interp: at(96.74), k1: at(99.8), k2: at(101.24), k3: at(103.32), gave: at(105.8), rev: at(107.0), it: at(108.56) };
  function build(stage) {
    const W = abs(stage, 0, 0, 1920, 1080, 'world');
    // 0: the instruction, typed in a chat bubble
    const ask = abs(W, 360, 120, 1200, 110, 'card ui'); ask.style.cssText += `border-radius:55px;display:flex;align-items:center;gap:22px;padding:0 40px;font-size:34px;color:${col.oat}`;
    ask.innerHTML = `${spark(36)}<span class="tx"></span>`; const acs = chars(ask.querySelector('.tx'), 'Take these four stages and animate them as a process');
    // stage labels row
    const names = ['Idea', 'Prompt', 'Code', 'Animation'];
    const labs = names.map((n, i) => { const l = abs(W, 160 + i * 420, 860, 360, 50, 'disp'); l.style.cssText += 'font-size:44px;text-align:center'; l.textContent = n; return l; });
    const tiles = [['bulb'], ['text'], ['code'], ['play']].map(([ic], i) => { const c = abs(W, 160 + i * 420 + 30, 290, 300, 300, 'card');
      c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${i ? col.oat : col.coral}">${icon(ic, 110, 1.5)}</div>`; return c; });
    const nums = names.map((n, i) => { const l = abs(W, 160 + i * 420, 920, 360, 30, 'mono'); l.style.cssText += `font-size:20px;text-align:center;color:${col.dim}`; l.textContent = `0${i + 1}`; return l; });
    // the morphing object: a single rounded box that becomes bulb-circle -> pill -> editor -> animation stage
    const obj = abs(W, 0, 0, 100, 100); obj.style.cssText += `background:#1F1E1D;box-shadow:0 0 0 1px rgba(245,242,234,.10),0 40px 120px rgba(0,0,0,.5);overflow:hidden`;
    const bulb = abs(obj, 0, 0, 100, 100); bulb.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${col.coral}">${icon('bulb', 96, 1.6)}</div>`;
    const ptx = abs(obj, 34, 0, 1000, 120, 'ui'); ptx.style.cssText += `font-size:38px;color:${col.oat};line-height:120px;white-space:nowrap`; const pcs = chars(ptx, 'An idea, a prompt, code, then motion');
    const ed = abs(obj, 0, 0, 760, 520); const rows = code(ed, [
      [0, '<span class="k">const</span> stages = [<span class="s">"idea"</span>, <span class="s">"prompt"</span>, <span class="s">"code"</span>, <span class="s">"motion"</span>]'],
      [0, 'stages.<span class="n">forEach</span>((s, i) => {'],
      [1, '<span class="n">shape</span>(s).<span class="n">enter</span>({ at: i * <span class="n">0.4</span> })'],
      [1, '<span class="n">connect</span>(s, stages[i + <span class="n">1</span>])'],
      [0, '})'],
      [0, '<span class="n">camera</span>.<span class="n">follow</span>(<span class="s">"spark"</span>)'],
      [0, '<span class="c">// hand off each stage to the next</span>']]);
    const anim = abs(obj, 0, 0, 760, 520);
    const blocks = [[80, 120, 180, 180, '50%', col.coral], [300, 120, 380, 60, '14px', '#E8E6DC'], [300, 210, 260, 60, '14px', '#5E5952'], [80, 340, 600, 60, '14px', '#3A332D']].map(([x, y, w, hh, r, c]) => {
      const b = abs(anim, x, y, w, hh); b.style.cssText += `border-radius:${r};background:${c}`; return b; });
    // "interpretation" quote marks
    const q1 = abs(W, 0, 0, 120, 160, 'disp'); q1.style.cssText += `font-size:220px;color:${col.coral};line-height:1`; q1.textContent = '“';
    const q2 = abs(W, 0, 0, 120, 160, 'disp'); q2.style.cssText += `font-size:220px;color:${col.coral};line-height:1`; q2.textContent = '”';
    const intl = abs(W, 0, 0, 900, 60, 'mono'); intl.style.cssText += `font-size:26px;color:${col.mute};letter-spacing:.14em;text-align:center`; intl.textContent = "OPUS'S INTERPRETATION";
    // didn't keyframe / position / decide
    const tools = [['diamond', 'Keyframe'], ['move', 'Position'], ['refresh', 'Transitions']].map(([ic, n], i) => {
      const c = abs(W, 330 + i * 450, 360, 360, 300, 'card'); c.innerHTML = `<div style="position:absolute;left:0;top:70px;width:360px;display:flex;justify-content:center;color:${col.oat}">${icon(ic, 90, 1.6)}</div><div class="ui" style="position:absolute;left:0;top:200px;width:360px;text-align:center;font-size:32px;color:${col.oat}">${n}</div>`;
      const sl = abs(c, 20, 145, 320, 6); sl.style.cssText += `background:${col.coral};transform-origin:0 50%;border-radius:3px`; return { c, sl }; });
    // loop: idea -> review -> iterate
    const loop = abs(W, 560, 140, 800, 800);
    loop.innerHTML = `<svg width="800" height="800" style="position:absolute"><circle id="lp" cx="400" cy="400" r="290" fill="none" stroke="rgba(245,242,234,.18)" stroke-width="3"/><circle id="lpf" cx="400" cy="400" r="290" fill="none" stroke="${col.coral}" stroke-width="4" stroke-linecap="round" transform="rotate(-90 400 400)" stroke-dasharray="1822" stroke-dashoffset="1822"/></svg>`;
    const lnodes = [['Idea', -90], ['Review', 30], ['Iterate', 150]].map(([n, a]) => { const r = a * Math.PI / 180; const x = 400 + Math.cos(r) * 290, y = 400 + Math.sin(r) * 290;
      const c = abs(loop, x - 110, y - 40, 220, 80, 'chip'); c.style.justifyContent = 'center'; c.style.fontSize = '32px'; c.textContent = n; return c; });
    const lsp = abs(loop, 0, 0, 56, 56); lsp.innerHTML = spark(56);
    E = { W, ask, acs, tiles, labs, nums, obj, bulb, ptx, pcs, ed, rows, anim, blocks, q1, q2, intl, tools, loop, lpf: loop.querySelector('#lpf'), lnodes, lsp };
  }
  function box(el, x, y, w, hh, r) { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = hh + 'px'; el.style.borderRadius = r + 'px'; }
  function render(t) {
    const secA = t < T.interp + 2.9;             // the stage chain + interpretation
    // instruction
    const ae = enter(t, 0.15, { dy: -30, blur: 12 }); const up = p(t, T.four - 0.5, T.four, ease.premium);
    set(E.ask, { ...ae, y: ae.y + 330 * (1 - up), s: 1.15 - 0.15 * up, o: ae.o * (1 - p(t, T.idea - 0.4, T.idea - 0.1)) }); type(E.acs, t, T.desc - 0.2, 30);
    // the four stages appear as tiles (destinations); they step back as the single object takes over
    E.tiles.forEach((c, i) => { const e = enter(t, T.four + 0.2 + i * 0.18, { dy: 60, s0: 0.85, blur: 14, dur: 0.7 });
      const back = p(t, T.idea - 0.15, T.idea + 0.35); set(c, { ...e, o: e.o * (1 - back), s: e.s * (1 - 0.1 * back), blur: e.blur + 10 * back }); });
    // stage labels light as the object passes through each
    const stT = [T.idea, T.prompt, T.code, T.anim];
    E.labs.forEach((l, i) => { const e = enter(t, T.four + i * 0.15, { dy: 30, blur: 10, dur: 0.6 }); const on = t >= stT[i] - 0.1 ? 1 : 0.35;
      set(l, { ...e, o: e.o * on * (1 - p(t, T.interp - 0.2, T.interp + 0.2)) }); set(E.nums[i], { o: e.o * (1 - p(t, T.interp - 0.2, T.interp + 0.2)) }); });
    // the object's shape track: [x, y, w, h, radius] per stage, sprung between
    const S0 = [520, 360, 160, 160, 80];   // idea bulb (circle)
    const S1 = [330, 380, 1260, 120, 60];   // prompt pill
    const S2 = [580, 230, 760, 520, 22];    // code editor
    const S3 = [580, 230, 760, 520, 22];    // animation stage (same box, new content)
    const mv = (a, b, t0) => { const k = sp(t, t0, 0.75); return a.map((v, i) => v + (b[i] - v) * k); };
    let B = mv(mv(mv(S0, S1, T.prompt - 0.1), S2, T.code - 0.2), S3, T.anim);
    // the bulb starts at the Idea label column and travels along with its stage
    const colX = [160, 580, 1000, 1420].map((x) => x + 180);
    const cx = kf(t, [[T.idea, colX[0]], [T.prompt - 0.1, colX[0]], [T.prompt + 0.5, 960, ease.premium], [T.code - 0.2, 960], [T.code + 0.5, 960, ease.premium]]);
    B = [cx - B[2] / 2, B[1], B[2], B[3], B[4]];
    box(E.obj, ...B);
    const oe = enter(t, T.idea - 0.1, { s0: 0.4, dy: 0, blur: 14, dur: 0.6, bounce: 0.05 });
    const out = p(t, T.interp + 2.6, T.interp + 2.95, ease.inCubic);
    // interpretation: camera pulls back a little and frames the finished animation between quote marks
    const pb = p(t, T.interp, T.interp + 0.8, ease.premium);
    set(E.obj, { o: oe.o * (1 - out), s: oe.s * (1 - 0.18 * pb), y: -40 * pb, blur: oe.blur + 12 * out });
    set(E.bulb, { o: 1 - p(t, T.prompt - 0.1, T.prompt + 0.15) });
    set(E.ptx, { o: p(t, T.prompt + 0.2, T.prompt + 0.4) * (1 - p(t, T.code - 0.25, T.code)) }); type(E.pcs, t, T.prompt + 0.25, 34);
    set(E.ed, { o: p(t, T.code, T.code + 0.2) * (1 - p(t, T.anim, T.anim + 0.25)) });
    E.rows.forEach((r, k) => { const e = enter(t, T.code + 0.1 + k * 0.13, { dx: 24, dy: 0, blur: 6, dur: 0.4 }); set(r, { o: e.o, x: e.x }); });
    // code -> animation: blocks fly in and then move as a little motion piece
    set(E.anim, { o: p(t, T.anim, T.anim + 0.2) });
    E.blocks.forEach((b, k) => { const e = enter(t, T.anim + 0.1 + k * 0.12, { dx: 0, dy: 60, s0: 0.5, blur: 10, dur: 0.6 });
      const loopy = Math.sin(Math.PI * p(t, T.fin + k * 0.1, T.fin + 0.8 + k * 0.1));
      set(b, { ...e, x: (k === 0 ? 40 : 0) * loopy, y: e.y - (k === 0 ? 20 : 0) * loopy, r: k === 0 ? 30 * loopy : 0 }); });
    const qe = enter(t, T.interp + 0.3, { s0: 0.6, dy: 0, blur: 10, dur: 0.6 });
    set(E.q1, { ...qe, o: qe.o * (1 - out) }); E.q1.style.left = '470px'; E.q1.style.top = '200px';
    set(E.q2, { ...qe, o: qe.o * (1 - out) }); E.q2.style.left = '1350px'; E.q2.style.top = '640px';
    set(E.intl, { ...enter(t, T.interp + 1.25, { dy: 20, blur: 8 }), o: enter(t, T.interp + 1.25).o * (1 - out) }); E.intl.style.left = '510px'; E.intl.style.top = '870px';
    // didn't keyframe / position / decide
    E.tools.forEach((tl, i) => { const t0 = [T.k1, T.k2, T.k3][i]; const e = enter(t, t0 - 0.25, { dy: 50, blur: 12, dur: 0.6 }); const o2 = 1 - p(t, T.gave - 0.3, T.gave);
      set(tl.c, { ...e, o: e.o * o2 }); const s = p(t, t0 + 0.35, t0 + 0.6, ease.outExpo); set(tl.sl, { sx: Math.max(0.001, s), sy: 1, r: -14, o: s > 0 ? 1 : 0 }); });
    // loop
    const le = enter(t, T.gave - 0.1, { s0: 0.85, dy: 0, blur: 14, dur: 0.7 }); set(E.loop, le);
    const fl = p(t, T.gave + 0.2, T.it + 0.5, ease.inOutCubic); E.lpf.setAttribute('stroke-dashoffset', (1822 * (1 - fl)).toFixed(1));
    E.lnodes.forEach((n, i) => set(n, enter(t, [T.gave, T.rev, T.it][i] - 0.05, { s0: 0.6, dy: 0, blur: 8, dur: 0.5, bounce: 0.05 })));
    const ang = (-90 + 360 * fl) * Math.PI / 180; set(E.lsp, { x: 400 + Math.cos(ang) * 290 - 28, y: 400 + Math.sin(ang) * 290 - 28, r: 360 * fl, o: le.o });
  }
  return { build, render };
})();
