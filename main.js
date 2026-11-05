// Mobile menu
const btn = document.querySelector('.menu-btn');
const menu = document.querySelector('.nav ul');
if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('open'));

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
