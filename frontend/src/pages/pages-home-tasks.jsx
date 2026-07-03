/* Home + Tasks pages */

function priorityClass(priority) {
  return priority === 'urgent' || priority === 'high' ? 'urgent' : (priority || 'medium');
}

function priorityLabel(priority) {
  const p = priorityClass(priority);
  return p === 'urgent' ? 'High' : p.charAt(0).toUpperCase() + p.slice(1);
}

function PriorityTag({ priority }) {
  const p = priorityClass(priority);
  return <span className={'tag priority-tag ' + p}>{priorityLabel(priority)}</span>;
}

function TaskRow({ t, onToggle, onDelete, onClick }) {
  const p = priorityClass(t.priority);
  return (
    <div className={'task priority-' + p + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')} onClick={onClick}>
      <button
        className={'checkbox ' + p + (t.priority === 'urgent' ? ' urgent' : '') + (t.done ? ' done' : '')}
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
        <PriorityTag priority={t.priority} />
        {onDelete ? (
          <button
            className="task-del"
            data-sound="delete"
            onClick={e => { e.stopPropagation(); onDelete(t.id); }}
            aria-label="Delete task" title="Delete task"
          ><IconClose size={12} /></button>
        ) : null}
      </div>
    </div>
  );
}

function HomePage({ user, tasks, onToggle, onDelete, onAdd, onOpenTask, goto }) {
  const firstName = (user?.username || user?.name || 'Student').trim().split(/\s+/)[0] || 'Student';
  const due = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  const hours = 0;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const nextUp = tasks.find(t => !t.done && t.priority === 'urgent') || tasks.find(t => !t.done);

  const weekActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ d, l: 0 }));

  return (
    <div className="page">
      <div className="page-eyebrow">
        <span>Wednesday, June 5</span>
        <span className="sep">/</span>
        <span>Week 23</span>
      </div>
      <div className="headline-row" style={{ marginTop: 14 }}>
        <h1 className="t-h1">
          Hello, {firstName}<span className="slash"> / {due} due today</span>
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
        </div>
        <div className="stat">
          <span className="label">Done</span>
          <span className="t-stat">{done}</span>
        </div>
        <div className="stat">
          <span className="label">Focus hours</span>
          <span className="t-stat">{hours}</span>
        </div>
        <div className="stat">
          <span className="label">Completion</span>
          <span className="t-stat">{pct}<span style={{ fontSize: 32, color: 'var(--muted)' }}>%</span></span>
        </div>
      </div>

      <div style={{ height: 56 }} />

      <div className="home-grid">
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
              <TaskRow key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} onClick={() => onOpenTask?.(t)} />
            ))}
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-mut">Showing {Math.min(5, tasks.length)} of {tasks.length}</span>
            <button className="btn ghost sm" onClick={() => goto('tasks')}>View all <IconArrow size={12} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="insight">
            <div className="eyebrow"><IconSpark size={11} /> AI Insight</div>
            <div className="body">Add tasks and deadlines to start building a study plan.</div>
            <button className="cta" onClick={() => goto('schedule')}>Schedule study block <IconArrow size={12} /></button>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="t-h3">This week</h3>
              <span className="t-mut">{tasks.length} tasks</span>
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
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{nextUp ? nextUp.title : 'All clear'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="t-eyebrow">Due</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{nextUp ? (nextUp.dueDate || nextUp.due) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ tasks, onToggle, onDelete, onAdd }) {
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort] = React.useState('none');
  const [q, setQ] = React.useState('');
  const filtered = tasks.filter(t => {
    if (filter === 'active' && t.done) return false;
    if (filter === 'done' && !t.done) return false;
    if (q && !(t.title + ' ' + t.subject).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const prioRank = { urgent: 0, medium: 1, low: 2 };
  const dueRank = t => {
    const d = Date.parse(t.dueDate);
    return isNaN(d) ? Infinity : d;
  };
  const sorted = sort === 'none' ? filtered : [...filtered].sort((a, b) =>
    sort === 'priority' ? (prioRank[a.priority] ?? 9) - (prioRank[b.priority] ?? 9) :
    sort === 'title' ? a.title.localeCompare(b.title) :
    dueRank(a) - dueRank(b)
  );
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">All tasks</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Tasks <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ {tasks.filter(t => !t.done).length}</span></h1>
        </div>
        <button className="btn" onClick={onAdd}><IconPlus size={14} /> New task</button>
      </div>

      <div className="toolbar-row" style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
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
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort tasks">
          <option value="none">Sort: Default</option>
          <option value="due">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      <div className="panel">
        {sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
            <div className="t-eyebrow">Nothing here</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: 'var(--ink)' }}>
              {q || filter !== 'all' ? 'No tasks match' : "You're all caught up"}
            </div>
            {q ? <button className="btn ghost sm" style={{ marginTop: 16 }} onClick={() => setQ('')}>Clear search</button> : null}
          </div>
        ) : sorted.map(t => (
          <TaskRow key={t.id} t={t} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
      <div className="t-mut" style={{ marginTop: 12 }}>{sorted.length} of {tasks.length} tasks shown</div>
    </div>
  );
}

Object.assign(window, { HomePage, TasksPage, TaskRow, PriorityTag, priorityClass, priorityLabel });
