const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
/* ---------------- theme toggle ---------------- */
const themeToggle = document.getElementById('themeToggle');

// single place where the theme actually flips, so every entry point
// (toggle button, playground `theme` command) stays in sync
function setTheme(mode) {
  if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    // persist, but don't crash when storage is blocked (private mode etc.)
    try { localStorage.setItem('roen_theme', 'light'); } catch (e) { /* blocked */ }
  } else {
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('roen_theme', 'dark'); } catch (e) { /* blocked */ }
  }
  updateThemeToggleState();
  // let other pages/scripts react (the terminal prints the new mode)
  document.dispatchEvent(new CustomEvent('roen:themechange', { detail: { theme: mode } }));
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function updateThemeToggleState() {
  if (themeToggle) themeToggle.setAttribute('aria-checked', String(currentTheme() === 'light'));
}

// the new theme opens as a circle from the toggle, so the change reads as the room
// lighting up (or dimming) from where you clicked; plain swap when unsupported or reduced motion
let themeSwitching = false;
function switchTheme(next) {
  if (!document.startViewTransition || prefersReducedMotion || themeSwitching) { setTheme(next); return; }
  const r = themeToggle.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const root = document.documentElement;
  themeSwitching = true;
  root.classList.add('theme-vt');
  const t = document.startViewTransition(() => setTheme(next));
  t.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
    );
  }).catch(() => {});
  t.finished.finally(() => { themeSwitching = false; root.classList.remove('theme-vt'); });
}

if (themeToggle) {
  updateThemeToggleState();
  themeToggle.addEventListener('click', () => {
    switchTheme(currentTheme() === 'light' ? 'dark' : 'light');

    // little pulse ring on the toggle
    const track = themeToggle.querySelector('.theme-toggle-track');
    if (track) {
      track.classList.remove('is-pulsing');
      void track.offsetWidth;
      track.classList.add('is-pulsing');
    }
  });
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
}

/* ---------------- topbar elevation ---------------- */
/* the topbar picks up a solid border + shadow once the page scrolls, so it
   separates from content instead of floating invisibly over it */
const topbar = document.querySelector('.topbar');
if (topbar) {
  let topbarTicking = false;
  const updateTopbar = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 12);
    topbarTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (topbarTicking) return;
    topbarTicking = true;
    requestAnimationFrame(updateTopbar);
  }, { passive: true });
  updateTopbar();
}

/* ---------------- floating/column/center social icons ---------------- */
const socialIconEls = document.querySelectorAll('.social-icon');

if (socialIconEls.length) {
  const FLOAT_SPOTS = [
    { xVw: 12, yVh: 24 },
    { xVw: 84, yVh: 40 },
    { xVw: 18, yVh: 70 }
  ];

  // 980px: below that the left-edge column would sit on top of the content
  const isMobile = () => window.matchMedia('(max-width: 980px), (pointer: coarse)').matches;

  function setIconState(state, instant) {
    socialIconEls.forEach((icon) => {
      icon.classList.toggle('is-floating', state === 'floating');
      icon.style.zIndex = '60';
      // floating/column stay pinned to the viewport; center is anchored to
      // the button's position in the page, so it scrolls with the content
      // and doesn't need to be re-measured on every scroll event
      icon.style.position = (state === 'center') ? 'absolute' : 'fixed';
      // on mobile, only show the icons once they've locked into the
      // end/center state - hidden during both floating and column
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
  const SUBMIT_LABEL = 'send message';
  const PLACEHOLDER_IDS = ['YOUR_FORM_ID', 'FORM_ID', 'XXXXXXX'];

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // form isn't hooked up to a real Formspree endpoint yet - fail fast with
    // instructions instead of a confusing network error
    if (PLACEHOLDER_IDS.some((id) => contactForm.action.includes(id))) {
      contactFormStatus.textContent = 'form isn\'t wired up yet - the site owner still needs to add a Formspree form ID. email me directly at neorwoes@gmail.com instead.';
      contactFormStatus.className = 'contact-form-status is-error';
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const ctaLabel = submitBtn.querySelector('.cta-label');
    submitBtn.disabled = true;
    if (ctaLabel) ctaLabel.textContent = 'sending…';
    contactFormStatus.textContent = 'sending…';
    contactFormStatus.className = 'contact-form-status';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactFormStatus.textContent = 'message sent - thanks, I\'ll get back to you soon.';
        contactFormStatus.className = 'contact-form-status is-success';
        contactForm.reset();
        // the button itself confirms: label swaps to a check, border goes sage
        submitBtn.classList.add('is-success');
        if (ctaLabel) ctaLabel.textContent = 'sent ✓';
        setTimeout(() => {
          submitBtn.classList.remove('is-success');
          if (ctaLabel) ctaLabel.textContent = SUBMIT_LABEL;
        }, 2600);
      } else {
        // Formspree returns JSON errors ({ errors: [...] }) with useful reasons
        // (validation, rate limit, disabled form…) - surface them if we can
        let reason = '';
        try {
          const data = await response.json();
          if (data && Array.isArray(data.errors) && data.errors.length) {
            reason = ' (' + data.errors.map((er) => er.message || String(er)).join('; ') + ')';
          }
        } catch (_) { /* non-JSON body - ignore */ }
        if (response.status === 429) reason = ' (too many attempts, try again later)';
        contactFormStatus.textContent = 'didn\'t go through' + reason + ' - email me directly at neorwoes@gmail.com instead.';
        contactFormStatus.className = 'contact-form-status is-error';
        contactForm.classList.remove('is-shake');
        void contactForm.offsetWidth;
        contactForm.classList.add('is-shake');
      }
    } catch (err) {
      contactFormStatus.textContent = 'something went wrong - email me directly at neorwoes@gmail.com instead.';
      contactFormStatus.className = 'contact-form-status is-error';
      contactForm.classList.remove('is-shake');
      void contactForm.offsetWidth;
      contactForm.classList.add('is-shake');
    } finally {
      submitBtn.disabled = false;
      if (!submitBtn.classList.contains('is-success') && ctaLabel) ctaLabel.textContent = SUBMIT_LABEL;
    }
  });
}

