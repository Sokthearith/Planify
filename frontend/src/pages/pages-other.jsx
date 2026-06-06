/* Schedule, Progress, Notifications, Profile, Settings */

function SchedulePage({ onAdd }) {
  const days = [
    { d: 'Mon', n: 2 }, { d: 'Tue', n: 3 }, { d: 'Wed', n: 4, today: true }, { d: 'Thu', n: 5 },
    { d: 'Fri', n: 6 }, { d: 'Sat', n: 7 }, { d: 'Sun', n: 8 },
  ];
  const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const events = {
    'Mon-9:00': { title: 'Calculus Lecture', subj: 'Mathematics' },
    'Mon-14:00': { title: 'Office Hours', subj: 'CS' },
    'Tue-10:00': { title: 'Physics Lab', subj: 'Physics' },
    'Tue-13:00': { title: 'Study block', subj: 'Self' },
    'Wed-9:00': { title: 'CS Lecture', subj: 'Computer Science', urgent: true },
    'Wed-11:00': { title: 'Calc problem set', subj: 'Mathematics', urgent: true },
    'Wed-15:00': { title: 'Study group', subj: 'Database Systems' },
    'Thu-10:00': { title: 'Lit Seminar', subj: 'English' },
    'Thu-14:00': { title: 'Lab Report 2', subj: 'Chemistry' },
    'Fri-11:00': { title: 'Programming due', subj: 'CS', urgent: true },
    'Fri-15:00': { title: 'Essay draft', subj: 'English' },
    'Sun-11:00': { title: 'Weekly review', subj: 'Planning' },
  };

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">June 5 — June 11</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Schedule <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ Week 23</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="seg">
            <button>DAY</button>
            <button className="on">WEEK</button>
            <button>MONTH</button>
          </div>
          <button className="btn" onClick={onAdd}><IconPlus size={14} /> New event</button>
        </div>
      </div>

      <div className="week">
        <div className="hd" />
        {days.map(d => (
          <div key={d.d} className={'hd day' + (d.today ? ' today' : '')}>
            <span>{d.d}</span>
            <span className="num">{String(d.n).padStart(2, '0')}</span>
          </div>
        ))}
        {hours.map(h => (
          <React.Fragment key={h}>
            <div className="hour">{h}</div>
            {days.map(d => {
              const ev = events[d.d + '-' + h];
              return (
                <div key={d.d + h} className="cell">
                  {ev ? (
                    <div className={'event' + (ev.urgent ? ' urgent' : '')}>
                      <div>{ev.title}</div>
                      <div className="subj">{ev.subj}</div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 24, alignItems: 'center', fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: 'var(--bg-sub)', borderLeft: '3px solid var(--ink)' }}></span> Scheduled</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: 'var(--accent-soft)', borderLeft: '3px solid var(--accent)' }}></span> Urgent / due</span>
      </div>
    </div>
  );
}

function ProgressPage() {
  const weeks = [
    { l: 'W17', val: 0.45 }, { l: 'W18', val: 0.62 }, { l: 'W19', val: 0.54 },
    { l: 'W20', val: 0.78 }, { l: 'W21', val: 0.68 }, { l: 'W22', val: 0.71 },
    { l: 'W23', val: 0.67, current: true },
  ];
  const subjects = [
    { name: 'Mathematics', done: 18, total: 22 },
    { name: 'Computer Science', done: 14, total: 20 },
    { name: 'Physics', done: 9, total: 14 },
    { name: 'English Literature', done: 11, total: 12 },
    { name: 'Chemistry', done: 6, total: 10 },
  ];
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Spring semester</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Progress</h1>
        </div>
        <div className="seg">
          <button>WEEK</button>
          <button className="on">MONTH</button>
          <button>TERM</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="label">Tasks completed</span>
          <span className="t-stat">58</span>
          <span className="delta">+12% vs last month</span>
        </div>
        <div className="stat">
          <span className="label">On-time rate</span>
          <span className="t-stat">91<span style={{ fontSize: 28, color: 'var(--muted)' }}>%</span></span>
          <span className="delta">+4%</span>
        </div>
        <div className="stat">
          <span className="label">Avg focus / day</span>
          <span className="t-stat">3.4<span style={{ fontSize: 28, color: 'var(--muted)' }}>h</span></span>
          <span className="delta">+0.6h</span>
        </div>
        <div className="stat">
          <span className="label">Streak</span>
          <span className="t-stat">14<span style={{ fontSize: 28, color: 'var(--muted)' }}>d</span></span>
          <span className="delta">Best 21d</span>
        </div>
      </div>

      <div style={{ height: 40 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Weekly completion</h2>
            <span className="t-mut">Last 7 weeks</span>
          </div>
          <div className="panel-pad">
            <div className="bar-chart">
              {weeks.map(w => (
                <div key={w.l} className="col">
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    <div className="bar" style={{ height: (w.val * 100) + '%', background: w.current ? 'var(--accent)' : 'var(--ink)' }} />
                  </div>
                  <div className="val">{Math.round(w.val * 100)}%</div>
                  <div className="label">{w.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">By subject</h2>
          </div>
          <div style={{ padding: '8px 24px 24px' }}>
            {subjects.map(s => {
              const pct = Math.round((s.done / s.total) * 100);
              return (
                <div key={s.name} style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                    <span className="tnum" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{s.done}/{s.total} <span style={{ color: 'var(--ink)', marginLeft: 8 }}>{pct}%</span></span>
                  </div>
                  <div className="progressbar" style={{ height: 4, background: 'var(--bg-sunken)' }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'var(--ink)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({ items, onMarkAll }) {
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Inbox</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Notifications <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ {items.filter(i => i.unread).length} new</span></h1>
        </div>
        <button className="btn ghost" onClick={onMarkAll}>Mark all read</button>
      </div>

      <div className="panel">
        {items.map(n => (
          <div key={n.id} className={'notif' + (n.unread ? ' unread' : '')}>
            <div className={'mark' + (n.kind === 'urgent' ? ' urgent' : '')}>
              {n.kind === 'urgent' ? <IconBell size={12} /> :
               n.kind === 'ai' ? <IconSpark size={12} /> :
               n.kind === 'group' ? <IconGroups size={12} /> :
               <IconCheck size={12} />}
            </div>
            <div className="body">
              <div className="title">{n.title}</div>
              <div className="sub">{n.sub}</div>
            </div>
            <div className="time">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Account</div>
        <h1 className="t-h1" style={{ marginTop: 8 }}>Profile</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32 }}>
        <div className="panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
          <div className="avatar" style={{ width: 96, height: 96, fontSize: 32, borderRadius: '50%' }}>JW</div>
          <div>
            <div className="t-h2">Josh Williams</div>
            <div className="t-mut">First Year · Engineering</div>
          </div>
          <div style={{ display: 'flex', gap: 20, paddingTop: 14, borderTop: '1px solid var(--line)', width: '100%' }}>
            <div>
              <div className="t-eyebrow">Tasks</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>58</div>
            </div>
            <div>
              <div className="t-eyebrow">Groups</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>3</div>
            </div>
            <div>
              <div className="t-eyebrow">Streak</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>14d</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3 className="t-h3">Personal information</h3></div>
          <div className="panel-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="field"><label>Full name</label><input className="input" defaultValue="Josh Williams" /></div>
            <div className="field"><label>Email</label><input className="input" defaultValue="josh@university.edu" /></div>
            <div className="field"><label>Year</label>
              <select className="select" defaultValue="First Year"><option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option></select>
            </div>
            <div className="field"><label>Major</label><input className="input" defaultValue="Engineering" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Bio</label><textarea className="textarea" rows={3} defaultValue="First-year engineering student. Likes calculus on a good day." /></div>
          </div>
          <div style={{ padding: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn ghost">Cancel</button>
            <button className="btn">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Preferences</div>
        <h1 className="t-h1" style={{ marginTop: 8 }}>Settings</h1>
      </div>
      <div className="panel">
        {[
          { title: 'Notifications', sub: 'Push, email and weekly digest preferences' },
          { title: 'AI suggestions', sub: 'Allow Planify to suggest schedules and study blocks' },
          { title: 'Calendar sync', sub: 'Connect Google or Apple calendar' },
          { title: 'Appearance', sub: 'Theme, density and accent color' },
          { title: 'Data & privacy', sub: 'Export, delete, and visibility controls' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.title}</div>
              <div className="t-mut" style={{ marginTop: 4 }}>{s.sub}</div>
            </div>
            <button className="btn ghost sm">Manage <IconArrow size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SchedulePage, ProgressPage, NotificationsPage, ProfilePage, SettingsPage });
