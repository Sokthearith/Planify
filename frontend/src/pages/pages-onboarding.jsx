/* Onboarding ("guiding") flow — shown after sign-up */

const ONBOARD_SUBJECTS = [
  'Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'History', 'Economics', 'Philosophy', 'Psychology',
  'Engineering', 'Statistics', 'Languages', 'Art & Design', 'Music',
];

const ONBOARD_GOALS = [
  { id: 'deadlines', t: 'Never miss a deadline', d: 'Stay ahead of every assignment and exam.' },
  { id: 'focus', t: 'Improve focus & consistency', d: 'Build a study rhythm that sticks.' },
  { id: 'grades', t: 'Raise my grades', d: 'Push toward a higher GPA this term.' },
  { id: 'balance', t: 'Find better balance', d: 'Studies, sleep and life — without burnout.' },
  { id: 'collab', t: 'Collaborate with classmates', d: 'Run group projects without the chaos.' },
];

const PEAK_HOURS = [
  { id: 'morning', t: 'Early morning', sub: '6 – 9 AM', hint: 'I peak before everyone else' },
  { id: 'mid', t: 'Late morning', sub: '9 – 12 PM', hint: 'Classic productivity window' },
  { id: 'afternoon', t: 'Afternoon', sub: '1 – 5 PM', hint: 'After lunch, locked in' },
  { id: 'evening', t: 'Evening', sub: '6 – 10 PM', hint: 'Night owl, but not too late' },
  { id: 'night', t: 'Late night', sub: '10 PM – 1 AM', hint: 'My brain wakes up after dark' },
];

