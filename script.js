const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------------- intro loader ---------------- */
const loader = document.getElementById('loader');
const skipBtn = document.getElementById('skipBtn');
const bootLines = document.getElementById('bootLines');
const loaderName = document.getElementById('loaderName');
const heroNameTarget = document.getElementById('heroNameTarget');

const BOOT_SEQUENCE = [
  '<span class="boot-prompt">$</span> booting roen@ntu<span class="boot-cursor">▌</span>',
  '<span class="boot-ok">[ok]</span> loading coursework cache',
  '<span class="boot-ok">[ok]</span> compiling projects',
  '<span class="boot-ok">[ok]</span> connecting to caffeine supply',
  '<span class="boot-ok">[ok]</span> mounting portfolio at ~/',
  'welcome.'
];

function hideLoader() {
  if (!loader) return;
  loader.classList.add('is-hidden');
  sessionStorage.setItem('roen_intro_seen', '1');
}

function flipNameToHero() {
  if (!loaderName || !heroNameTarget) { hideLoader(); return; }

  const startRect = loaderName.getBoundingClientRect();
  const endRect = heroNameTarget.getBoundingClientRect();

  const scale = endRect.height / startRect.height;
  const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
  const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

  loaderName.classList.add('is-flying');
  void loaderName.offsetHeight; // force reflow so the transition engages before the transform changes
  loaderName.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`;

  setTimeout(() => {
    loaderName.classList.add('is-landed');
    hideLoader();
  }, 700);
}

if (loader) {
  if (sessionStorage.getItem('roen_intro_seen')) {
    loader.classList.add('is-hidden');
  } else if (prefersReducedMotion) {
    BOOT_SEQUENCE.forEach((html) => {
      const line = document.createElement('p');
      line.className = 'boot-line is-visible';
      line.innerHTML = html;
      bootLines.appendChild(line);
    });
    const t = setTimeout(hideLoader, 300);
    skipBtn.addEventListener('click', () => { clearTimeout(t); hideLoader(); });
  } else {
    const timers = [];
    BOOT_SEQUENCE.forEach((html, i) => {
      const t = setTimeout(() => {
        const line = document.createElement('p');
        line.className = 'boot-line';
        line.innerHTML = html;
        bootLines.appendChild(line);
        requestAnimationFrame(() => line.classList.add('is-visible'));
      }, i * 260);
      timers.push(t);
    });

    const bootDuration = BOOT_SEQUENCE.length * 260;

    timers.push(setTimeout(() => {
      bootLines.style.transition = 'opacity 0.3s ease';
      bootLines.style.opacity = '0';
    }, bootDuration + 250));

    timers.push(setTimeout(() => {
      loaderName.classList.add('is-visible');
    }, bootDuration + 500));

    timers.push(setTimeout(flipNameToHero, bootDuration + 1050));

    const autoHide = setTimeout(hideLoader, bootDuration + 2200);
    timers.push(autoHide);

    skipBtn.addEventListener('click', () => {
      timers.forEach(clearTimeout);
      hideLoader();
    });
  }
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
const roles = ['cs student', 'gamer', 'future software engineer', 'football enthusiast', 'gym goer', 'mahjong enjoyer'];
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
