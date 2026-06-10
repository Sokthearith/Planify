/* Tiny synthesized UI sounds shared by every component. */

const PlanifySound = (() => {
  let ctx = null;
  let muted = false;
  const lastPlayed = {};

  const getCtx = () => {
    if (muted) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const tone = (freq, start, duration, type = 'sine', gain = 0.04) => {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const t = audio.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  };

  const patterns = {
    tap: () => tone(520, 0, 0.045, 'triangle', 0.018),
    nav: () => {
      tone(360, 0, 0.055, 'triangle', 0.018);
      tone(540, 0.04, 0.07, 'triangle', 0.016);
    },
    toggle: () => {
      tone(440, 0, 0.045, 'square', 0.012);
      tone(620, 0.035, 0.055, 'triangle', 0.016);
    },
    open: () => {
      tone(420, 0, 0.065, 'sine', 0.018);
      tone(660, 0.045, 0.08, 'sine', 0.02);
    },
    close: () => {
      tone(520, 0, 0.045, 'sine', 0.017);
      tone(300, 0.035, 0.06, 'sine', 0.016);
    },
    success: () => {
      tone(460, 0, 0.06, 'triangle', 0.018);
      tone(690, 0.055, 0.085, 'triangle', 0.02);
      tone(920, 0.13, 0.1, 'sine', 0.016);
    },
    delete: () => {
      tone(260, 0, 0.065, 'sawtooth', 0.012);
      tone(180, 0.055, 0.085, 'sine', 0.015);
    },
    alert: () => {
      tone(740, 0, 0.07, 'square', 0.011);
      tone(520, 0.07, 0.07, 'square', 0.01);
    },
  };

  const play = (name = 'tap') => {
    const now = performance.now();
    const key = name || 'tap';
    if (now - (lastPlayed[key] || 0) < 35) return;
    lastPlayed[key] = now;
    (patterns[key] || patterns.tap)();
  };

  const isDisabled = (el) =>
    el?.disabled || el?.getAttribute?.('aria-disabled') === 'true' || el?.closest?.('[disabled]');

  const inferSound = (el) => {
    const explicit = el.closest('[data-sound]')?.dataset.sound;
    if (explicit) return explicit === 'off' ? null : explicit;

    if (el.matches('.task-del, .dismiss')) return 'delete';
    if (el.matches('.x, .back-btn, .back-link, .crumb-btn, .twk-x')) return 'close';
    if (el.matches('.sb-item, .sb-brand-btn, a[href], .day-pill, .hd.clickable, .mcell.clickable')) return 'nav';
    if (el.matches('.checkbox, .switch, .twk-toggle, .member-row, .ob-tag, .ob-goal, .ob-option, .block, .notif')) return 'toggle';
    if (el.matches('.big-btn, .start, .cta, .regen')) return 'open';
    return 'tap';
  };

  const wire = () => {
    document.addEventListener('click', (e) => {
      const el = e.target.closest(
        'button,a,[role="button"],.task,.group-card,.notif,.block,.day-slot,.cell.empty,.mcell.clickable,.hd.clickable,.member-row,.ob-option,.ob-goal,.ob-tag,.day-pill'
      );
      if (!el || isDisabled(el)) return;
      const sound = inferSound(el);
      if (sound) play(sound);
    }, true);

    document.addEventListener('change', (e) => {
      if (e.target.matches('select,input[type="checkbox"],input[type="range"],input[type="date"],input[type="color"]')) {
        play('toggle');
      }
    }, true);

    window.addEventListener('planify:toast', () => play('success'));
    window.addEventListener('planify:sound', (e) => play(e.detail?.name));
  };

  return {
    play,
    mute: () => { muted = true; },
    unmute: () => { muted = false; },
    wire,
  };
})();

window.PlanifySound = PlanifySound;
PlanifySound.wire();
