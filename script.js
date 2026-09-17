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

    // little pulse ring on the toggle + gently settle the background particles
    const track = themeToggle.querySelector('.theme-toggle-track');
    if (track) {
      track.classList.remove('is-pulsing');
      void track.offsetWidth;
      track.classList.add('is-pulsing');
    }
    const bgFx = document.getElementById('bgEffects');
    if (bgFx && !prefersReducedMotion) {
      bgFx.classList.add('is-switching');
      setTimeout(() => bgFx.classList.remove('is-switching'), 600);
    }
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

  // gentle parallax — particles drift at a slightly different rate than the page
  if (!isMobileViewport()) {
    const speeds = [];
    const particleEls = bgEffects.querySelectorAll('.particle');
    particleEls.forEach((p) => speeds.push(0.4 + Math.random() * 0.5)); // 40–90% of scroll speed
    let parallaxTicking = false;
    window.addEventListener('scroll', () => {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        particleEls.forEach((p, i) => {
          p.style.translate = '0 ' + (-y * speeds[i] * 0.08) + 'px';
        });
        parallaxTicking = false;
      });
    }, { passive: true });
  }

  // occasional shooting star in dark mode
  if (!prefersReducedMotion && document.documentElement.getAttribute('data-theme') !== 'light') {
    const spawnShootingStar = () => {
      if (document.documentElement.getAttribute('data-theme') === 'light') return;
      const s = document.createElement('div');
      s.className = 'shooting-star';
      s.style.left = (20 + Math.random() * 70) + 'vw';
      s.style.top = (5 + Math.random() * 30) + 'vh';
      s.style.setProperty('--angle', (18 + Math.random() * 24) + 'deg');
      s.style.setProperty('--dx', (200 + Math.random() * 220) + 'px');
      s.style.setProperty('--dy', (100 + Math.random() * 120) + 'px');
      bgEffects.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    };
    setTimeout(spawnShootingStar, 4000 + Math.random() * 6000);
    setInterval(() => { if (Math.random() < 0.5) spawnShootingStar(); }, 9000);
  }
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
}

/* ---------------- floating/column/center social icons ---------------- */
const socialIconEls = document.querySelectorAll('.social-icon');

if (socialIconEls.length) {
  const FLOAT_SPOTS = [
    { xVw: 12, yVh: 24 },
    { xVw: 84, yVh: 40 },
    { xVw: 18, yVh: 70 }
  ];

  const isMobile = () => window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;

  function setIconState(state, instant) {
    socialIconEls.forEach((icon) => {
      icon.classList.toggle('is-floating', state === 'floating');
      icon.style.zIndex = '60';
      // floating/column stay pinned to the viewport; center is anchored to
      // the button's position in the page, so it scrolls with the content
      // and doesn't need to be re-measured on every scroll event
      icon.style.position = (state === 'center') ? 'absolute' : 'fixed';
      // on mobile, only show the icons once they've locked into the
      // end/center state — hidden during both floating and column
      icon.style.display = (state !== 'center' && isMobile()) ? 'none' : '';
      icon.style.transition = instant ? 'none' : '';
    });

    const centerAnchor = state === 'center'
      ? document.querySelector('.contact-cta')
      : null;
    const anchorRect = centerAnchor ? centerAnchor.getBoundingClientRect() : null;

    socialIconEls.forEach((icon, i) => {
      if (state === 'floating') {
        const spot = FLOAT_SPOTS[i % FLOAT_SPOTS.length];
        icon.style.left = spot.xVw + 'vw';
        icon.style.top = spot.yVh + 'vh';
      } else if (state === 'column') {
        const spacing = 58;
        const startY = window.innerHeight / 2 - ((socialIconEls.length - 1) * spacing) / 2;
        icon.style.left = '24px';
        icon.style.top = (startY + i * spacing) + 'px';
      } else if (state === 'center') {
        const spacing = 60;
        if (anchorRect) {
          // sit in a row just below the send-message button, in document
          // coordinates so it stays put as the page is scrolled
          const startX = anchorRect.left + anchorRect.width / 2 - ((socialIconEls.length - 1) * spacing) / 2;
          const rowTop = anchorRect.bottom + 32;
          icon.style.left = (startX + i * spacing + window.scrollX) + 'px';
          icon.style.top = (rowTop + window.scrollY) + 'px';
        } else {
          icon.style.left = (window.innerWidth / 2 + window.scrollX) + 'px';
          icon.style.top = (window.innerHeight * 0.6 + window.scrollY) + 'px';
        }
      }
    });

    if (instant) {
      void socialIconEls[0].offsetHeight; // force reflow so the instant move is committed
      requestAnimationFrame(() => {
        socialIconEls.forEach((icon) => { icon.style.transition = ''; });
      });
    }
  }

  let currentIconState = 'floating';
  setIconState('floating', true);

  const topSection = document.getElementById('top');
  const aboutSection = document.getElementById('about');
  const projectsSection = document.getElementById('projects');
  const contactSection = document.getElementById('contact');

  if ('IntersectionObserver' in window && topSection && aboutSection && contactSection) {
    const iconObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          let nextState;
          if (entry.target.id === 'top') nextState = 'floating';
          else if (entry.target.id === 'contact') nextState = 'center';
          else nextState = 'column';

          if (nextState !== currentIconState) {
            currentIconState = nextState;
            setIconState(nextState, false);
            // quick ripple at each icon's position to sell the state jump
            if (!prefersReducedMotion) {
              socialIconEls.forEach((icon) => {
                const r = icon.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'icon-ripple';
                ripple.style.left = (r.left + r.width / 2 - 6) + 'px';
                ripple.style.top = (r.top + r.height / 2 - 6) + 'px';
                document.body.appendChild(ripple);
                setTimeout(() => ripple.remove(), 750);
              });
            }
          }
        });
      },
      { threshold: 0, rootMargin: '-50% 0px -50% 0px' }
    );
    iconObserver.observe(topSection);
    iconObserver.observe(aboutSection);
    if (projectsSection) iconObserver.observe(projectsSection);
    iconObserver.observe(contactSection);
  }

  window.addEventListener('resize', () => setIconState(currentIconState, true));
}

