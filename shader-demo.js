/* shader demo — "Sapphire Glow Up" via the shaders package (createPreview) */
const canvas = document.getElementById('shaderCanvas');
const fallback = document.getElementById('shaderFallback');
const statusEl = document.getElementById('shaderStatus');
const controlsEl = document.getElementById('shaderControls');
const resetBtn = document.getElementById('shaderReset');
const randomBtn = document.getElementById('shaderRandom');

/* component_id -> tweakable props, defaults straight from the authored shader.
   ids verified against the decoded preview definition. */
const CONTROLS = [
  {
    id: 'sapphire-exposure', label: 'exposure', type: 'range',
    prop: 'exposure', min: 0, max: 16, step: 0.1, default: 8,
  },
  {
    id: 'sapphire-colorwheel', label: 'wheel scale', type: 'range',
    prop: 'scale', min: 0.5, max: 12, step: 0.1, default: 5.2,
  },
  {
    id: 'sapphire-colorwheel', label: 'wheel speed', type: 'range',
    prop: 'speed', min: -2, max: 2, step: 0.05, default: -0.25,
  },
  {
    id: 'sapphire-colorwheel', label: 'wheel color a', type: 'color',
    prop: 'colorA', default: '#b3ffbcff',
  },
  {
    id: 'sapphire-colorwheel', label: 'wheel color b', type: 'color',
    prop: 'colorB', default: '#2376fc',
  },
  {
    id: 'sapphire-thinfilm', label: 'film intensity', type: 'range',
    prop: 'intensity', min: 0, max: 4, step: 0.05, default: 1.5,
  },
  {
    id: 'sapphire-thinfilm', label: 'film dispersion', type: 'range',
    prop: 'dispersion', min: 0, max: 2, step: 0.01, default: 0.42,
  },
  {
    id: 'sapphire-thinfilm', label: 'film color c', type: 'color',
    prop: 'colorC', default: '#ffb3f1',
  },
  {
    id: 'sapphire-stripes', label: 'stripe speed', type: 'range',
    prop: 'speed', min: -2, max: 2, step: 0.05, default: -0.15,
  },
  {
    id: 'sapphire-stripes', label: 'stripe color b', type: 'color',
    prop: 'colorB', default: '#def1ffff',
  },
  {
    id: 'sapphire-glow-wide', label: 'glow intensity', type: 'range',
    prop: 'intensity', min: 0, max: 5, step: 0.05, default: 1.5,
  },
  {
    id: 'sapphire-glow-wide', label: 'glow size', type: 'range',
    prop: 'size', min: 0, max: 400, step: 1, default: 200,
  },
];

/* curated palettes so randomize stays "fun" instead of muddy —
   a: colorwheel colorA · b: colorwheel colorB
   c: thinfilm colorC  · s: stripes colorB */
const PALETTES = [
  { a: '#b3ffbc', b: '#2376fc', c: '#ffb3f1', s: '#def1ff' }, // sapphire (authored)
  { a: '#ff71ce', b: '#01cdfe', c: '#fffb96', s: '#b967ff' }, // synthwave
  { a: '#c8ff00', b: '#ff0055', c: '#ccff8f', s: '#eaffbf' }, // toxic lime
  { a: '#ff9e00', b: '#ff0054', c: '#ffd6a5', s: '#ffe9c9' }, // sunset heat
  { a: '#8ecae6', b: '#219ebc', c: '#cde9ff', s: '#eaf7ff' }, // arctic
  { a: '#ff5400', b: '#ff0080', c: '#ffc971', s: '#ffeedd' }, // ember
  { a: '#b5179e', b: '#4cc9f0', c: '#f72585', s: '#e0aaff' }, // ultraviolet
  { a: '#00f5d4', b: '#9b5de5', c: '#fee440', s: '#c5fff2' }, // acid vapor
  { a: '#ffd60a', b: '#ff4d00', c: '#fff3b0', s: '#fffbe6' }, // golden hour
  { a: '#00bbf9', b: '#00f5d4', c: '#b8f2ff', s: '#e6fbff' }, // deep sea
];

