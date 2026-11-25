(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const nav = document.getElementById('nav');

  // ---------- menu ----------
  const btn = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  let pastTop = !document.querySelector('.hero');
  const setNav = () => nav.classList.toggle('solid', pastTop || (links && links.classList.contains('open')));
  if (btn && links) {
    btn.addEventListener('click', () => { const o = links.classList.toggle('open'); btn.setAttribute('aria-expanded', o); setNav(); });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); setNav(); } });
  }
  const sentinel = document.getElementById('top-sentinel');
  if (sentinel) new IntersectionObserver(([e]) => { pastTop = !e.isIntersecting; setNav(); }).observe(sentinel);
  setNav();

  // ---------- hero: graded stills, one at a time ----------
  const slides = [...document.querySelectorAll('.slide')];
  const reel = [...document.querySelectorAll('.reel button')];
  if (slides.length) {
    let i = 0, timer = null, visible = true;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      reel.forEach((b, k) => { b.classList.remove('on'); void b.offsetWidth; b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', k === i); });
    };
    const play = () => { clearInterval(timer); if (!reduce && visible) timer = setInterval(() => show(i + 1), 7000); };
    reel.forEach((b, k) => b.addEventListener('click', () => { show(k); play(); }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else clearInterval(timer); }).observe(document.querySelector('.hero'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(timer); else play(); });
    show(0); play();
  }

  // ---------- reveals (once, as they enter) ----------
  const rs = document.querySelectorAll('[data-r]');
  if (reduce) rs.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    rs.forEach((el) => io.observe(el));
  }

  // ---------- testimonials ----------
  const qs = [...document.querySelectorAll('.q')];
  const dots = [...document.querySelectorAll('.q-dots i')];
  if (qs.length) {
    let qi = 0, qt = null;
    const showQ = (n) => { qi = (n + qs.length) % qs.length; qs.forEach((q, k) => { q.classList.toggle('on', k === qi); q.setAttribute('aria-hidden', k !== qi); }); dots.forEach((d, k) => d.classList.toggle('on', k === qi)); };
    const auto = () => { clearInterval(qt); if (!reduce) qt = setInterval(() => showQ(qi + 1), 8000); };
    document.querySelector('.q-nav .prev')?.addEventListener('click', () => { showQ(qi - 1); auto(); });
    document.querySelector('.q-nav .next')?.addEventListener('click', () => { showQ(qi + 1); auto(); });
    showQ(0); auto();
  }

  // ---------- before / after drag ----------
  document.querySelectorAll('[data-compare]').forEach((c) => {
    const setPos = (p) => { c.classList.add('manual'); c.style.setProperty('--pos', clamp(p, 0, 100).toFixed(1) + '%'); };
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

  // ---------- lightbox for project galleries ----------
  const lb = document.querySelector('.lb');
  if (lb) {
    const img = lb.querySelector('img'), cap = lb.querySelector('p');
    let set = [], at = 0, last = null;
    const open = (list, k) => { set = list; at = k; render(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.x').focus(); };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); };
    const render = () => { const a = set[at]; img.src = a.href; img.alt = a.querySelector('img').alt; cap.textContent = a.querySelector('img').alt + '  (' + (at + 1) + ' of ' + set.length + ')'; };
    document.querySelectorAll('.gal').forEach((g) => {
      const items = [...g.querySelectorAll('a')];
      items.forEach((a, k) => a.addEventListener('click', (e) => { e.preventDefault(); last = a; open(items, k); }));
    });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', () => { at = (at - 1 + set.length) % set.length; render(); });
    lb.querySelector('.nx').addEventListener('click', () => { at = (at + 1) % set.length; render(); });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') lb.querySelector('.nx').click();
      if (e.key === 'ArrowLeft') lb.querySelector('.pv').click();
    });
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
