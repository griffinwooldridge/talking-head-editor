/* From the 30 s demo in docs/ (made with this skill); media paths point at clips cut from that project. */
/* r03 15.31-20.56 (ff): "You can add it to your own AI workflow and use it to handle everything from basic edits to
   custom motion graphics."
   CONCEPT: the skill card that dove out of r02 falls back in from above and drops into the empty slot of a
   footage -> [ ] -> edit chain; on "workflow" a pulse runs the chain. On "everything" the camera pushes into the edit,
   and a cursor drags one knob from "basic edits" to "motion graphics" while the output climbs with it: a plain cut,
   then captions, then a lower third, then a full motion graphic takes the frame. */
/*MEDIA[{"id":"foot","src":"assets/media/th_face.mp4","x":0,"y":0,"w":400,"h":225,"start":0},
        {"id":"out","src":"assets/media/th_face.mp4","x":0,"y":0,"w":400,"h":225,"start":0}]MEDIA*/
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, icon, chars, type, kf, spark } = C;
  let E = {}, cur;
  const T = { add: wt('add'), wf: wt('workflow'), every: wt('everything'), basic: wt('basic'), custom: wt('custom'), gfx: wt('graphics') };
  const Y = 300, TWW = 400, THH = 225, XS = [210, 760, 1310];
  // the output tile's box: in the chain, then pushed in to centre stage
  const OB0 = [XS[2], Y, TWW, THH], OB1 = [400, 110, 1120, 630];
  function build(stage) {
    const W = abs(stage, 0, 0, 1920, 1080); E.W = W;
    const tile = (x, cls) => { const d = abs(W, x, Y, TWW, THH); d.style.cssText += 'border-radius:18px;overflow:hidden;background:#171615;box-shadow:0 0 0 1px rgba(245,242,234,.10),0 24px 70px rgba(0,0,0,.5)'; return d; };
    const ft = tile(XS[0]); const fv = document.getElementById('vw_foot'); ft.appendChild(fv); Object.assign(fv.style, { left: 0, top: 0, width: '100%', height: '100%', opacity: 1, filter: 'saturate(.2) brightness(.8)' });
    const slot = abs(W, XS[1], Y, TWW, THH); slot.style.cssText += 'border-radius:18px;border:3px dashed rgba(245,242,234,.22)';
    const lbls = ['Footage', 'Skill', 'Your edit'].map((s, i) => { const l = abs(W, XS[i], Y + THH + 26, TWW, 40, 'ui'); l.style.cssText += `text-align:center;font-size:30px;font-weight:500;color:${col.mute}`; l.textContent = s; return l; });
    const links = [0, 1].map((i) => { const l = abs(W, XS[i] + TWW + 20, Y + THH / 2 - 2, XS[i + 1] - XS[i] - TWW - 40, 4); l.style.cssText += `background:rgba(245,242,234,.18);border-radius:2px`; return l; });
    const dots = [0, 1].map((i) => { const d = abs(W, 0, Y + THH / 2 - 9, 18, 18); d.style.cssText += `border-radius:50%;background:${col.coral};box-shadow:0 0 18px ${col.coral}`; return d; });
    const card = abs(W, XS[1], Y, TWW, THH, 'win'); card.innerHTML = `<div class="wbar" style="height:40px;font-size:16px"><i></i><i></i><i></i><span>SKILL.md</span></div>
      <div style="display:flex;align-items:center;gap:14px;padding:34px 26px" class="disp">${spark(40)}<span style="font-size:36px">talking-head-<i>editor</i></span></div>`;
    // the output tile (pushes in), with layered states
    const ot = abs(stage, ...OB0); ot.style.cssText += 'border-radius:18px;overflow:hidden;background:#000;box-shadow:0 0 0 1px rgba(245,242,234,.12),0 30px 90px rgba(0,0,0,.6)';
    const ov = document.getElementById('vw_out'); ot.appendChild(ov); Object.assign(ov.style, { left: 0, top: 0, opacity: 1 });
    const cap = abs(ot, 0, 0, 1120, 60); cap.innerHTML = `<div class="ui" style="margin:0 auto;width:max-content;padding:10px 22px;border-radius:14px;background:rgba(10,10,10,.66);font-size:30px;font-weight:600">from basic edits <span style="color:#FFB020">to custom</span></div>`;
    const lt = abs(ot, 36, 36, 400, 90); lt.style.cssText += `display:flex;align-items:center;gap:16px;padding:0 22px;border-radius:16px;background:rgba(14,13,12,.84);box-shadow:inset 3px 0 0 ${col.coral}`;
    lt.innerHTML = `${spark(36)}<div class="ui" style="font-size:26px;font-weight:600">Griffin Wooldridge</div>`;
    const gfx = abs(ot, 0, 0, 1120, 630); gfx.style.cssText += 'background:#0E0D0C';
    gfx.innerHTML = `<div class="a" style="left:120px;top:150px">${spark(170)}</div><div class="a disp" style="left:360px;top:150px;font-size:120px;line-height:1">Motion<br><i>graphics</i></div>`;
    const bars = [0.35, 0.55, 0.8, 1].map((v, i) => { const b = abs(gfx, 760 + i * 70, 470 - 180 * v, 46, 180 * v); b.style.cssText += `border-radius:8px;background:${i === 3 ? col.coral : '#3A332D'};transform-origin:50% 100%`; return b; });
    const pip = abs(ot, 0, 0, 1120, 630); pip.style.cssText += 'pointer-events:none';
    // the knob that runs it all
    const sl = abs(stage, 460, 880, 1000, 8); sl.style.cssText += 'border-radius:4px;background:rgba(245,242,234,.14)';
    const fill = abs(sl, 0, 0, 1000, 8); fill.style.cssText += `border-radius:4px;background:${col.coral};transform-origin:0 50%`;
    const knob = abs(sl, -22, -18, 44, 44); knob.style.cssText += `border-radius:50%;background:${col.ivory};box-shadow:0 6px 20px rgba(0,0,0,.5)`;
    const la = abs(stage, 300, 930, 400, 44, 'ui'), lb = abs(stage, 1220, 930, 400, 44, 'ui');
    la.style.cssText += `font-size:30px;font-weight:500;color:${col.oat};text-align:left;padding-left:160px`; la.textContent = 'Basic edits';
    lb.style.cssText += `font-size:30px;font-weight:500;color:${col.oat};text-align:right;padding-right:160px`; lb.textContent = 'Motion graphics';
    E.kv = (t) => kf(t, [[T.basic, 0], [T.gfx + 0.1, 1, ease.inOutCubic]]);       // knob value: basic -> motion graphics on the words
    cur = { render(t) { const q = enter(t, T.basic - 0.55, { dy: 60, dx: 40, blur: 6, dur: 0.4 }); const x = 460 + 1000 * E.kv(t);
      E.cur.style.transform = `translate(${(x - 3 + q.x).toFixed(1)}px,${(900 - 2 + q.y).toFixed(1)}px) scale(${(1.4 * (t > T.basic - 0.05 && t < T.gfx + 0.3 ? 0.88 : 1)).toFixed(3)})`; E.cur.style.opacity = q.o; } };
    E.cur = abs(stage, 0, 0, 32, 40); E.cur.style.cssText += 'transform-origin:3px 2px;z-index:100;filter:drop-shadow(0 6px 10px rgba(0,0,0,.3))';
    E.cur.innerHTML = '<svg viewBox="0 0 32 40" width="32" height="40" style="display:block;overflow:visible"><path d="M3 2 L3 31 L10.4 24.4 L15.2 35.6 L20.4 33.4 L15.6 22.4 L25.6 22.4 Z" fill="#0b0b0c" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>';
    E = Object.assign(E, { ft, fv, slot, lbls, links, dots, card, ot, ov, cap, lt, gfx, bars, sl, fill, knob, la, lb });
  }
  function render(t) {
    // chain enters, card falls into the slot on "add"
    [E.ft, E.slot].forEach((x, i) => set(x, enter(t, 0.0 + i * 0.08, { dy: 40, blur: 12, dur: 0.5 })));
    set(E.ot, enter(t, 0.16, { dy: 40, blur: 12, dur: 0.5 }));
    E.lbls.forEach((l, i) => set(l, enter(t, 0.2 + i * 0.08, { dy: 16, blur: 6, dur: 0.4 })));
    const fall = p(t, T.add - 0.25, T.add + 0.15, ease.inCubic), land = sp(t, T.add + 0.15, 0.4, 0.2);
    set(E.card, { y: -700 * (1 - fall) + 18 * Math.sin(Math.PI * Math.min(1, land)) * (1 - land), o: t > T.add - 0.25 ? 1 : 0, blur: 14 * (1 - fall) * (fall < 1 ? 1 : 0) });
    E.links.forEach((l, i) => { const g = p(t, T.add + 0.2 + i * 0.12, T.add + 0.55 + i * 0.12, ease.outCubic); l.style.transformOrigin = '0 50%'; set(l, { sx: Math.max(0.001, g), sy: 1 }); });
    // "workflow": a pulse runs footage -> skill -> edit
    E.dots.forEach((d, i) => { const q = p(t, T.wf + i * 0.38, T.wf + 0.38 + i * 0.38, ease.inOutCubic); const x0 = XS[i] + TWW + 20, x1 = XS[i + 1] - 20;
      set(d, { x: x0 + (x1 - x0) * q, o: q > 0 && q < 1 ? 1 : 0 }); });
    // "everything": the chain lifts away and the edit pushes in to centre stage
    const k = p(t, T.every - 0.25, T.every + 0.55, ease.premium);
    set(E.W, { y: -420 * k, o: 1 - k, blur: 10 * k });
    const bx = OB0.map((v, i) => v + (OB1[i] - v) * k); Object.assign(E.ot.style, { left: bx[0] + 'px', top: (bx[1] - 0) + 'px', width: bx[2] + 'px', height: bx[3] + 'px' });
    Object.assign(E.ov.style, { width: bx[2] + 'px', height: bx[3] + 'px' });
    // the knob
    [E.sl, E.la, E.lb].forEach((x) => set(x, enter(t, T.every + 0.2, { dy: 24, blur: 8, dur: 0.45 })));
    const v = E.kv(t); E.knob.style.transform = `translateX(${(v * 1000).toFixed(1)}px) scale(${t > T.basic - 0.05 && t < T.gfx + 0.3 ? 1.12 : 1})`; set(E.fill, { sx: Math.max(0.001, v), sy: 1 });
    E.la.style.color = v < 0.3 ? col.coral : col.oat; E.lb.style.color = v > 0.85 ? col.coral : col.oat;
    // the output climbs with the knob: cut -> captions -> lower third -> full motion graphic
    const sc = E.cap.style; sc.top = (bx[3] - 86) + 'px'; sc.width = bx[2] + 'px'; set(E.cap, { o: p(v, 0.22, 0.3), y: 14 * (1 - p(v, 0.22, 0.3)) });
    set(E.lt, { o: p(v, 0.48, 0.56) * (1 - p(v, 0.8, 0.88)), x: -40 * (1 - p(v, 0.48, 0.56)) });
    const g = p(v, 0.78, 0.95, ease.inOutCubic); E.gfx.style.clipPath = `circle(${(g * 135).toFixed(1)}% at 90% 85%)`; E.gfx.style.opacity = g > 0 ? 1 : 0;
    E.bars.forEach((b, i) => set(b, { sy: Math.max(0.001, sp(t, T.gfx + 0.05 + i * 0.07, 0.5)), sx: 1 }));
    cur.render(t);
  }
  return { build, render };
})();
