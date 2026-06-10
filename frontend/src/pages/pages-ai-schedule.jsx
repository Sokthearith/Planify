/* AI Schedule — the "guiding" page */

function AISchedulePage({ onAdd }) {
  const days = [
    { d: 'Mon', n: 3, count: 4 },
    { d: 'Tue', n: 4, count: 5 },
    { d: 'Wed', n: 5, today: true, count: 6 },
    { d: 'Thu', n: 6, count: 3 },
    { d: 'Fri', n: 7, count: 4 },
    { d: 'Sat', n: 8, count: 2 },
    { d: 'Sun', n: 9, count: 1 },
  ];
  const [active, setActive] = React.useState(2); // Wed
  const [regenSpin, setRegenSpin] = React.useState(false);
  const [seed, setSeed] = React.useState(0);
  const [doneBlocks, setDoneBlocks] = React.useState({});

  const allBlocks = [
    { time: '09:00', title: 'Calculus · Problem Set 5', subj: 'Mathematics', tag: 'Deep focus', urgent: true, kind: 'busy' },
    { time: '10:30', title: 'Short break', subj: 'Recharge', kind: 'break' },
    { time: '11:00', title: 'Read Chapters 7–9', subj: 'Physics', tag: 'Reading', kind: 'busy' },
    { time: '12:30', title: 'Lunch', subj: 'Recovery', kind: 'break' },
    { time: '13:30', title: 'Programming Assignment 3', subj: 'Computer Science', tag: 'Coding', urgent: true, kind: 'busy' },
    { time: '15:00', title: 'Office hours', subj: 'Computer Science', tag: 'Drop-in', kind: 'busy' },
    { time: '16:00', title: 'Walk · light cardio', subj: 'Energy', kind: 'break' },
    { time: '17:00', title: 'Essay Draft', subj: 'English Literature', tag: 'Writing', kind: 'busy' },
    { time: '19:00', title: 'Reflection · close the day', subj: 'Planning', kind: 'busy' },
  ];

  // Vary the day plan per selected day + regeneration seed: rotate the work
  // blocks while keeping the time slots fixed.
  const times = allBlocks.map(b => b.time);
  const shift = (active + seed) % allBlocks.length;
  const rotated = allBlocks.slice(shift).concat(allBlocks.slice(0, shift));
  const blocks = rotated.map((b, i) => ({ ...b, time: times[i] }));
  const blockKey = (b) => active + '-' + seed + '-' + b.title;
  const toggleBlock = (b) => setDoneBlocks(d => ({ ...d, [blockKey(b)]: !d[blockKey(b)] }));
  const doneCount = blocks.filter(b => doneBlocks[blockKey(b)]).length;

  const regenerate = () => {
    setRegenSpin(true);
    setTimeout(() => {
      setRegenSpin(false);
      setSeed(s => s + 1);
      notify('Schedule regenerated');
    }, 700);
  };

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Generated · 18 minutes ago</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>AI Schedule</h1>
          <div className="t-mut" style={{ marginTop: 8 }}>An optimized study plan based on your goals, deadlines and habits.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={onAdd}><IconPlus size={14} /> Manual event</button>
        </div>
      </div>

      <div className="ai-banner">
        <div className="icon-wrap"><IconSpark size={22} /></div>
        <div>
          <h3>AI-Optimized Schedule</h3>
          <p>Your week has been balanced around two urgent deadlines (Calculus, Programming) and your peak focus hours between 09:00–11:00. We've added two recovery blocks and one office-hours slot.</p>
        </div>
        <button className="regen" onClick={regenerate} disabled={regenSpin}>
          <span style={{ display: 'inline-block', transition: 'transform .6s', transform: regenSpin ? 'rotate(360deg)' : 'none' }}>↻</span>
          {regenSpin ? 'Regenerating' : 'Regenerate'}
        </button>
      </div>

      <div style={{ height: 32 }} />

      <div className="day-pills">
        {days.map((d, i) => (
          <button key={d.d} className={'day-pill' + (active === i ? ' on' : '')} onClick={() => setActive(i)}>
            <span className="d">{d.d} {d.today ? '· today' : ''}</span>
            <span className="n">{String(d.n).padStart(2, '0')}</span>
            <span className="meta">{d.count} blocks</span>
          </button>
        ))}
      </div>

      <div style={{ height: 24 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
        <div className="ai-day">
          <div className="t-mut" style={{ marginBottom: 12 }}>
            Click a block to mark it complete · {doneCount}/{blocks.length} done
          </div>
          {blocks.map((b, i) => {
            const isDone = !!doneBlocks[blockKey(b)];
            return (
              <div key={i} className="ai-row">
                <div className="time">{b.time}</div>
                <div
                  className={'block ' + b.kind + (b.urgent ? ' urgent' : '') + (isDone ? ' done' : '')}
                  onClick={() => toggleBlock(b)}
                  title={isDone ? 'Mark as not done' : 'Mark as done'}
                >
                  <div className="subj">
                    <span>{b.subj}</span>
                    {b.tag ? <><span>·</span><span>{b.tag}</span></> : null}
                  </div>
                  <div className="title">{b.title}</div>
                  {isDone ? <div className="badge-end" style={{ background: 'var(--ok)' }}>DONE</div> :
                   b.urgent ? <div className="badge-end">DEADLINE</div> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="insight">
            <div className="eyebrow"><IconSpark size={11} /> Why this plan</div>
            <div className="body">Your highest-priority deadlines land Friday. The plan front-loads Calculus and Programming on your peak hours.</div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ padding: '18px 20px' }}>
              <h3 className="t-h3">Day balance</h3>
            </div>
            <div className="panel-pad" style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { lbl: 'Deep focus', val: 0.55, h: '3.5h' },
                { lbl: 'Reading', val: 0.2, h: '1.5h' },
                { lbl: 'Coding', val: 0.18, h: '1.5h' },
                { lbl: 'Recovery', val: 0.1, h: '0.5h' },
              ].map(b => (
                <div key={b.lbl}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, fontWeight: 600 }}>
                    <span>{b.lbl}</span>
                    <span className="tnum" style={{ color: 'var(--muted)' }}>{b.h}</span>
                  </div>
                  <div className="progressbar" style={{ height: 4, background: 'var(--bg-sunken)', marginTop: 8 }}>
                    <div style={{ width: (b.val * 100) + '%', height: '100%', background: 'var(--ink)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ padding: '18px 20px' }}>
              <h3 className="t-h3">Constraints</h3>
            </div>
            <div style={{ padding: '4px 20px 20px' }}>
              {['Peak hours: 09:00–11:00', 'No work after 21:00', 'Break every 90 min', 'Friday: deadline buffer'].map(c => (
                <div key={c} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--ink)' }}></span>
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AISchedulePage });