// decode effect for the section headings (h2s flip through letters like the counter)
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz';

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

// mark the page as loaded so the hero elements cascade in
let heroRevealed = false;
function markLoaded() {
  if (heroRevealed) return;
  heroRevealed = true;
  document.body.classList.add('is-loaded');
  document.dispatchEvent(new CustomEvent('hero:loaded'));
}

if (document.readyState === 'complete') {
  markLoaded();
} else {
  window.addEventListener('load', markLoaded);
  setTimeout(markLoaded, 2500);
}

/* ---------------- mobile nav ---------------- */
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const mobileNav = document.getElementById('mobileNav');

let lastFocused = null;
function openMobileNav() {
  lastFocused = document.activeElement;
  mobileNav.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  menuToggle.setAttribute('aria-expanded', 'true');
  menuClose.focus();
}
function closeMobileNav() {
  mobileNav.classList.remove('is-open');
  document.body.style.overflow = '';
  menuToggle.setAttribute('aria-expanded', 'false');
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
// playground page has no mobile nav - guard against null
document.addEventListener('keydown', (e) => {
  if (!mobileNav || !mobileNav.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeMobileNav();
  if (e.key === 'Tab') {
    // keep focus inside the open menu
    const items = [menuClose, ...mobileNav.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
if (menuClose) menuClose.addEventListener('click', closeMobileNav);
if (mobileNav) {
  mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileNav));
}

/* ---------------- rolling counter (hero) ---------------- */
// eight drum tiles that roll through a few words; each word has a line under it.
// the drum is decorative (aria-hidden) - the line and the h1 carry the meaning.
const counterEl = document.getElementById('counter');
if (counterEl) {
  const WIDTH = 8;
  const REEL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // dd.mm.yy in Singapore time, same zone as the topbar clock
  const sgDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore', day: '2-digit', month: '2-digit', year: '2-digit'
  }).format(new Date()).replace(/\//g, '.');
  const FRAMES = [
    { word: 'HI, ROEN', line: "hello, i'm roen, a <em>cs student</em> at NTU." },
    { word: sgDate, line: 'today is a good day to <em>build</em> something.' },
    { word: 'SWE.SOON', line: 'working towards being a <em>software engineer</em>.' },
    { word: 'GAMER', line: 'off the clock, a <em>gamer</em>, gym goer, football fan and mahjong enjoyer.' },
    { word: 'HIRE ME?', line: 'open to <em>internships</em> and collab projects.' }
  ];
  const fit = (w) => {
    const left = Math.floor((WIDTH - w.length) / 2);
    return (' '.repeat(left) + w).padEnd(WIDTH, ' ');
  };
  const randChar = () => REEL[Math.floor(Math.random() * REEL.length)];
  const lineEl = document.getElementById('counterLine');
  const indexEl = document.getElementById('counterIndex');
  const totalEl = document.getElementById('counterTotal');
  const pipsEl = document.getElementById('counterPips');
  const pad2 = (n) => String(n).padStart(2, '0');

  // each tile shows the char at strip index 1, with a neighbour peeking above and below
  const tiles = [];
  for (let i = 0; i < WIDTH; i++) {
    const tile = document.createElement('span');
    tile.className = 'counter-tile';
    const strip = document.createElement('span');
    strip.className = 'counter-strip';
    tile.appendChild(strip);
    counterEl.appendChild(tile);
    tiles.push({ strip, char: randChar(), anim: null });
  }

  function setStrip(t, chars, at) {
    t.strip.innerHTML = '';
    chars.forEach((c) => {
      const ch = document.createElement('span');
      ch.className = 'counter-ch';
      ch.textContent = c;
      t.strip.appendChild(ch);
    });
    t.strip.style.transform = `translateY(${-at * rowHeight()}px)`;
  }
  const rowHeight = () => tiles[0].strip.firstChild ? tiles[0].strip.firstChild.offsetHeight : 0;
  const settle = (t, c) => { t.char = c; setStrip(t, [randChar(), c, randChar()], 1); };

  tiles.forEach((t) => settle(t, t.char));

  function rollTile(t, i, target) {
    if (t.anim) t.anim.cancel();
    if (prefersReducedMotion) { settle(t, target); return; }
    // later tiles travel further and land later, so the word resolves left to right
    const steps = 7 + i * 2;
    const chars = [randChar(), t.char];
    for (let k = 0; k < steps; k++) chars.push(randChar());
    chars.push(target, randChar());
    setStrip(t, chars, 1);
    const row = rowHeight();
    t.anim = t.strip.animate([
      { transform: `translateY(${-row}px)`, filter: 'blur(0)' },
      { filter: 'blur(1.6px)', offset: 0.35 },
      { transform: `translateY(${-(steps + 2) * row}px)`, filter: 'blur(0)' }
    ], {
      duration: 760 + i * 80,
      delay: i * 35,
      easing: 'cubic-bezier(0.35, 0, 0.2, 1.12)',
      fill: 'forwards'
    });
    t.anim.finished.then(() => { t.anim.cancel(); t.anim = null; settle(t, target); }).catch(() => {});
  }

  let current = -1;
  let timer = null;
  let heroVisible = true;
  const pips = FRAMES.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'counter-pip';
    b.setAttribute('aria-label', `show line ${i + 1} of ${FRAMES.length}`);
    b.addEventListener('click', () => { show(i); schedule(); });
    pipsEl.appendChild(b);
    return b;
  });
  totalEl.textContent = pad2(FRAMES.length);

  function show(i) {
    if (i === current) return;
    current = i;
    const word = fit(FRAMES[i].word);
    tiles.forEach((t, k) => rollTile(t, k, word[k]));
    indexEl.textContent = pad2(i + 1);
    pips.forEach((p, k) => p.setAttribute('aria-current', String(k === i)));
    if (prefersReducedMotion) { lineEl.innerHTML = FRAMES[i].line; return; }
    lineEl.classList.add('is-swapping');
    setTimeout(() => {
      lineEl.innerHTML = FRAMES[i].line;
      lineEl.classList.remove('is-swapping');
    }, 420);
  }

  function schedule() {
    clearTimeout(timer);
    if (prefersReducedMotion || document.hidden || !heroVisible) return;
    timer = setTimeout(() => { show((current + 1) % FRAMES.length); schedule(); }, 3800);
  }

  // only run while someone can see it
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; schedule(); })
      .observe(counterEl);
  }

  // first roll doubles as the intro: random reels settle on the greeting
  const start = () => { show(0); schedule(); };
  if (document.body.classList.contains('is-loaded')) start();
  else document.addEventListener('hero:loaded', start, { once: true });

  // the row height comes from the webfont, so re-seat the reels once it loads
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => tiles.forEach((t) => { if (!t.anim) settle(t, t.char); }));
  }
}

