// Run in a browser on the brand's site (DevTools console or a browser tool's JS runner), and again on its app if public.
// Returns raw style evidence; turn it into mg/kit/cine.css + C.col (see references/look.md).
(() => {
  const cs = e => getComputedStyle(e);
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12 && cs(e).visibility !== 'hidden'; };
  const pick = (e, keys) => { const s = cs(e); return Object.fromEntries(keys.map(k => [k, s[k]])); };
  const T = ['fontFamily','fontWeight','fontSize','letterSpacing','lineHeight','textTransform','color'];
  const B = ['backgroundColor','backgroundImage','color','borderRadius','border','boxShadow','fontWeight','textTransform','padding'];
  const all = [...document.querySelectorAll('body *')].filter(vis);
  const bodyBg = cs(document.body).backgroundColor;
  const buttons = all.filter(e => /^(A|BUTTON)$/.test(e.tagName) && cs(e).backgroundColor !== 'rgba(0, 0, 0, 0)' && !/skip to/i.test(e.textContent)).slice(0, 8)
    .map(e => ({ text: e.textContent.trim().slice(0, 30), ...pick(e, B) }));
  const surfaces = all.filter(e => { const s = cs(e); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== bodyBg && parseFloat(s.borderRadius) > 0 && e.getBoundingClientRect().width > 240; })
    .sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)
    .slice(0, 10).map(e => pick(e, ['backgroundColor','borderRadius','border','boxShadow','backdropFilter']));
  const count = (vals) => Object.entries(vals.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const vars = {}; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) { if (r.selectorText === ':root' || r.selectorText === ':root, :host') for (const p of r.style) if (p.startsWith('--')) vars[p] = r.style.getPropertyValue(p).trim(); } } catch (e) {} }
  const motion = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) { const s = r.style; if (!s) continue; const tf = s.transitionTimingFunction || s.animationTimingFunction; const du = s.transitionDuration || s.animationDuration; if (tf || du) motion.push(`${tf || ''} ${du || ''}`.trim()); } } catch (e) {} }
  const faces = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.constructor.name === 'CSSFontFaceRule') faces.push({ family: r.style.fontFamily, weight: r.style.fontWeight, src: (r.style.src.match(/url\(["']?([^"')]+)/) || [])[1], base: sh.href }); } catch (e) {} }
  // logo = first svg/img inside the home link near the top (not the first random icon)
  const home = [...document.querySelectorAll('a')].find(a => { const h = a.getAttribute('href'); return (h === '/' || h === location.origin + '/' || h === location.origin) && a.getBoundingClientRect().top < 160; });
  const logo = (home && (home.querySelector('svg') || home.querySelector('img'))) || document.querySelector('header [class*=logo] svg, header [class*=logo] img');
  return {
    title: document.title, bodyBg, body: pick(document.body, T),
    h1: document.querySelector('h1') && pick(document.querySelector('h1'), T),
    h2: document.querySelector('h2') && pick(document.querySelector('h2'), T),
    buttons, surfaces,
    radii: count(all.map(e => cs(e).borderRadius).filter(r => r !== '0px').map(r => parseFloat(r) > 5000 ? 'pill' : r)),
    shadows: count(all.map(e => cs(e).boxShadow).filter(s => s !== 'none')).slice(0, 6),
    textColors: count(all.map(e => cs(e).color)), bgColors: count(all.map(e => cs(e).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)')),
    motion: count(motion), fontFaces: faces.slice(0, 16), rootVars: vars,
    logo: logo ? (logo.tagName === 'IMG' ? { img: new URL(logo.getAttribute('src'), location.href).href } : { svg: logo.outerHTML.slice(0, 4000) }) : null,
    highlights: [...document.querySelectorAll('h1 *, h2 *')].filter(e => cs(e).backgroundColor !== 'rgba(0, 0, 0, 0)' || cs(e).backgroundImage !== 'none').slice(0, 4).map(e => ({ text: e.textContent.trim().slice(0, 30), ...pick(e, ['backgroundColor','backgroundImage','color','borderRadius']) })),
    loadedFonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight))],
  };
})()