function OnboardingShell({ step, total, onBack, onSkip, children, foot }) {
  return (
    <div className="onboard">
      <header className="onboard-head">
        <div className="brand">Planify<span className="dot"></span></div>
        <div className="onboard-progress">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={'tick' + (i < step ? ' done' : '') + (i === step - 1 ? ' active' : '')}>
              <span>{String(i + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
        <button className="onboard-skip" onClick={onSkip}>Skip setup →</button>
      </header>

      <main className="onboard-body">{children}</main>

      <footer className="onboard-foot">
        <button className="back-link" onClick={onBack} disabled={step === 1}
                style={step === 1 ? { opacity: 0.3, cursor: 'not-allowed' } : null}>
          <IconBack size={12} /> Back
        </button>
        {foot}
      </footer>
    </div>
  );
}

function OnboardingFlow({ onDone, onSkip }) {
  const [step, setStep] = React.useState(1);
  const total = 5;
  const [name, setName] = React.useState('Josh');
  const [year, setYear] = React.useState('First Year');
  const [major, setMajor] = React.useState('Engineering');
  const [subjects, setSubjects] = React.useState(['Mathematics', 'Computer Science', 'Physics']);
  const [goals, setGoals] = React.useState(['deadlines', 'focus']);
  const [peak, setPeak] = React.useState('mid');

  const [customSubject, setCustomSubject] = React.useState('');
  const [customMajor, setCustomMajor] = React.useState(false);

  const next = () => step < total
    ? setStep(s => s + 1)
    : onDone({ name: name.trim(), year, major, subjects, goals, peak });
  const back = () => setStep(s => Math.max(1, s - 1));

  const toggleSubject = s =>
    setSubjects(arr => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  const toggleGoal = g =>
    setGoals(arr => arr.includes(g) ? arr.filter(x => x !== g) : [...arr, g]);

  const addCustomSubject = () => {
    const v = customSubject.trim();
    if (!v) return;
    if (!subjects.some(s => s.toLowerCase() === v.toLowerCase())) setSubjects(arr => [...arr, v]);
    setCustomSubject('');
  };

  const suggested = MAJOR_PRESETS[major] || [];
  const moreSubjects = ONBOARD_SUBJECTS.filter(s => !suggested.includes(s));
  const customPicked = subjects.filter(s => !suggested.includes(s) && !ONBOARD_SUBJECTS.includes(s));
  const selectAllSuggested = () =>
    setSubjects(arr => Array.from(new Set([...arr, ...suggested])));

  const canContinue =
    step === 1 ? name.trim() :
    step === 2 ? year && major :
    step === 3 ? subjects.length > 0 :
    step === 4 ? !!peak :
    true;

  return (
    <OnboardingShell
      step={step}
      total={total}
      onBack={back}
      onSkip={onSkip}
      foot={
        <button className="big-btn onboard-next" disabled={!canContinue} onClick={next}
                style={!canContinue ? { background: 'var(--muted-2)', borderColor: 'var(--muted-2)', cursor: 'not-allowed' } : null}>
          {step === total ? 'Open Planify' : 'Continue'} <IconArrow size={14} />
        </button>
      }
    >
      {step === 1 ? (
        <OnboardStep eyebrow={'STEP 01 · WELCOME'} title={`What should we call you?`} sub="We'll keep it personal — your name appears across your dashboard.">
          <div className="onboard-input-wrap">
            <input className="onboard-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="onboard-hello">
            Hi, <span>{name || '________'}</span>.
          </div>
        </OnboardStep>
      ) : null}

      {step === 2 ? (
        <OnboardStep eyebrow={'STEP 02 · CONTEXT'} title={`What are you studying?`} sub="We use this to tune your task templates, deadlines and AI suggestions.">
          <div className="ob-grid-2">
            <div className="field">
              <label>Year</label>
              <div className="ob-choice">
                {['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Postgrad'].map(y => (
                  <button key={y} className={year === y ? 'on' : ''} onClick={() => setYear(y)}>{y}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Major</label>
              <div className="ob-choice">
                {Object.keys(MAJOR_PRESETS).map(m => (
                  <button key={m} className={major === m && !customMajor ? 'on' : ''}
                          onClick={() => { setMajor(m); setCustomMajor(false); }}>{m}</button>
                ))}
                <button className={customMajor ? 'on' : ''} onClick={() => { setCustomMajor(true); setMajor(''); }}>Other…</button>
              </div>
              {customMajor ? (
                <input className="input" autoFocus value={major} onChange={e => setMajor(e.target.value)}
                       placeholder="Type your major" style={{ marginTop: 10 }} />
              ) : null}
            </div>
          </div>
        </OnboardStep>
      ) : null}

      {step === 3 ? (
        <OnboardStep eyebrow={'STEP 03 · SUBJECTS'} title={`Pick this term's subjects.`} sub={`Choose every class you'd like Planify to track — or add your own. You can edit anytime in Settings.`}>
          {suggested.length > 0 ? (
            <div>
              <div className="ob-suggest-head">
                <span className="ob-meta">Suggested for {major}</span>
                <button className="ob-link" onClick={selectAllSuggested}>Select all</button>
              </div>
              <div className="ob-tags">
                {suggested.map(s => (
                  <button key={s} className={'ob-tag suggest' + (subjects.includes(s) ? ' on' : '')} onClick={() => toggleSubject(s)}>
                    {subjects.includes(s) ? <IconCheck size={12} /> : <IconPlus size={12} />} {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            {suggested.length > 0 ? <div className="ob-meta" style={{ marginBottom: 10 }}>More subjects</div> : null}
            <div className="ob-tags">
              {moreSubjects.map(s => (
                <button key={s} className={'ob-tag' + (subjects.includes(s) ? ' on' : '')} onClick={() => toggleSubject(s)}>
                  {subjects.includes(s) ? <IconCheck size={12} /> : <IconPlus size={12} />} {s}
                </button>
              ))}
              {customPicked.map(s => (
                <button key={s} className="ob-tag on" onClick={() => toggleSubject(s)}>
                  <IconCheck size={12} /> {s}
                </button>
              ))}
            </div>
          </div>

          <div className="ob-custom">
            <input
              className="input" placeholder="Add your own — e.g. Linear Algebra II"
              value={customSubject} onChange={e => setCustomSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())}
            />
            <button className="btn" onClick={addCustomSubject} disabled={!customSubject.trim()}>
              <IconPlus size={13} /> Add
            </button>
          </div>

          <div className="ob-meta">
            {subjects.length === 0 ? 'Pick at least one subject.' : `${subjects.length} subject${subjects.length === 1 ? '' : 's'} selected.`}
          </div>
        </OnboardStep>
      ) : null}

      {step === 4 ? (
        <OnboardStep eyebrow={'STEP 04 · PEAK HOURS'} title={`When do you focus best?`} sub="The AI will schedule deep-focus work in your peak window and recovery elsewhere.">
          <div className="ob-options">
            {PEAK_HOURS.map(p => (
              <button key={p.id} className={'ob-option' + (peak === p.id ? ' on' : '')} onClick={() => setPeak(p.id)}>
                <div className="ob-option-time">{p.sub}</div>
                <div className="ob-option-title">{p.t}</div>
                <div className="ob-option-hint">{p.hint}</div>
              </button>
            ))}
          </div>

          <div className="divider" style={{ marginTop: 32 }}>
            <div className="lbl">And your top goals</div>
            <div className="line" />
          </div>
          <div className="ob-goals">
            {ONBOARD_GOALS.map(g => (
              <button key={g.id} className={'ob-goal' + (goals.includes(g.id) ? ' on' : '')} onClick={() => toggleGoal(g.id)}>
                <span className="check">{goals.includes(g.id) ? <IconCheck size={12} /> : null}</span>
                <div>
                  <div className="t">{g.t}</div>
                  <div className="d">{g.d}</div>
                </div>
              </button>
            ))}
          </div>
        </OnboardStep>
      ) : null}

      {step === 5 ? (
        <OnboardStep eyebrow={'STEP 05 · READY'} title={`You're set, ${name || 'friend'}.`} sub={`We've drafted a plan for your week. Open Planify and tweak anything that doesn't feel right.`}>
          <div className="ob-summary">
            <div className="ob-summary-row">
              <span className="lbl">Profile</span>
              <span className="val">{year} · {major}</span>
            </div>
            <div className="ob-summary-row">
              <span className="lbl">Subjects</span>
              <span className="val">{subjects.slice(0, 3).join(' · ')}{subjects.length > 3 ? ` +${subjects.length - 3} more` : ''}</span>
            </div>
            <div className="ob-summary-row">
              <span className="lbl">Peak window</span>
              <span className="val">{(PEAK_HOURS.find(p => p.id === peak) || {}).sub}</span>
            </div>
            <div className="ob-summary-row">
              <span className="lbl">Top goals</span>
              <span className="val">{goals.length} selected</span>
            </div>
          </div>

          <div className="ob-ready-card">
            <div className="t-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}><IconSpark size={12} /> First AI plan ready</div>
            <div className="ob-ready-title">12 tasks · 24 focus hours mapped across this week.</div>
            <div className="ob-ready-sub">Your first day starts with Calculus at 09:00 — your peak window.</div>
          </div>
        </OnboardStep>
      ) : null}
    </OnboardingShell>
  );
}

function OnboardStep({ eyebrow, title, sub, children }) {
  return (
    <div className="ob-step">
      <div className="ob-eyebrow">{eyebrow}</div>
      <h1 className="ob-title">{title}</h1>
      {sub ? <p className="ob-sub">{sub}</p> : null}
      <div className="ob-content">{children}</div>
    </div>
  );
}

Object.assign(window, { OnboardingFlow });
