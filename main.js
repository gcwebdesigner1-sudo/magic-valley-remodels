(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');

  // ----- Mobile menu -----
  const btn = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    nav.classList.add('solid');
  });
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });

  // ----- Hero video: one video, tall cut on portrait screens -----
  const v = document.getElementById('heroVideo');
  const tall = window.innerWidth / window.innerHeight < 0.8;
  v.poster = tall ? v.dataset.posterTall : v.dataset.posterWide;
  if (!reduce) {
    v.src = tall ? v.dataset.tall : v.dataset.wide;
    v.play().catch(() => {});
  }

  // ----- Scroll-linked: hero fade, nav, before/after wipe -----
  const compares = [...document.querySelectorAll('[data-compare]')];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function onScroll() {
    const y = window.scrollY;
    const h = hero.offsetHeight;
    if (!links.classList.contains('open')) nav.classList.toggle('solid', y > h - 80);
    if (!reduce) hero.style.setProperty('--p', clamp(y / h, 0, 1).toFixed(3));

    compares.forEach((c) => {
      if (c.dataset.manual) return;
      const r = c.getBoundingClientRect();
      // 0 when the image's top reaches 85% of the screen, 1 when its middle reaches 40%
      const start = window.innerHeight * 0.85;
      const end = window.innerHeight * 0.4 - r.height / 2;
      const t = reduce ? 0.5 : clamp((start - r.top) / (start - end), 0, 1);
      c.style.setProperty('--pos', (100 - t * 100).toFixed(2) + '%');
    });
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ----- Drag to compare (takes over from scroll for that image) -----
  compares.forEach((c) => {
    const handle = c.querySelector('.handle');
    const setFrom = (clientX) => {
      const r = c.getBoundingClientRect();
      c.dataset.manual = '1';
      c.style.setProperty('--pos', clamp((clientX - r.left) / r.width * 100, 0, 100).toFixed(2) + '%');
    };
    let dragging = false;
    c.addEventListener('pointerdown', (e) => { dragging = true; c.setPointerCapture(e.pointerId); setFrom(e.clientX); });
    c.addEventListener('pointermove', (e) => { if (dragging) setFrom(e.clientX); });
    c.addEventListener('pointerup', () => { dragging = false; });
    c.addEventListener('pointercancel', () => { dragging = false; });
    handle.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const cur = parseFloat(getComputedStyle(c).getPropertyValue('--pos')) || 50;
      c.dataset.manual = '1';
      c.style.setProperty('--pos', clamp(cur + (e.key === 'ArrowLeft' ? -5 : 5), 0, 100) + '%');
    });
  });

  // ----- Reveal on scroll, both directions -----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('in', e.isIntersecting));
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ----- Project clips: only the one nearest the middle of the screen plays -----
  const clips = [...document.querySelectorAll('.clip video')];
  function pickClip() {
    const mid = window.innerHeight / 2;
    let best = null, bestDist = Infinity;
    clips.forEach((c) => {
      const r = c.getBoundingClientRect();
      const visible = r.bottom > window.innerHeight * 0.15 && r.top < window.innerHeight * 0.85;
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (visible && d < bestDist) { best = c; bestDist = d; }
    });
    clips.forEach((c) => { if (c !== best && !c.paused) c.pause(); });
    if (best && best.paused) best.play().catch(() => {});
  }
  // Pause the hero once it's scrolled away so only one video ever runs
  function heroPlayback() {
    if (reduce) return;
    const off = window.scrollY > hero.offsetHeight * 0.9;
    if (off && !v.paused) v.pause();
    if (!off && v.paused) v.play().catch(() => {});
  }
  if (!reduce) {
    let last = 0;
    const tick = () => { const now = Date.now(); if (now - last > 120) { last = now; heroPlayback(); if (clips.length) pickClip(); } };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('scrollend', () => { heroPlayback(); if (clips.length) pickClip(); });
    if (clips.length) pickClip();
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
