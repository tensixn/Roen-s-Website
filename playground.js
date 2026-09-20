const output = document.getElementById('terminalOutput');
const input = document.getElementById('terminalInput');
const body = document.getElementById('terminalBody');

const commandHistory = [];
let historyPos = -1;

function printLine(html, className = '') {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.innerHTML = html;
  output.appendChild(p);
  body.scrollTop = body.scrollHeight;
}

function printText(text, className = '') {
  // plain-text variant: nothing is ever parsed as HTML
  const p = document.createElement('p');
  if (className) p.className = className;
  p.textContent = text;
  output.appendChild(p);
  body.scrollTop = body.scrollHeight;
}

function printCommand(cmd) {
  const p = document.createElement('p');
  p.className = 'out-cmd';
  p.textContent = cmd;
  output.appendChild(p);
  body.scrollTop = body.scrollHeight;
}

const commands = {
  help: () =>
    `available commands:
  help       show this list
  whoami     who am i, really
  about      short bio
  projects   list of things i've built
  contact    how to reach me
  spire      current obsession
  neofetch   system info, but make it a portfolio
  banner     big ascii name
  ls         list files at ~/playground
  cat        read a file (try: cat about.txt)
  open       jump somewhere (try: open github)
  resume     open the resume in a new tab
  theme      flip light/dark, or pass 'light' / 'dark'
  echo       repeat what you say back
  history    show recent commands
  roll       roll a die (try: roll 2d20)
  flip       flip a coin
  fortune    crack a fortune cookie
  rps        play rock paper scissors
  matrix     fall into the code rain
  weather    check the weather on roenOS
  sudo       try it
  clear      clear the terminal`,

  whoami: () => 'roen · cs student at NTU, building toward software engineering.',

  about: () =>
    `computer science student at NTU. i like shipping things more than\ncollecting certificates. into fintech, investing, and turning messy\ndata into something a person can actually use.`,

  projects: () =>
    `1. Roen's Website — this site, plain html/css/js\n2. SummerBuild — react native app for NTU pickup sports games\n\nsee the full writeups at <a href="index.html#projects" style="color: var(--accent)">index.html#projects</a>`,

  contact: () =>
    `email: neorwoes@gmail.com\ngithub: github.com/tensixn\n\nor just go to <a href="index.html#contact" style="color: var(--accent)">index.html#contact</a> and hit send message`,

  spire: () =>
    `currently deep in Slay the Spire 2. if you have a good deck archetype\nto recommend, that basically counts as a contact form submission.`,

  sudo: () =>
    `nice try. permission denied: you are not in the sudoers file.\nthis incident will not be reported, i'm not that serious.`,

  roll: (arg) => {
    // dice notation: NdM (e.g. 2d6, d20). falls back to one d6.
    const m = /^((\d{1,2})?d(\d{1,3}))$/i.exec((arg || '').replace(/\s+/g, ''));
    let count = 1, sides = 6;
    if (m) {
      count = m[2] ? Math.min(10, parseInt(m[2], 10)) : 1;
      sides = Math.max(2, Math.min(1000, parseInt(m[3], 10)));
    } else if (arg) {
      return `roll: can't parse "${escapeHtml(arg)}" — dice notation is NdM, like 2d6 or d20.`;
    }
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    const total = rolls.reduce((a, b) => a + b, 0);
    const detail = count > 1 ? ` [${rolls.join(', ')}]` : '';
    return `🎲 d${sides} rolled${detail}: <span class="out-accent">${total}</span>`;
  },

  flip: () => {
    const heads = Math.random() < 0.5;
    return heads
      ? '🪙 heads. the coin has spoken.'
      : '🪙 tails. better luck next flip.';
  },

  fortune: () => {
    const fortunes = [
      'a shipped prototype beats a perfect plan. ship the thing.',
      'the bug you cannot find lives in the code you did not write.',
      'soon you will refactor something. it will feel amazing. mostly.',
      'someone is quietly learning from your work. keep building.',
      'the tab you closed yesterday had the answer. it is gone now.',
      'coffee first, semicolons after.',
      'your next merge conflict is a chance to read someone else\'s code.',
      'the documentation you write today saves you at 2am next month.',
      'a watched test never passes. go touch grass, it will be green when you return.',
      'lucky numbers are just constants someone forgot to name.',
    ];
    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    return `🥠 ${f}\n${'~'.repeat(Math.min(46, f.length))}`;
  },

  rps: (arg) => {
    const moves = ['rock', 'paper', 'scissors'];
    const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const pick = (arg || '').toLowerCase();
    if (!moves.includes(pick)) {
      return 'usage: rps <rock|paper|scissors> — choose your weapon.';
    }
    const cpu = moves[Math.floor(Math.random() * 3)];
    const line = `you: ${pick} · me: ${cpu} — `;
    if (pick === cpu) return line + 'draw. great minds.';
    if (beats[pick] === cpu) return line + 'you win. suspicious luck.';
    return line + 'i win. the machine rises.';
  },

  matrix: () => {
    if (document.getElementById('matrixCanvas')) return null;
    const canvas = document.createElement('canvas');
    canvas.id = 'matrixCanvas';
    canvas.className = 'matrix-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    const chars = 'アイウエオカキクケコサシスセソ0123456789<>/{}[]$#'.split('');
    let drops = [];
    let timer = null;

    function fit() {
      const wrap = canvas.closest('.terminal-wrap');
      canvas.width = wrap ? wrap.clientWidth : 600;
      canvas.height = 240;
      drops = Array.from({ length: Math.floor(canvas.width / 16) }, () =>
        Math.floor(Math.random() * (canvas.height / 16)));
    }
    fit();

    const draw = () => {
      ctx.fillStyle = 'rgba(15, 18, 16, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px JetBrains Mono, monospace';
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() < 0.06 ? '#F4F1EA' : '#7C9885';
        ctx.fillText(ch, i * 16, y * 16);
        drops[i] = y * 16 > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    };
    timer = setInterval(draw, 50);

    const stop = () => {
      clearInterval(timer);
      canvas.remove();
      document.removeEventListener('keydown', onKey, true);
    };
    const onKey = (e) => { if (e.key === 'Escape') stop(); };
    document.addEventListener('keydown', onKey, true);
    setTimeout(stop, 8000);

    const wrap = canvas.closest('.terminal-wrap');
    if (wrap) wrap.appendChild(canvas);
    return null;
  },

  weather: () => {
    const states = [
      { icon: '☀️', desc: 'clear skies over the NTU campus' },
      { icon: '⛅', desc: 'partly cloudy, mild 29°C' },
      { icon: '🌧️', desc: 'raining — the library is winning' },
      { icon: '⛈️', desc: 'thunderstorm, commit early commit often' },
      { icon: '🌫️', desc: 'hazy — even the bugs are hard to see' },
      { icon: '☕', desc: 'caffeine front moving in from the kitchen' },
    ];
    const s = states[Math.floor(Math.random() * states.length)];
    return `${s.icon} roenOS weather — ${s.desc}`;
  },

  date: () => new Date().toString(),

  ls: () =>
    `about.txt   projects.txt   contact.gpg
resume.pdf  spire.save     secrets/`,

  cat: (arg) => {
    if (!arg) return 'usage: cat <file> — try: cat about.txt';
    const files = {
      'about.txt': () => commands.about(),
      'projects.txt': () => commands.projects(),
      'contact.gpg': () => '⨯ encrypted. nice try though.',
      'resume.pdf': () => 'binary file — run "resume" to open it instead.',
      'spire.save': () => 'ironclad / silent / defect — all unlocked, none ascended yet.',
      'secrets': () => 'cat: secrets/: is a directory (that is the secret)',
      'secrets/': () => 'cat: secrets/: is a directory (that is the secret)',
    };
    const key = arg.toLowerCase();
    if (key in files) return files[key]();
    return `cat: ${escapeHtml(arg)}: no such file or directory — run "ls" to see what's here.`;
  },

  open: (arg) => {
    if (!arg) return 'usage: open <target> — targets: github | projects | contact | resume';
    const targets = {
      'github': () => { window.open('https://github.com/tensixn', '_blank', 'noopener'); return 'opening github.com/tensixn ...'; },
      'projects': () => { window.open('index.html#projects', '_self'); return 'jumping to projects ...'; },
      'contact': () => { window.open('index.html#contact', '_self'); return 'jumping to contact ...'; },
      'resume': () => commands.resume(),
    };
    const key = arg.toLowerCase();
    if (key in targets) return targets[key]();
    return `open: unknown target "${escapeHtml(arg)}" — try: github | projects | contact | resume`;
  },

  neofetch: () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return [
      '        roen@ntu        ',
      '       ─────────        ',
      '  ▲▲   os       roenOS 1.0 (web)',
      ' ████  host     vercel edge',
      ' ████  kernel   vanilla html/css/js',
      '  ▲▲   shell    playground v1',
      '       uptime   year 2 @ NTU',
      '       theme    ' + (isLight ? 'light' : 'dark'),
      '       langs    java, python, ts, sql',
      '       status   building',
    ].join('\n');
  },

  banner: () => [
    '██████╗  ██████╗ ███████╗███╗   ██╗',
    '██╔══██╗██╔═══██╗██╔════╝████╗  ██║',
    '██████╔╝██║   ██║█████╗  ██╔██╗ ██║',
    '██╔══██╗██║   ██║██╔══╝  ██║╚██╗██║',
    '██║  ██║╚██████╔╝███████╗██║ ╚████║',
    '╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝',
  ].join('\n'),

  resume: () => {
    window.open('Roen_Seow_Resume.pdf', '_blank', 'noopener');
    return 'opening Roen_Seow_Resume.pdf ...';
  },

  theme: (arg) => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (arg !== undefined && arg !== 'light' && arg !== 'dark') {
      return "usage: theme [light|dark] — no argument flips the current theme.";
    }
    if (arg === 'light' && isLight) return 'already in light mode.';
    if (arg === 'dark' && !isLight) return 'already in dark mode.';
    // route through the shared flip on script.js so the toggle button,
    // particle settle animation, and this stay perfectly in sync
    if (typeof setTheme === 'function') {
      setTheme(arg ? arg : (isLight ? 'dark' : 'light'));
    } else {
      if (arg === 'light' || (arg === undefined && !isLight)) {
        document.documentElement.setAttribute('data-theme', 'light');
        try { localStorage.setItem('roen_theme', 'light'); } catch (e) { /* blocked */ }
      } else {
        document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem('roen_theme', 'dark'); } catch (e) { /* blocked */ }
      }
    }
    const mode = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    return 'theme: ' + mode + ' mode.';
  },

  echo: (...args) => args.join(' ') || '',

  history: () =>
    commandHistory.length
      ? [...commandHistory].reverse().map((c, i) => `${String(i + 1).padStart(2, ' ')}  ${c}`).join('\n')
      : 'no history yet — type something first.',

  clear: () => {
    // suppress the per-line entrance animation so old lines don't re-play
    output.classList.add('is-clearing');
    output.innerHTML = '';
    requestAnimationFrame(() => output.classList.remove('is-clearing'));
    return null;
  },
};

