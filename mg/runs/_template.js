/* rNN a-b (ov|ff): "<the VO this run covers>"
   CONCEPT: <one sentence: what object exists, what it becomes, which word triggers each change>. */
/*MEDIA[]MEDIA*/
window.RUN = (function () {
  const { h, abs, set, enter, life, exit, p, sp, ease, col, icon, chars, type, kf } = C;
  let E = {};
  const T = { /* beat: wt('word') */ };
  function build(stage) {
    // create every element once; position with abs(parent, x, y, w, h, cls). ov runs are 960 x 1080, ff runs 1920 x 1080.
    E.title = abs(stage, 0, 470, window.W, 140, 'disp'); E.title.style.cssText += 'font-size:96px;text-align:center';
    E.title.innerHTML = 'Hello <i>world</i>';
  }
  function render(t) {
    // pure function of t: derive every style from t, no state
    set(E.title, life(t, 0.1, window.DUR - 0.4, { dy: 40, blur: 14 }));
  }
  return { build, render };
})();
