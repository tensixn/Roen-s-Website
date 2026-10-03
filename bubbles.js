(function () {
  const toggleBtn = document.getElementById('bubbleToggle');
  const wand = document.getElementById('bubbleWand');
  const meter = document.getElementById('bubbleMeter');
  const meterFill = document.getElementById('bubbleMeterFill');
  const meterCount = document.getElementById('bubbleMeterCount');
  const totalEl = document.getElementById('bubbleTotal');
  const totalCountEl = document.getElementById('bubbleTotalCount');
  const pool = document.getElementById('bubblePool');
  const milestone = document.getElementById('bubbleMilestone');
  const milestoneBubble = document.getElementById('bubbleMilestoneBubble');
  const milestoneBackdrop = document.getElementById('bubbleMilestoneBackdrop');
  const milestoneNum = document.getElementById('bubbleMilestoneNum');
  const live = document.getElementById('bubbleLive');

  if (!toggleBtn) return;

  const MAX_RESOURCE = 15;
  const REFILL_AMOUNT = 20;
  const MAX_ON_SCREEN = 45;
  const MILESTONE_STEP = 10;

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = false;
  let resource = MAX_RESOURCE;
  let onScreen = 0;
  let lastSpawn = 0;
  // storage can be blocked (private mode, hardened settings); the toy still works without it
  const popStore = {
    get() { try { return parseInt(localStorage.getItem('roen_bubble_pops') || '0', 10) || 0; } catch (e) { return 0; } },
    set(n) { try { localStorage.setItem('roen_bubble_pops', String(n)); } catch (e) { /* blocked */ } }
  };
  let totalPopped = popStore.get();
  let nextMilestone = (Math.floor(totalPopped / MILESTONE_STEP) + 1) * MILESTONE_STEP;

  totalCountEl.textContent = totalPopped;

  /* ---------- sound synthesis (no audio files) ---------- */
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // browsers suspend audio contexts until a user gesture — the toggle click
    // and every pop are gestures, so resume opportunistically here
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playPop(big = false) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startFreq = big ? 320 : 520 + Math.random() * 180;
      const endFreq = big ? 90 : 140 + Math.random() * 60;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + (big ? 0.28 : 0.09));
      gain.gain.setValueAtTime(big ? 0.35 : 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (big ? 0.3 : 0.1));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (big ? 0.32 : 0.12));
    } catch (e) { /* audio unavailable, fail silently */ }
  }

  function playRefill() {
    try {
      const ctx = getCtx();
      [0, 0.08, 0.16].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + i * 120, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.16);
      });
    } catch (e) { /* fail silently */ }
  }

  /* ---------- resource meter UI ---------- */
  function updateMeter() {
    const pct = Math.max(0, Math.min(1, resource / MAX_RESOURCE));
    meterFill.style.transform = `scaleX(${pct})`;
    meterFill.classList.toggle('is-low', pct <= 0.2);
    meterCount.textContent = Math.round(resource);
    wand.classList.toggle('is-empty', resource <= 0);
    pool.classList.toggle('is-full', resource >= MAX_RESOURCE);
  }

  /* ---------- spawning bubbles ---------- */
  function spawnBubble(x, y, opts = {}) {
    if (onScreen >= MAX_ON_SCREEN) return;
    const size = opts.size || (10 + Math.random() * 22);
    const el = document.createElement('div');
    el.className = 'bubble';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    const drift = (Math.random() - 0.5) * 90;
    el.style.setProperty('--driftX', drift + 'px');
    const duration = 2.4 + Math.random() * 1.6;
    el.style.animationDuration = duration + 's';
    // reduced motion: no rise/fade loop, the bubble just holds still until popped
    if (reducedMotion) el.classList.add('is-still');

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      popBubble(el);
    });

    document.body.appendChild(el);
    onScreen++;

    // only schedule the lifetime removal when the bubble actually animates away
    if (!reducedMotion) {
      setTimeout(() => {
        if (el.parentNode && !el.classList.contains('is-popping')) {
          el.remove();
          onScreen--;
        }
      }, duration * 1000 + 50);
    }
  }

  function popBubble(el) {
    if (el.classList.contains('is-popping') || el.classList.contains('is-still-popped')) return;
    el.classList.add('is-popping');
    playPop(false);
    totalPopped++;
    totalCountEl.textContent = totalPopped;
    popStore.set(totalPopped);
    setTimeout(() => {
      el.remove();
      onScreen--;
    }, 200);

    if (totalPopped >= nextMilestone) {
      showMilestone(nextMilestone);
      nextMilestone += MILESTONE_STEP;
    }
  }

  let focusBeforeMilestone = null;

  function showMilestone(count) {
    milestoneNum.textContent = count;
    if (live) live.textContent = count + ' bubbles popped. Press Enter to pop the milestone bubble, or Escape to dismiss.';
    focusBeforeMilestone = document.activeElement;
    milestone.style.display = 'flex';
    milestoneBubble.focus();
    // retrigger the entrance animation each time
    milestoneBubble.classList.remove('is-popping', 'is-entering');
    void milestoneBubble.offsetWidth;
    milestoneBubble.classList.add('is-entering');
  }

  function hideMilestone() {
    milestone.style.display = 'none';
    milestoneBubble.classList.remove('is-popping', 'is-entering');
    if (focusBeforeMilestone && focusBeforeMilestone.focus) focusBeforeMilestone.focus();
  }

  function popMilestone() {
    playPop(true);
    milestoneBubble.classList.add('is-popping');
    setTimeout(hideMilestone, 260);
  }

  milestoneBubble.addEventListener('click', popMilestone);

  // backdrop button dismisses without popping the bubble
  if (milestoneBackdrop) {
    milestoneBackdrop.addEventListener('click', hideMilestone);
  }

  /* ---------- wand tracking + spawn-on-move ---------- */
  function spawnFromPointer(x, y) {
    const now = performance.now();
    if (resource > 0 && now - lastSpawn > 90) {
      lastSpawn = now;
      resource -= 1;
      spawnBubble(x, y - 10);
      updateMeter();
      if (resource <= 0 && live) live.textContent = 'Out of liquid. Dip the wand in the pool to refill.';
    }
  }

  function onMouseMove(e) {
    wand.style.transform = `translate(${e.clientX - 8}px, ${e.clientY - 30}px)`;
    spawnFromPointer(e.clientX, e.clientY);
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    if (!t) return;
    // no wand cursor on touch — the tap position is enough
    spawnFromPointer(t.clientX, t.clientY);
  }

  function onScroll() {
    if (resource <= 0) return;
    const now = performance.now();
    if (now - lastSpawn > 140) {
      lastSpawn = now;
      resource -= 1;
      spawnBubble(window.innerWidth * (0.2 + Math.random() * 0.6), window.innerHeight * 0.85);
      updateMeter();
    }
  }

  /* ---------- event bubbling bonus: clicking things spawns bonus bubbles ---------- */
  function onDocumentClick(e) {
    if (!active) return;
    if (e.target.closest('#bubblePool, #bubbleWand, .bubble, #bubbleMilestone')) return;
    if (e.target.closest('a, button')) {
      const burst = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burst; i++) {
        setTimeout(() => {
          spawnBubble(
            e.clientX + (Math.random() - 0.5) * 30,
            e.clientY + (Math.random() - 0.5) * 30,
            { size: 8 + Math.random() * 14 }
          );
        }, i * 40);
      }
    }
  }

  /* ---------- pool refill ---------- */
  function refill() {
    resource = Math.min(MAX_RESOURCE, resource + REFILL_AMOUNT);
    updateMeter();
    playRefill();
  }

  pool.addEventListener('dblclick', refill);
  pool.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refill(); }
  });

  // single tap refills too on touch devices — dblclick is unreliable there
  if (isTouch) {
    pool.addEventListener('click', (e) => {
      e.stopPropagation();
      refill();
    });
  }

  /* ---------- activate / deactivate ---------- */
  function activate() {
    active = true;
    document.body.classList.add('bubble-wand-active');
    wand.style.display = 'block';
    meter.style.display = 'flex';
    totalEl.style.display = 'block';
    pool.style.display = 'flex';
    toggleBtn.textContent = '🫧 deactivate bubble wand';
    toggleBtn.setAttribute('aria-pressed', 'true');
    updateMeter();
    getCtx(); // unlock audio inside the user gesture
    if (!isTouch) window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    // taps blow bubbles; swiping is left to the page so scrolling is never blocked
    if (isTouch) window.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('click', onDocumentClick);
  }

  function deactivate() {
    active = false;
    document.body.classList.remove('bubble-wand-active');
    wand.style.display = 'none';
    meter.style.display = 'none';
    totalEl.style.display = 'none';
    pool.style.display = 'none';
    toggleBtn.textContent = '🫧 activate bubble wand';
    toggleBtn.setAttribute('aria-pressed', 'false');
    if (!isTouch) window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('scroll', onScroll);
    if (isTouch) window.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('click', onDocumentClick);
  }

  toggleBtn.addEventListener('click', () => {
    if (active) deactivate();
    else activate();
  });

  // the HUD (meter, pool, count) is hidden on small screens, so the wand can't run there
  window.matchMedia('(max-width: 640px)').addEventListener('change', (e) => {
    if (e.matches && active) deactivate();
  });

  const milestoneOpen = () => milestone.style.display !== 'none';

  document.addEventListener('keydown', (e) => {
    if (milestoneOpen()) {
      if (e.key === 'Escape') hideMilestone();
      else if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement === milestoneBubble) { e.preventDefault(); popMilestone(); } }
      else if (e.key === 'Tab') {
        // keep focus on the two controls inside the milestone dialog
        e.preventDefault();
        (document.activeElement === milestoneBubble ? milestoneBackdrop : milestoneBubble).focus();
      }
      return;
    }
    if (!active) return;
    if (e.key === 'Escape') { deactivate(); return; }
    // keyboard route to the toy, so it is not mouse-only; typing in a field is left alone
    if (e.target.closest('input, textarea, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'b' && resource > 0) {
      resource -= 1;
      spawnBubble(window.innerWidth * (0.25 + Math.random() * 0.5), window.innerHeight * (0.5 + Math.random() * 0.3));
      updateMeter();
      if (resource <= 0 && live) live.textContent = 'Out of liquid. Press R to refill.';
    } else if (k === 'p') {
      const target = document.querySelector('.bubble:not(.is-popping)');
      if (target) popBubble(target);
    } else if (k === 'r') {
      refill();
    }
  });
})();
