const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------------- theme toggle ---------------- */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggle.setAttribute('aria-checked', String(isLight));
  }
  updateThemeIcon();
  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('roen_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('roen_theme', 'light');
    }
    updateThemeIcon();
  });
}

/* ---------------- ambient background particles (stars in dark, dust in light) ---------------- */
const bgEffects = document.getElementById('bgEffects');
if (bgEffects && !prefersReducedMotion) {
  const PARTICLE_COUNT = 30;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 1 + Math.random() * 2.2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = Math.random() * 100 + 'vh';
    p.style.setProperty('--dur', (3 + Math.random() * 5) + 's');
    p.style.setProperty('--delay', (Math.random() * 6) + 's');
    p.style.setProperty('--maxOpacity', (0.25 + Math.random() * 0.45).toFixed(2));
    bgEffects.appendChild(p);
  }
}

/* ---------------- intro loader ---------------- */
const loader = document.getElementById('loader');
const skipBtn = document.getElementById('skipBtn');
const bootLines = document.getElementById('bootLines');
const loaderName = document.getElementById('loaderName');
const heroHeadingEl = document.getElementById('heroHeading');

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
  if (!loaderName || !heroHeadingEl) { hideLoader(); return; }

  const startRect = loaderName.getBoundingClientRect();
  const endRect = heroHeadingEl.getBoundingClientRect();
  const targetFontSize = window.getComputedStyle(heroHeadingEl).fontSize;

  // lock in the current visual position/size as explicit px values,
  // swapping off the translate(-50%,-50%) centering trick with no visual change
  loaderName.style.left = startRect.left + 'px';
  loaderName.style.top = startRect.top + 'px';
  loaderName.style.transform = 'none';
  void loaderName.offsetHeight; // force reflow so this swap is committed before the transition starts

  loaderName.classList.add('is-flying');
  void loaderName.offsetHeight; // force reflow so the transition engages before the next values apply

  // now animate to the real target's exact position and exact font-size
  loaderName.style.left = endRect.left + 'px';
  loaderName.style.top = endRect.top + 'px';
  loaderName.style.fontSize = targetFontSize;

  let landed = false;
  function land() {
    if (landed) return;
    landed = true;
    loaderName.classList.add('is-landed');
    hideLoader();
  }
  loaderName.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName !== 'font-size') return;
    loaderName.removeEventListener('transitionend', onEnd);
    land();
  });
  // fallback in case transitionend doesn't fire for any reason
  setTimeout(land, 1300);
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

    const autoHide = setTimeout(hideLoader, bootDuration + 2500);
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
