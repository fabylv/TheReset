const STORAGE = {
    get: k => { try { return JSON.parse(localStorage.getItem('reset_' + k)); } catch(e) { return null; } },
    set: (k, v) => { try { localStorage.setItem('reset_' + k, JSON.stringify(v)); } catch(e) {} }
  };

  const TODAY = new Date().toISOString().slice(0, 10);

  const CARDS = [
    { theme: 'presence',    action: 'Write one sentence by hand. Just one.' },
    { theme: 'stillness',   action: 'Sit outside for five minutes. No phone.' },
    { theme: 'connection',  action: 'Call someone instead of texting.' },
    { theme: 'nourishment', action: 'Eat your next meal without a screen.' },
    { theme: 'noticing',    action: 'Name three things you saw with your eyes today.' },
    { theme: 'making',      action: 'Make something with your hands. Anything.' },
    { theme: 'reading',     action: 'Read one page of a physical book.' },
    { theme: 'walking',     action: 'Take a ten-minute walk without headphones.' },
    { theme: 'rest',        action: 'Do nothing for three minutes. Completely nothing.' },
    { theme: 'gratitude',   action: 'Tell someone one specific thing you appreciate about them.' },
    { theme: 'cooking',     action: 'Cook something simple from scratch tonight.' },
    { theme: 'listening',   action: 'Put on music and just listen — no other tasks.' },
    { theme: 'tidying',     action: 'Clear one small surface. Make it beautiful.' },
    { theme: 'morning',     action: 'Wait one hour before looking at your phone tomorrow morning.' },
    { theme: 'breathing',   action: 'Step outside and take five slow breaths of real air.' },
    { theme: 'slowness',    action: 'Do one thing today at half your normal speed.' },
  ];

  const FAQS = [
    { q: 'Will AI take my job?',
      a: 'Some roles will change. Most won\'t vanish — they\'ll shift. The people who do well are those who understand what AI can\'t do: judgment, empathy, creativity, relationships. You have all of those.' },
    { q: 'Do I need to learn AI tools?',
      a: 'You don\'t need to master everything. But knowing what\'s out there — and what it\'s good for — is useful. Start with one tool that solves a real problem you have. That\'s enough.' },
    { q: 'Is it okay to not use AI?',
      a: 'Yes. Completely. No one is obligated to adopt every new technology. If it doesn\'t serve your life or work right now, you don\'t have to use it.' },
    { q: 'How do I set boundaries with AI at work?',
      a: 'Be honest about what you\'re comfortable with. Ask your manager what the expectations actually are — most haven\'t thought it through yet. You\'re allowed to say "I prefer to do this myself."' },
    { q: 'What should I actually use AI for?',
      a: 'The tedious, the repetitive, the first draft. Let it do the grunt work so you can do the thinking. Never let it replace your voice, your judgment, or your relationships.' },
    { q: 'Is AI making us less human?',
      a: 'Only if we let it. The tools don\'t decide how we live — we do. You\'re here, which means you\'re already paying attention.' },
    { q: 'I feel left behind. Everyone seems to be using AI constantly.',
      a: 'That feeling is real and very common. But "everyone" is an illusion — most people are just as uncertain as you are. You are not behind. You\'re being thoughtful.' },
  ];

  function getCardIndex() {
    const skips = STORAGE.get('skips') || { date: '', count: 0, index: 0 };
    const seed = TODAY.replace(/-/g, '');
    const base = parseInt(seed.slice(-6)) % CARDS.length;
    const offset = (skips.date === TODAY) ? skips.index : 0;
    return (base + offset) % CARDS.length;
  }

  function buildPractice() {
    const streak = STORAGE.get('streak') || {};
    const dots = document.getElementById('practiceDots');
    dots.innerHTML = '';
    const days = ['S','M','T','W','T','F','S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const el = document.createElement('div');
      el.className = 'practice-day'
        + (streak[key] ? ' done' : '')
        + (i === 0 ? ' today' : '');
      el.textContent = days[d.getDay()];
      dots.appendChild(el);
    }
  }

  function showCard() {
    const idx = getCardIndex();
    const card = CARDS[idx];
    document.getElementById('cardTheme').textContent = card.theme;
    document.getElementById('cardAction').textContent = card.action;
    const streak = STORAGE.get('streak') || {};
    const doneBtn = document.getElementById('doneBtn');
    const doneConfirm = document.getElementById('doneConfirm');
    const anotherBtn = document.getElementById('anotherBtn');
    const skips = STORAGE.get('skips') || { date: '', count: 0, index: 0 };
    if (streak[TODAY]) {
      doneBtn.disabled = true;
      doneBtn.textContent = 'Done for today ✓';
      doneConfirm.textContent = 'Good. That counts.';
    } else {
      doneBtn.disabled = false;
      doneBtn.textContent = 'I did this today';
      doneConfirm.textContent = '';
    }
    const skipCount = skips.date === TODAY ? skips.count : 0;
    if (skipCount >= 3) {
      anotherBtn.disabled = true;
      anotherBtn.textContent = 'that\'s your three for today';
    } else {
      anotherBtn.disabled = false;
      anotherBtn.textContent = 'give me another';
    }
    const wc = document.getElementById('whisperCard');
    wc.classList.remove('visible');
    setTimeout(() => wc.classList.add('visible'), 80);
    buildPractice();
  }

  function buildAccordion() {
    const acc = document.getElementById('accordion');
    FAQS.forEach(item => {
      const wrap = document.createElement('div');
      wrap.className = 'accordion-item';
      const btn = document.createElement('button');
      btn.className = 'accordion-q';
      btn.innerHTML = item.q + '<span class="chevron" aria-hidden="true">▾</span>';
      const ans = document.createElement('div');
      ans.className = 'accordion-a';
      ans.textContent = item.a;
      btn.addEventListener('click', () => {
        const isOpen = ans.classList.contains('open');
        document.querySelectorAll('.accordion-a').forEach(a => a.classList.remove('open'));
        document.querySelectorAll('.accordion-q').forEach(q => q.classList.remove('open'));
        if (!isOpen) { ans.classList.add('open'); btn.classList.add('open'); }
      });
      wrap.appendChild(btn);
      wrap.appendChild(ans);
      acc.appendChild(wrap);
    });
  }

  // BREATH ENGINE
  let breathCycle = 0;
  let breathCountdown = null;

  const phases = [
    { label: 'inhale', instruct: 'Breathe in slowly through your nose', dur: 4, cls: 'expand' },
    { label: 'hold',   instruct: 'Hold gently',                          dur: 4, cls: 'hold' },
    { label: 'exhale', instruct: 'Let it all go',                        dur: 4, cls: 'shrink' },
  ];

  function runPhase(phaseIdx) {
    const p = phases[phaseIdx];
    const dot = document.getElementById('breathDot');
    const numEl = document.getElementById('breathNum');
    const phaseEl = document.getElementById('breathPhase');
    const instEl = document.getElementById('breathInstruct');
    dot.className = 'breath-dot ' + p.cls;
    phaseEl.textContent = p.label;
    instEl.textContent = p.instruct;
    numEl.textContent = p.dur;
    let c = p.dur;
    breathCountdown = setInterval(() => {
      c--;
      numEl.textContent = Math.max(c, 1);
      if (c <= 0) {
        clearInterval(breathCountdown);
        const next = (phaseIdx + 1) % 3;
        if (next === 0) {
          breathCycle++;
          const ind = document.getElementById('bi' + Math.min(breathCycle - 1, 2));
          if (ind) ind.classList.add('done');
          if (breathCycle >= 3) { finishBreath(); return; }
        }
        runPhase(next);
      }
    }, 1000);
  }

  function finishBreath() {
    clearInterval(breathCountdown);
    STORAGE.set('breath_done', TODAY);
    switchTab('card');
    showCard();
  }

  document.getElementById('skipBreath').addEventListener('click', () => {
    clearInterval(breathCountdown);
    switchTab('card');
    showCard();
  });

  document.getElementById('doneBtn').addEventListener('click', () => {
    const streak = STORAGE.get('streak') || {};
    streak[TODAY] = true;
    STORAGE.set('streak', streak);
    const btn = document.getElementById('doneBtn');
    btn.disabled = true;
    btn.textContent = 'Done for today ✓';
    document.getElementById('doneConfirm').textContent = 'Good. That counts.';
    buildPractice();
  });

  document.getElementById('anotherBtn').addEventListener('click', () => {
    const skips = STORAGE.get('skips') || { date: '', count: 0, index: 0 };
    const count = skips.date === TODAY ? skips.count : 0;
    if (count >= 3) return;
    const newIndex = (skips.date === TODAY ? skips.index : 0) + 1;
    STORAGE.set('skips', { date: TODAY, count: count + 1, index: newIndex });
    showCard();
  });

  // THEME
  const savedTheme = STORAGE.get('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeBtn').textContent = '☾';
  }
  document.getElementById('themeBtn').addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    document.getElementById('themeBtn').textContent = isLight ? '☾' : '☀';
    STORAGE.set('theme', isLight ? 'light' : 'dark');
  });

  // TABS
  function switchTab(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sec-' + name).classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  }

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
      if (tab === 'card') showCard();
    });
  });

  buildAccordion();

  // Begin button — user starts breathing on tap
  document.getElementById('beginBreath').addEventListener('click', () => {
    document.getElementById('beginBreath').style.display = 'none';
    document.getElementById('breathProgress').style.display = '';
    document.getElementById('skipBreath').style.display = '';
    document.getElementById('breathInstruct').textContent = 'Breathe in slowly through your nose';
    runPhase(0);
  });

// ── PWA: Service Worker ───────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── PWA: Add to Home Screen nudge ─────────────────────────────────────────────
let _installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  // Show nudge after 20s if not already installed
  setTimeout(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!isStandalone && _installPrompt && !localStorage.getItem('reset_install_dismissed')) {
      showInstallNudge();
    }
  }, 20000);
});

function showInstallNudge() {
  const nudge = document.getElementById('install-nudge');
  if (nudge) nudge.classList.add('show');
}

function triggerInstall() {
  if (_installPrompt) {
    _installPrompt.prompt();
    _installPrompt.userChoice.then(() => { _installPrompt = null; });
  }
  const nudge = document.getElementById('install-nudge');
  if (nudge) nudge.classList.remove('show');
}

function dismissInstall() {
  localStorage.setItem('reset_install_dismissed', '1');
  const nudge = document.getElementById('install-nudge');
  if (nudge) nudge.classList.remove('show');
}