/* ---- cursor-reactive aurora ----
   The Glow layers are full-frame post-process (no position prop), but the
   Aurora layer exposes center: {x, y} — verified in the decoded definition —
   so the curtain origin tracks the cursor with a little easing. */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AURORA_ID = 'idmucebnr13e6kuhl9a';
const AURORA_HOME = { x: 0.5, y: 0 };

function attachCursorGlow(preview) {
  if (REDUCED_MOTION || !canvas) return;
  const wrap = canvas.parentElement;
  if (!wrap) return;

  const target = { ...AURORA_HOME };
  const current = { ...AURORA_HOME };
  let rafId = null;
  let rect = null;

  function tick() {
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    try {
      preview.update(AURORA_ID, { center: { x: current.x, y: current.y } });
    } catch (err) {
      console.error('[shader-demo] cursor update failed:', err);
      rafId = null;
      return;
    }
    if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function kick() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  // cache the rect on entry instead of calling getBoundingClientRect on
  // every pointermove; scroll/resize invalidate it
  wrap.addEventListener('pointerenter', () => {
    rect = canvas.getBoundingClientRect();
  });
  window.addEventListener('scroll', () => { rect = null; }, { passive: true });
  window.addEventListener('resize', () => { rect = null; }, { passive: true });

  wrap.addEventListener('pointermove', (e) => {
    if (!rect) rect = canvas.getBoundingClientRect();
    target.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    target.y = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
    kick();
  }, { passive: true });

  wrap.addEventListener('pointerleave', () => {
    target.x = AURORA_HOME.x;
    target.y = AURORA_HOME.y;
    kick();
  });
}

function setStatus(text, cls) {
  if (!statusEl) return;
  statusEl.textContent = text;
  if (cls) statusEl.className = `shader-status ${cls}`;
}

function buildControls(preview) {
  if (!controlsEl) return;

  // wipe any controls from a previous mount, keep the action buttons (last two children)
  while (controlsEl.children.length > 2) {
    controlsEl.firstChild.remove();
  }

  const rows = [];

  CONTROLS.forEach((c) => {
    const row = document.createElement('label');
    row.className = 'shader-ctl';

    const name = document.createElement('span');
    name.className = 'shader-ctl-label';
    name.textContent = c.label;

    let input;
    if (c.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.value = c.default.slice(0, 7); // <input type=color> takes #rrggbb
    } else {
      input = document.createElement('input');
      input.type = 'range';
      input.min = c.min;
      input.max = c.max;
      input.step = c.step;
      input.value = c.default;
    }

    input.addEventListener('input', () => {
      try {
        // color pickers always yield #rrggbb, ranges yield numbers —
        // send them as-is; reset restores the authored default verbatim
        const value = c.type === 'color' ? input.value : Number(input.value);
        preview.update(c.id, { [c.prop]: value });
      } catch (err) {
        console.error('[shader-demo] update failed:', err);
      }
    });

    row.append(name, input);
    rows.push({ c, input });
    controlsEl.insertBefore(row, randomBtn);
  });

  controlsEl.hidden = false;

  // push a color through update() and keep the picker in sync
  function applyColor(componentId, prop, hex) {
    try {
      preview.update(componentId, { [prop]: hex });
      const row = rows.find((r) => r.c.id === componentId && r.c.prop === prop);
      if (row) row.input.value = hex.slice(0, 7);
    } catch (err) {
      console.error('[shader-demo] update failed:', err);
    }
  }

  randomBtn.onclick = () => {
    const pick = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    applyColor('sapphire-colorwheel', 'colorA', pick.a);
    applyColor('sapphire-colorwheel', 'colorB', pick.b);
    applyColor('sapphire-thinfilm', 'colorC', pick.c);
    applyColor('sapphire-stripes', 'colorB', pick.s);
  };

  resetBtn.onclick = () => {
    rows.forEach(({ c, input }) => {
      try {
        preview.update(c.id, { [c.prop]: c.default });
      } catch (err) {
        console.error('[shader-demo] reset failed:', err);
      }
      input.value = c.type === 'color' ? c.default.slice(0, 7) : String(c.default);
    });
  };
}

// the free shaders.com tier injects an upsell link ("Unlock your Shaders Pro
// license") into the canvas container — pull it out, and keep it out in case
// the bundle re-adds one. it may live in a shadow root, so check those too.
function stripLicenseBadge(canvas) {
  const scope = () => {
    document.querySelectorAll('a[href*="shaders.com/dashboard?pricing"]').forEach((el) => el.remove());
    for (const root of [canvas.parentElement, canvas]) {
      if (root && root.shadowRoot) {
        root.shadowRoot.querySelectorAll('a[href*="shaders.com/dashboard?pricing"]').forEach((el) => el.remove());
      }
    }
  };
  scope();
  if (canvas.parentElement) {
    new MutationObserver(scope).observe(canvas.parentElement, { childList: true, subtree: true });
  }
}

let failurePoll = null;
let initWatchdog = null;
let lastSeenReason = null;

// terminal failure reasons from the shaders package (ShaderOptions.onError
// docs), mapped to visitor-friendly text. createPreview doesn't expose onError,
// so late failures are surfaced by polling preview.getFailureReason().
const FAILURE_TEXT = {
  'unsupported': 'webgpu is unavailable in this browser.',
  'no-adapter': 'no webgpu adapter is available on this device.',
  'no-device': 'the webgpu device request failed.',
  'init-failed': 'the shader failed to initialize.',
  'timeout': 'the shader took too long to start — slow network or busy gpu.',
  'device-lost': 'the webgpu device was lost and could not recover.',
  'out-of-memory': 'the gpu ran out of memory for this shader.',
  'gpu-error': 'the gpu reported sustained errors.',
  'render-failed': 'the shader kept failing while drawing.',
  'limit-exceeded': 'this shader needs more gpu resources than this device allows.',
  'unrecoverable': 'the webgpu device was lost too many times.',
  'rebuild_failed': 'the shader could not recover after a device loss.',
};

function showFailure(reason, log) {
  clearInterval(failurePoll);
  clearTimeout(initWatchdog);
  if (log) console.error('[shader-demo]', log);
  const friendly = FAILURE_TEXT[reason] || 'the shader failed unexpectedly.';
  setStatus(`${friendly} details in the console.`, 'is-error');
  if (fallback) {
    const p = fallback.querySelector('p');
    if (p) p.textContent = `${friendly} try Chrome / Edge 113+, or Safari 18+.`;
    fallback.hidden = false;
  }
}

(async () => {
  // visible loading state — replaced by is-live / is-error when done
  setStatus('initializing webgpu…', 'is-loading');

  // if the CDN bundle hangs or init stalls, don't leave "initializing" up forever;
  // showFailure below self-corrects if init still succeeds afterwards
  initWatchdog = setTimeout(() => {
    if (statusEl && statusEl.classList.contains('is-loading')) showFailure('timeout');
  }, 20000);

  // Fail fast with a friendly message when WebGPU isn't available
  if (!navigator.gpu) {
    setStatus('webgpu unavailable in this browser.', 'is-error');
    fallback.hidden = false;
    return;
  }

  try {
    const { createPreview } = await import('shaders/js');

    const preview = await createPreview(canvas, {
      shader: '72ffd4f1-d95f-4a5e-a904-52f27a37fcf1',
    });
    stripLicenseBadge(canvas);

    clearTimeout(initWatchdog);

    // hand the returned instance to other scripts/console poke-arounders
    window.shaderPreview = preview;

    buildControls(preview);
    attachCursorGlow(preview);
    // also recovers a watchdog false alarm: init was just slow, not dead
    setStatus('live — rendered with webgpu. move your cursor over it, or poke window.shaderPreview', 'is-live');
    if (fallback) fallback.hidden = true;

    // a GPU that dies later (device loss, OOM, driver reset) doesn't throw here —
    // the instance only exposes it via getFailureReason(), so poll it. device
    // losses can recover transparently, so require the reason to persist across
    // two checks before declaring the demo dead.
    failurePoll = setInterval(() => {
      const reason = typeof preview.getFailureReason === 'function' && preview.getFailureReason();
      if (reason && reason === lastSeenReason) showFailure(reason);
      lastSeenReason = reason;
    }, 3000);

    // stop the render loop if the user leaves, restart when they come back
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) preview.pause();
      else preview.resume();
    });
  } catch (err) {
    showFailure('init-failed', err);
  }
})();
