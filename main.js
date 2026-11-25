(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)').matches;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const nav = document.getElementById('nav');

  // ---------- menu ----------
  const btn = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  let heroOnScreen = !!document.querySelector('.stage');
  let heroP = 0, pastTop = false;
  const setNav = () => nav.classList.toggle('solid', !heroOnScreen || heroP > .4 || (phone() && pastTop) || (links && links.classList.contains('open')));
  if (btn && links) {
    btn.addEventListener('click', () => { const o = links.classList.toggle('open'); btn.setAttribute('aria-expanded', o); setNav(); });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); setNav(); } });
  }

  // ---------- progress loops: only run while their section is on screen ----------
  // Each driver reads its section's position once per frame and writes one custom property.
  const drivers = [];
  let running = false;
  const tick = () => {
    let any = false;
    drivers.forEach((d) => { if (d.on) { any = true; d.update(); } });
    running = any;
    if (any) requestAnimationFrame(tick);
  };
  const watch = (el, update) => {
    const d = { on: false, update };
    drivers.push(d);
    new IntersectionObserver(([e]) => {
      d.on = e.isIntersecting;
      if (d.on && !running) { running = true; requestAnimationFrame(tick); }
    }, { rootMargin: '10% 0px' }).observe(el);
    update();
    return d;
  };

  // ---------- hero: the arch opens into the room ----------
  const stage = document.querySelector('.stage');
  if (stage) {
    const sent = document.createElement('div'); sent.className = 'nav-sentinel'; stage.prepend(sent);
    new IntersectionObserver(([e]) => { pastTop = !e.isIntersecting; setNav(); }).observe(sent);
    const v = stage.querySelector('video');
    if (v && !reduce) { v.src = v.dataset.src; v.play().catch(() => {}); }
    new IntersectionObserver(([e]) => {
      heroOnScreen = e.intersectionRatio > 0 && e.boundingClientRect.bottom > 90;
      setNav();
      if (!v || reduce) return;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: [0, 0.02, 0.1] }).observe(stage);

    if (!reduce) {
      watch(stage, () => {
        if (phone()) { stage.style.setProperty('--p', 0); return; }
        const r = stage.getBoundingClientRect();
        const travel = r.height - innerHeight;
        heroP = clamp(-r.top / travel, 0, 1);
        stage.style.setProperty('--p', heroP.toFixed(4));
        setNav();
      });
      // gentle pointer depth on the foreground photos
      stage.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        stage.style.setProperty('--mx', ((e.clientX / innerWidth) - .5).toFixed(3));
        stage.style.setProperty('--my', ((e.clientY / innerHeight) - .5).toFixed(3));
      });
    }
  }

  // ---------- statement: words light up in reading order ----------
  const st = document.querySelector('.statement');
  if (st) {
    const words = [];
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(t); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = t; words.push(s); frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(st);
    if (reduce) words.forEach((w) => w.classList.add('on'));
    else watch(st, () => {
      const r = st.getBoundingClientRect();
      const t = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
      const n = Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  // ---------- work: pinned lateral pan ----------
  const pan = document.querySelector('.pan');
  if (pan) {
    const track = pan.querySelector('.pan-track');
    const measure = () => pan.style.setProperty('--dist', Math.max(0, track.scrollWidth - document.documentElement.clientWidth) + 'px');
    measure(); addEventListener('resize', measure);
    addEventListener('load', measure);
    const pv = pan.querySelector('video');
    new IntersectionObserver(([e]) => { if (!pv || reduce) return; if (e.isIntersecting) pv.play().catch(() => {}); else pv.pause(); }, { threshold: 0.2 }).observe(pan);
    if (!reduce) watch(pan, () => {
      if (phone()) { pan.style.setProperty('--q', 0); return; }
      const r = pan.getBoundingClientRect();
      pan.style.setProperty('--q', clamp(-r.top / (r.height - innerHeight), 0, 1).toFixed(4));
    });
  }

  // ---------- services: a photo follows the pointer ----------
  const peek = document.querySelector('.peek');
  const list = document.querySelector('.svc-list');
  if (peek && list && matchMedia('(hover: hover)').matches) {
    const img = peek.querySelector('img');
    list.querySelectorAll('a[data-img]').forEach((a) => {
      a.addEventListener('pointerenter', () => { img.src = a.dataset.img; peek.classList.add('on'); });
      a.addEventListener('pointerleave', () => peek.classList.remove('on'));
    });
    list.addEventListener('pointermove', (e) => {
      peek.style.setProperty('--x', (e.clientX + 28) + 'px');
      peek.style.setProperty('--y', (e.clientY - 170) + 'px');
    });
  }

  // ---------- before / after drag ----------
  document.querySelectorAll('[data-compare]').forEach((c) => {
    const setPos = (pct) => { c.classList.add('manual'); c.style.setProperty('--pos', clamp(pct, 0, 100).toFixed(1) + '%'); };
    const fromX = (x) => { const r = c.getBoundingClientRect(); setPos(((x - r.left) / r.width) * 100); };
    let drag = false;
    c.addEventListener('pointerdown', (e) => { drag = true; c.setPointerCapture(e.pointerId); fromX(e.clientX); });
    c.addEventListener('pointermove', (e) => { if (drag) fromX(e.clientX); });
    c.addEventListener('pointerup', () => { drag = false; });
    c.addEventListener('pointercancel', () => { drag = false; });
    c.querySelector('.handle').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const cur = parseFloat(getComputedStyle(c).getPropertyValue('--pos')) || 50;
      setPos(cur + (e.key === 'ArrowLeft' ? -5 : 5));
    });
  });

  if (!stage) nav.classList.add('solid');
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
