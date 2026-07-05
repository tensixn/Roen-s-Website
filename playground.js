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
  sudo       try it
  clear      clear the terminal`,

  whoami: () => 'roen · cs student at NTU, building toward software engineering.',

  about: () =>
    `computer science student at NTU. i like shipping things more than\ncollecting certificates. into fintech, investing, and turning messy\ndata into something a person can actually use.`,

  projects: () =>
    `1. Roen's Website — this site, plain html/css/js\n2. SummerBuild — react native app for NTU pickup sports games\n\nsee the full writeups at <a href="index.html#projects" style="color: var(--accent)">index.html#projects</a>`,

  contact: () =>
    `email: your.email@example.com\ngithub: github.com/tensixn\n\nor just go to <a href="index.html#contact" style="color: var(--accent)">index.html#contact</a> and hit send message`,

  spire: () =>
    `currently deep in Slay the Spire 2. if you have a good deck archetype\nto recommend, that basically counts as a contact form submission.`,

  sudo: () =>
    `nice try. permission denied: you are not in the sudoers file.\nthis incident will not be reported, i'm not that serious.`,

  date: () => new Date().toString(),

  clear: () => {
    output.innerHTML = '';
    return null;
  },
};

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  printCommand(trimmed);

  const key = trimmed.toLowerCase();
  if (key in commands) {
    const result = commands[key]();
    if (result !== null && result !== undefined) printLine(result);
  } else {
    printLine(`command not found: ${escapeHtml(trimmed)}. try "help".`, 'out-error');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

if (input) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runCommand(input.value);
      if (input.value.trim()) commandHistory.unshift(input.value.trim());
      historyPos = -1;
      input.value = '';
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
