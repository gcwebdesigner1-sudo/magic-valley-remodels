(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');
  let heroVisible = !!hero;

  // Mobile menu
  const btn = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  if (btn && links) {
    btn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      if (hero) nav.classList.toggle('solid', open || !heroVisible);
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Hero video: one video, the tall cut on portrait screens. Pauses when off screen.
  const v = document.getElementById('heroVideo');
  if (v && hero) {
    const tall = window.innerWidth / window.innerHeight < 0.8;
    v.poster = tall ? v.dataset.posterTall : v.dataset.posterWide;
    if (!reduce) v.src = tall ? v.dataset.tall : v.dataset.wide;
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      nav.classList.toggle('solid', !heroVisible || (links && links.classList.contains('open')));
      if (reduce) return;
      if (heroVisible) v.play().catch(() => {}); else v.pause();
    }, { rootMargin: '-68px 0px 0px 0px', threshold: 0.08 }).observe(hero);
  }

  // Before / after: CSS drives the scroll wipe. Dragging or arrow keys take over.
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  document.querySelectorAll('[data-compare]').forEach((c) => {
    const setPos = (pct) => {
      c.classList.add('manual');
      c.style.setProperty('--pos', clamp(pct, 0, 100).toFixed(1) + '%');
    };
    const fromX = (x) => { const r = c.getBoundingClientRect(); setPos(((x - r.left) / r.width) * 100); };
    let dragging = false;
    c.addEventListener('pointerdown', (e) => { dragging = true; c.setPointerCapture(e.pointerId); fromX(e.clientX); });
    c.addEventListener('pointermove', (e) => { if (dragging) fromX(e.clientX); });
    c.addEventListener('pointerup', () => { dragging = false; });
    c.addEventListener('pointercancel', () => { dragging = false; });
    c.querySelector('.handle').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const cur = parseFloat(getComputedStyle(c).getPropertyValue('--pos')) || 50;
      setPos(cur + (e.key === 'ArrowLeft' ? -5 : 5));
    });
  });

  // Project clips: only the most visible one plays, so one video runs at a time.
  const clips = [...document.querySelectorAll('.tile video')];
  if (clips.length && !reduce) {
    const ratios = new Map();
    const pick = () => {
      let best = null, bestR = 0.35;
      ratios.forEach((r, el) => { if (r > bestR) { best = el; bestR = r; } });
      clips.forEach((el) => {
        if (el === best && !heroVisible) { if (el.paused) el.play().catch(() => {}); }
        else if (!el.paused) el.pause();
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
      pick();
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });
    clips.forEach((el) => io.observe(el));
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
