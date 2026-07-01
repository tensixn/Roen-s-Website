// ---- typed terminal line in hero ----
const typedEl = document.getElementById('typed');
const phrase = 'whoami';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function typeOut(el, text, speed = 90) {
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

if (typedEl) typeOut(typedEl, phrase);

// ---- project card expand/collapse ----
document.querySelectorAll('.project-card[data-expanded]').forEach((card) => {
  const btn = card.querySelector('.expand-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const expanded = card.getAttribute('data-expanded') === 'true';
    card.setAttribute('data-expanded', String(!expanded));
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.textContent = expanded ? 'cat readme.md >' : 'close';
  });
});

// ---- footer year ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
