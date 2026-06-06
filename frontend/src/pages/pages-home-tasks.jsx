/* Home + Tasks pages */

function TaskRow({ t, onToggle, onClick }) {
  return (
    <div className={'task' + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')} onClick={onClick}>
      <button
        className={'checkbox' + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}
        onClick={e => { e.stopPropagation(); onToggle(t.id); }}
        aria-label="Toggle done"
      >
        {t.done ? <IconCheck size={12} /> : null}
      </button>
      <div>
        <div className="title">{t.title}</div>
        {t.desc ? <div className="desc">{t.desc}</div> : null}
        <div className="meta">
          <span>{t.subject}</span>
          <span className="sep">·</span>
          <span className={t.due === 'Tomorrow' || t.due === '1 day' ? 'due-soon' : ''}>{t.due}</span>
          {t.dueDate ? <><span className="sep">·</span><span>{t.dueDate}</span></> : null}
        </div>
      </div>
      <div className="right">
        {t.priority === 'urgent' ? <span className="tag urgent">Urgent</span> : null}
      </div>
    </div>
  );
}

function HomePage({ tasks, onToggle, onAdd, onOpenTask, goto }) {
  const due = tasks.filter(t => !t.done).length;
  const done = 8;
  const hours = 24;
  const pct = Math.round((done / (due + done)) * 100);

  const weekActivity = [
    { d: 'Mon', l: 2 },
    { d: 'Tue', l: 1 },
    { d: 'Wed', l: 3 },
    { d: 'Thu', l: 2, urgent: true },
    { d: 'Fri', l: 2 },
    { d: 'Sat', l: 0 },
    { d: 'Sun', l: 1 },
  ];

  return (
    <div className="page">
      <div className="page-eyebrow">
        <span>Wednesday, June 5</span>
        <span className="sep">/</span>
        <span>Week 23</span>
      </div>
      <div className="headline-row" style={{ marginTop: 14 }}>
        <h1 className="t-h1">
          Hello, Josh<span className="slash"> / {due} due today</span>
        </h1>
        <button className="btn" onClick={onAdd}>
          <IconPlus size={14} /> New task
        </button>
      </div>

      <div style={{ height: 48 }} />

      <div className="stats">
        <div className="stat">
          <span className="label">Due</span>
          <span className="t-stat">{due}</span>
          <span className="delta neg">+2 vs last week</span>
        </div>
        <div className="stat">
          <span className="label">Done</span>
          <span className="t-stat">{done}</span>
          <span className="delta">+3 vs last week</span>
        </div>
        <div className="stat">
          <span className="label">Focus hours</span>
          <span className="t-stat">{hours}</span>
          <span className="delta">+5 vs last week</span>
        </div>
        <div className="stat">
          <span className="label">Completion</span>
          <span className="t-stat">{pct}<span style={{ fontSize: 32, color: 'var(--muted)' }}>%</span></span>
          <span className="delta">+12 vs last week</span>
        </div>
      </div>

      <div style={{ height: 56 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 className="t-h2">Today</h2>
              <span className="t-mut">{tasks.filter(t => !t.done).slice(0, 5).length} open</span>
            </div>
            <button className="btn iconbtn" onClick={onAdd}><IconPlus size={14} /></button>
          </div>
          <div>
            {tasks.slice(0, 5).map(t => (
              <TaskRow key={t.id} t={t} onToggle={onToggle} onClick={() => onOpenTask?.(t)} />
            ))}
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-mut">Showing 5 of {tasks.length}</span>
            <button className="btn ghost sm" onClick={() => goto('tasks')}>View all <IconArrow size={12} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="insight">
            <div className="eyebrow"><IconSpark size={11} /> AI Insight</div>
            <div className="body">Focus on Calculus and Programming. Two urgent deadlines are within 4 days.</div>
            <button className="cta" onClick={() => goto('schedule')}>Schedule study block <IconArrow size={12} /></button>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="t-h3">This week</h3>
              <span className="t-mut">12 tasks</span>
            </div>
            <div className="panel-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="heat">
                {weekActivity.map(d => (
                  <div key={d.d} title={d.d} className={'day l' + d.l + (d.urgent ? ' urgent' : '')} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {weekActivity.map(d => (
                  <div key={d.d} style={{
                    textAlign: 'center', fontSize: 10, letterSpacing: 0.1, textTransform: 'uppercase',
                    color: 'var(--muted)', fontWeight: 600
                  }}>{d.d}</div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="t-eyebrow">Next up</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Calculus Set 5</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="t-eyebrow">In</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>18h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ tasks, onToggle, onAdd }) {
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const filtered = tasks.filter(t => {
    if (filter === 'active' && t.done) return false;
    if (filter === 'done' && !t.done) return false;
    if (q && !(t.title + ' ' + t.subject).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">All tasks</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Tasks <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ {tasks.filter(t => !t.done).length}</span></h1>
        </div>
        <button className="btn" onClick={onAdd}><IconPlus size={14} /> New task</button>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input className="input" placeholder="Search tasks…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 42 }} />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
            <IconSearch size={16} />
          </span>
        </div>
        <div className="seg">
          {['all', 'active', 'done'].map(f => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
            <div className="t-eyebrow">Nothing here</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: 'var(--ink)' }}>You're all caught up</div>
          </div>
        ) : filtered.map(t => (
          <TaskRow key={t.id} t={t} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, TasksPage, TaskRow });