/* ---------------- contact form (Formspree) ---------------- */
const contactForm = document.getElementById('contactForm');
const contactFormStatus = document.getElementById('contactFormStatus');

if (contactForm && contactFormStatus) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    contactFormStatus.textContent = 'sending…';
    contactFormStatus.className = 'contact-form-status';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactFormStatus.textContent = 'message sent — thanks, I\'ll get back to you soon.';
        contactFormStatus.classList.add('is-success');
        contactForm.reset();
      } else {
        throw new Error('non-200 response');
      }
    } catch (err) {
      contactFormStatus.textContent = 'something went wrong — email me directly at neorwoes@gmail.com instead.';
      contactFormStatus.classList.add('is-error');
      contactForm.classList.remove('is-shake');
      void contactForm.offsetWidth;
      contactForm.classList.add('is-shake');
    } finally {
      submitBtn.disabled = false;
    }
  });
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

// decode effect for the section headings (h2s scramble in like a terminal)
const GLYPHS = '01<>/_{}[]$#';

function decodeText(el) {
  if (!el || el.dataset.decoded) return;
  el.dataset.decoded = '1';
  const finalText = el.textContent;
  const duration = 500;
  const start = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(t * finalText.length);
    let out = finalText.slice(0, revealed);
    for (let i = revealed; i < finalText.length; i++) {
      out += finalText[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = finalText;
  }
  requestAnimationFrame(frame);
}

const decodeObserver = 'IntersectionObserver' in window && !prefersReducedMotion
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          decodeText(entry.target);
          decodeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 })
  : null;

document.querySelectorAll('.section-head h2').forEach((h) => {
  if (decodeObserver) decodeObserver.observe(h);
  else h.dataset.decoded = '1';
});

// mark the page as loaded so the hero elements cascade in.
// if the intro is playing, wait until the name lands so the cascade reads as
// a continuation of the intro; otherwise fire as soon as the page is ready.
let heroRevealed = false;
function markLoaded() {
  if (heroRevealed) return;
  heroRevealed = true;
  document.body.classList.add('is-loaded');
}

function isLoaderPlaying() {
  return loader
    && !sessionStorage.getItem('roen_intro_seen')
    && !loader.classList.contains('is-hidden');
}

if (isLoaderPlaying()) {
  loader.addEventListener('transitionend', (e) => {
    if (e.target === loader) markLoaded();
  });
  // safety net if the transitionend never fires (skip click, reduced motion, etc.)
  setTimeout(markLoaded, 4500);
} else {
  if (document.readyState === 'complete') {
    markLoaded();
  } else {
    window.addEventListener('load', markLoaded);
    setTimeout(markLoaded, 2500);
  }
}

function flipNameToHero() {
  if (!loaderName || !heroHeadingEl) { hideLoader(); return; }

  const startRect = loaderName.getBoundingClientRect();
  const endRect = heroHeadingEl.getBoundingClientRect();
  const targetFontSize = window.getComputedStyle(heroHeadingEl).fontSize;

  // lock in the current visual position/size as explicit px values,
  // swapping off the translate(-50%,-50%) centering trick with no visual change
  loaderName.style.transition = 'none';
  loaderName.style.left = startRect.left + 'px';
  loaderName.style.top = startRect.top + 'px';
  loaderName.style.transform = 'none';

  // iOS Safari doesn't reliably pick up a style change forced via a single
  // offsetHeight reflow before the next mutation — double rAF guarantees the
  // "before" state is actually painted first, so the transition below plays
  // instead of silently no-opping and jump-cutting to the fallback below
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loaderName.classList.add('is-flying');
      loaderName.style.transition = ''; // hand control back to the .is-flying transition rule

      // now animate to the real target's exact position and exact font-size
      loaderName.style.left = endRect.left + 'px';
      loaderName.style.top = endRect.top + 'px';
      loaderName.style.fontSize = targetFontSize;
    });
  });

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
  setTimeout(land, 1500);
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

/* ---------------- project cards: staggered entrance ---------------- */
const projectList = document.querySelector('.project-list');
if (projectList && !prefersReducedMotion) {
  projectList.setAttribute('data-reveal-group', '');
  // the empty "more coming" card shouldn't be part of the stagger ordering issue,
  // CSS handles delays via nth-child, nothing to do here beyond opting in
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
  roleWordEl.classList.remove('is-swapping');
  void roleWordEl.offsetWidth;
  roleWordEl.classList.add('is-swapping');
  setTimeout(() => {
    roleWordEl.textContent = roles[roleIndex];
  }, 240);
}

if (roleWordEl) {
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
const revealEls = document.querySelectorAll('.reveal, [data-reveal-group]');
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

/* ---------------- scroll progress bar ---------------- */
const progressBar = document.querySelector('.scroll-progress');
if (progressBar && !prefersReducedMotion) {
  let progressTicking = false;
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    progressTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (progressTicking) return;
    progressTicking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();
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