const COMMAND_NAMES = Object.keys(commands);

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  printCommand(trimmed);

  const [cmdKey, ...args] = trimmed.split(/\s+/);
  const key = cmdKey.toLowerCase();
  if (key in commands) {
    let result;
    try {
      result = commands[key](...args);
    } catch (err) {
      result = 'something broke running that: ' + escapeHtml(String(err && err.message || err));
    }
    if (result !== null && result !== undefined) {
      // user-written content (echo, unknown filenames, errors) prints as plain
      // text; only trusted command output goes through printLine's HTML
      if (key === 'echo' || key === 'history') printText(result);
      else printLine(result);
    }
  } else {
    printLine(`command not found: ${escapeHtml(cmdKey)}. try "help".`, 'out-error');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- tab completion: completes the last word in the input ---------- */
function handleTab() {
  const value = input.value;
  const parts = value.split(/\s+/);
  const last = parts[parts.length - 1] || '';
  const pool = parts.length === 1 ? COMMAND_NAMES : ['about.txt', 'projects.txt', 'contact.gpg', 'resume.pdf', 'spire.save', 'secrets/', 'github', 'projects', 'contact', 'resume', 'light', 'dark'];
  const matches = pool.filter((c) => c.startsWith(last.toLowerCase()) && c !== last);

  if (matches.length === 1) {
    parts[parts.length - 1] = matches[0];
    input.value = parts.join(' ');
  } else if (matches.length > 1) {
    printCommand(value);
    printLine(matches.join('   '), 'out-dim');
  }
}

if (input) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runCommand(input.value);
      if (input.value.trim()) commandHistory.unshift(input.value.trim());
      historyPos = -1;
      input.value = '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTab();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyPos < commandHistory.length - 1) {
        historyPos++;
        input.value = commandHistory[historyPos];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPos > 0) {
        historyPos--;
        input.value = commandHistory[historyPos];
      } else {
        historyPos = -1;
        input.value = '';
      }
    }
  });

  body.addEventListener('click', () => input.focus());
}
