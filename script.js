const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------------- intro loader ---------------- */
const loader = document.getElementById('loader');
const skipBtn = document.getElementById('skipBtn');

function hideLoader() {
  if (!loader) return;
  loader.classList.add('is-hidden');
  sessionStorage.setItem('roen_intro_seen', '1');
}

if (loader) {
  if (sessionStorage.getItem('roen_intro_seen')) {
    loader.classList.add('is-hidden');
  } else {
    const autoHide = setTimeout(hideLoader, 1800);
    skipBtn.addEventListener('click', () => {
      clearTimeout(autoHide);
      hideLoader();
    });
  }
}

/* ---------------- custom cursor ---------------- */
if (isFinePointer && !prefersReducedMotion) {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let ringX = 0, ringY = 0, targetX = 0, targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
  });

  function animateRing() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = 'a, button, .project-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('is-active');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('is-active');
  });
}

/* ---------------- mobile nav ---------------- */
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const mobileNav = document.getElementById('mobileNav');

function openMobileNav() {
  mobileNav.classList.add('is-open');
  menuToggle.setAttribute('aria-expanded', 'true');
}
function closeMobileNav() {
  mobileNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
if (menuClose) menuClose.addEventListener('click', closeMobileNav);
if (mobileNav) {
  mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileNav));
}

/* ---------------- typed terminal line ---------------- */
function typeOut(el, text, speed = 90) {
  if (!el) return;
  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }
  let i = 0;
  el.textContent = '';
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}
typeOut(document.getElementById('typedWhoami'), 'whoami');

/* ---------------- rotating role word ---------------- */
const roleWordEl = document.getElementById('roleWord');
const roles = ['cs student', 'builder', 'gamer at heart', 'future data scientist'];
let roleIndex = 0;

function cycleRole() {
  if (!roleWordEl) return;
  roleIndex = (roleIndex + 1) % roles.length;
  roleWordEl.style.opacity = '0';
  setTimeout(() => {
    roleWordEl.textContent = roles[roleIndex];
    roleWordEl.style.opacity = '1';
  }, 250);
}

if (roleWordEl) {
  roleWordEl.style.transition = 'opacity 0.25s ease';
  if (!prefersReducedMotion) setInterval(cycleRole, 2600);
}

/* ---------------- project expand/collapse ---------------- */
document.querySelectorAll('.project-card[data-expanded]').forEach((card) => {
  const btn = card.querySelector('.expand-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const expanded = card.getAttribute('data-expanded') === 'true';
    card.setAttribute('data-expanded', String(!expanded));
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.textContent = expanded ? 'see more' : 'close';
  });
});

/* ---------------- reveal on scroll ---------------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------------- scroll dots active state ---------------- */
const sections = ['top', 'about', 'projects', 'contact']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const dots = document.querySelectorAll('.scroll-dots .dot');

if ('IntersectionObserver' in window && dots.length) {
  const dotObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          dots.forEach((d) => d.classList.toggle('is-active', d.dataset.section === id));
        }
      });
    },
    { threshold: 0.5 }
  );
  sections.forEach((s) => dotObserver.observe(s));
}

/* ---------------- footer year ---------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