/* ---------------- topbar clock ---------------- */
const clockEl = document.getElementById('topbarClock');
if (clockEl) {
  const clockFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const tick = () => { clockEl.textContent = 'SG ' + clockFmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
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

/* ---------------- cursor-following spotlight on project cards ----------------
   Each card gets --mx/--my updated on pointermove; a subtle radial glow
   follows the cursor inside the card (pointer:fine only, see CSS). */
const projectCards = document.querySelectorAll('.project-card');
if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches && projectCards.length) {
  projectCards.forEach((card) => {
    let raf = null;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
        raf = null;
      });
    });
  });
}

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

/* ---------------- scroll dots + topnav scroll-spy ----------------
   Sections are taller than the viewport, so a threshold-based observer
   never fires for them. Instead, pick the section whose top is closest to
   the viewport's focal point (a bit below the sticky topbar) on scroll. */
const sections = ['top', 'about', 'projects', 'contact']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const dots = document.querySelectorAll('.scroll-dots .dot');
const topnavLinks = document.querySelectorAll('.topnav a[href^="index.html#"], .topnav a[href^="#"]');

function updateActiveSection() {
  const focalY = window.scrollY + window.innerHeight * 0.35;
  let currentId = sections.length ? sections[0].id : null;
  // check sections in document order, keep the last one whose top we've passed
  for (const s of sections) {
    const top = s.getBoundingClientRect().top + window.scrollY;
    if (top <= focalY) currentId = s.id;
  }
  // at the very bottom of the page, force the contact section active
  const doc = document.documentElement;
  if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
    currentId = 'contact';
  }
  dots.forEach((d) => d.classList.toggle('is-active', d.dataset.section === currentId));
  topnavLinks.forEach((a) => {
    const hash = a.hash.replace(/^#/, '');
    a.classList.toggle('is-current', hash === currentId && a.pathname === window.location.pathname);
  });
}

// only spy on pages that actually have the index sections (playground has none,
// its current-page link is hardcoded with .is-current)
// runs directly in the handler (no rAF gate): it's a few rect reads and some
// class toggles, cheap enough, and can't starve if frames are throttled
if (sections.length) {
  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection);
  updateActiveSection();
}

/* ---------------- footer year ---------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
