/* Schedule, Progress, Notifications, Profile, Settings */

import React from 'react';
import PlanifyAPI from '../api.jsx';
import { notify, usePersistentState } from '../data.jsx';
import {
  IconBell,
  IconCheck,
  IconClose,
  IconGroups,
  IconLogout,
  IconPlus,
  IconSpark,
} from '../components/icons.jsx';
import { PriorityTag, priorityClass, priorityLabel } from './pages-home-tasks.jsx';

function SchedulePage({ onAdd }) {
  const [view, setView] = React.useState('week');
  const [activeDay, setActiveDay] = React.useState('Wed');
  const days = [
    { d: 'Mon', n: 2 }, { d: 'Tue', n: 3 }, { d: 'Wed', n: 4, today: true }, { d: 'Thu', n: 5 },
    { d: 'Fri', n: 6 }, { d: 'Sat', n: 7 }, { d: 'Sun', n: 8 },
  ];
  const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const events = {};
  const countFor = (d) => hours.filter(h => events[d + '-' + h]).length;
  const activeInfo = days.find(d => d.d === activeDay);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">June 5 — June 11</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Schedule <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ Week 23</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="seg">
            {['day', 'week', 'month'].map(v => (
              <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v.toUpperCase()}</button>
            ))}
          </div>
          <button className="btn" onClick={onAdd}><IconPlus size={14} /> New event</button>
        </div>
      </div>

      {view === 'week' ? (
        <div className="week-wrap">
        <div className="week">
          <div className="hd" />
          {days.map(d => (
            <div
              key={d.d}
              className={'hd day clickable' + (d.today ? ' today' : '')}
              onClick={() => { setActiveDay(d.d); setView('day'); }}
              title={'Open ' + d.d}
            >
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
                  <div
                    key={d.d + h}
                    className={'cell' + (ev ? '' : ' empty')}
                    onClick={ev ? undefined : onAdd}
                    title={ev ? ev.title : 'Add event at ' + d.d + ' ' + h}
                  >
                    {ev ? (
                      <div className={'event' + (ev.urgent ? ' urgent' : '')}>
                        <div>{ev.title}</div>
                        <div className="subj">{ev.subj}</div>
                      </div>
                    ) : (
                      <span className="ghost-add"><IconPlus size={12} /></span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        </div>
      ) : null}

      {view === 'day' ? (
        <div>
          <div className="day-pills" style={{ marginBottom: 20 }}>
            {days.map(d => (
              <button key={d.d} className={'day-pill' + (activeDay === d.d ? ' on' : '')} onClick={() => setActiveDay(d.d)}>
                <span className="d">{d.d} {d.today ? '· today' : ''}</span>
                <span className="n">{String(d.n).padStart(2, '0')}</span>
                <span className="meta">{countFor(d.d)} events</span>
              </button>
            ))}
          </div>
          <div className="panel">
            <div className="panel-head">
              <h2 className="t-h2">{activeDay}, June {activeInfo ? activeInfo.n : ''}</h2>
              <span className="t-mut">{countFor(activeDay)} scheduled</span>
            </div>
            <div>
              {hours.map(h => {
                const ev = events[activeDay + '-' + h];
                return (
                  <div key={h} className="day-slot" onClick={ev ? undefined : onAdd} title={ev ? ev.title : 'Add event at ' + h}>
                    <span className="time">{h}</span>
                    {ev ? (
                      <div className={'event' + (ev.urgent ? ' urgent' : '')} style={{ flex: 1 }}>
                        <div>{ev.title}</div>
                        <div className="subj">{ev.subj}</div>
                      </div>
                    ) : (
                      <span className="free">Free <IconPlus size={11} /></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {view === 'month' ? (
        <div className="week-wrap">
        <div className="month">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="hd">{d}</div>
          ))}
          {Array.from({ length: 42 }, (_, i) => {
            // Mon June 2 — so June 1 lands on the Sunday of the first row
            const n = i - 5;
            const dayNum = n >= 1 && n <= 30 ? n : null;
            const wd = days[i % 7];
            const inWeek = dayNum !== null && dayNum >= 2 && dayNum <= 8;
            const count = inWeek ? countFor(wd.d) : 0;
            const today = dayNum === 4;
            return (
              <div
                key={i}
                className={'mcell' + (dayNum ? ' clickable' : '') + (today ? ' today' : '')}
                onClick={dayNum ? () => { if (inWeek) { setActiveDay(wd.d); setView('day'); } else { onAdd(); } } : undefined}
                title={dayNum ? (inWeek ? 'Open June ' + dayNum : 'Add event') : undefined}
              >
                {dayNum ? <span className="num">{String(dayNum).padStart(2, '0')}</span> : null}
                {count > 0 ? <span className="count">{count} events</span> : null}
              </div>
            );
          })}
        </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 16, marginTop: 24, alignItems: 'center', fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: 'var(--bg-sub)', borderLeft: '3px solid var(--ink)' }}></span> Scheduled</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: 'var(--accent-soft)', borderLeft: '3px solid var(--accent)' }}></span> Urgent / due</span>
      </div>
    </div>
  );
}

function ProgressPage({ tasks = [] }) {
  const [range, setRange] = React.useState('month');
  const taskList = tasks;
  const openTasks = taskList.filter(t => !t.done);
  const doneTasks = taskList.filter(t => t.done);
  const priorityCounts = ['urgent', 'medium', 'low'].map(p => ({
    key: p,
    label: priorityLabel(p),
    count: openTasks.filter(t => priorityClass(t.priority) === p).length,
  }));
  const totalOpen = openTasks.length;
  const prioRank = { urgent: 0, medium: 1, low: 2 };
  const nextActions = [...openTasks]
    .sort((a, b) => (prioRank[priorityClass(a.priority)] ?? 9) - (prioRank[priorityClass(b.priority)] ?? 9))
    .slice(0, 3);
  const planningScore = Math.round((doneTasks.length / Math.max(taskList.length, 1)) * 100);
  const focusMix = [];
  const emptyStats = { done: doneTasks.length, onTime: 0, focus: 0, streak: 0 };
  const datasets = {
    week: {
      cols: [
        { l: 'Mon', val: 0 }, { l: 'Tue', val: 0 }, { l: 'Wed', val: 0, current: true },
        { l: 'Thu', val: 0 }, { l: 'Fri', val: 0 }, { l: 'Sat', val: 0 }, { l: 'Sun', val: 0 },
      ],
      caption: 'This week, by day',
      stats: emptyStats,
    },
    month: {
      cols: [
        { l: 'W17', val: 0 }, { l: 'W18', val: 0 }, { l: 'W19', val: 0 },
        { l: 'W20', val: 0 }, { l: 'W21', val: 0 }, { l: 'W22', val: 0 },
        { l: 'W23', val: 0, current: true },
      ],
      caption: 'Last 7 weeks',
      stats: emptyStats,
    },
    term: {
      cols: [
        { l: 'Jan', val: 0 }, { l: 'Feb', val: 0 }, { l: 'Mar', val: 0 },
        { l: 'Apr', val: 0 }, { l: 'May', val: 0 }, { l: 'Jun', val: 0, current: true },
      ],
      caption: 'Spring term, by month',
      stats: emptyStats,
    },
  };
  const data = datasets[range];
  const subjects = Object.values(taskList.reduce((acc, task) => {
    const name = task.subject || 'General';
    acc[name] = acc[name] || { name, done: 0, total: 0 };
    acc[name].total += 1;
    if (task.done) acc[name].done += 1;
    return acc;
  }, {}));
  const habits = taskList.length ? [
    { label: 'Overload risk', value: priorityCounts[0].count ? 'High' : 'Low', detail: priorityCounts[0].count + ' high-priority open' },
  ] : [];
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Spring semester</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Progress</h1>
        </div>
        <div className="seg">
          {['week', 'month', 'term'].map(r => (
            <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="label">Tasks completed</span>
          <span className="t-stat">{data.stats.done}</span>
        </div>
        <div className="stat">
          <span className="label">On-time rate</span>
          <span className="t-stat">{data.stats.onTime}<span style={{ fontSize: 28, color: 'var(--muted)' }}>%</span></span>
        </div>
        <div className="stat">
          <span className="label">Avg focus / day</span>
          <span className="t-stat">{data.stats.focus}<span style={{ fontSize: 28, color: 'var(--muted)' }}>h</span></span>
        </div>
        <div className="stat">
          <span className="label">Streak</span>
          <span className="t-stat">{data.stats.streak}<span style={{ fontSize: 28, color: 'var(--muted)' }}>d</span></span>
        </div>
      </div>

      <div style={{ height: 40 }} />

      <div className="progress-grid">
        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Completion</h2>
            <span className="t-mut">{data.caption}</span>
          </div>
          <div className="panel-pad">
            <div className="bar-chart">
              {data.cols.map(w => (
                <div key={w.l} className="col" title={w.l + ': ' + Math.round(w.val * 100) + '%'}>
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
            {subjects.length ? subjects.map(s => {
              const pct = Math.round((s.done / s.total) * 100);
              return (
                <div key={s.name} style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                    <span className="tnum" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{s.done}/{s.total} <span style={{ color: 'var(--ink)', marginLeft: 8 }}>{pct}%</span></span>
                  </div>
                  <div className="progressbar" style={{ height: 4, background: 'var(--bg-sunken)' }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'var(--ink)', transition: 'width .35s ease' }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '32px 0', color: 'var(--muted)' }}>No subjects yet</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 24 }} />

      <div className="productivity-grid">
        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Priority load</h2>
            <span className="t-mut">{openTasks.length} open tasks</span>
          </div>
          <div className="panel-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {priorityCounts.map(p => {
              const pct = totalOpen ? Math.round((p.count / totalOpen) * 100) : 0;
              return (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className={'tag priority-tag ' + p.key}>{p.label}</span>
                    <span className="tnum" style={{ color: 'var(--muted)', fontWeight: 700 }}>{p.count} · {pct}%</span>
                  </div>
                  <div className="progressbar priority-load" style={{ height: 8, background: 'var(--bg-sunken)' }}>
                    <div className={p.key} style={{ width: pct + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Next actions</h2>
            <span className="t-mut">Do first</span>
          </div>
          <div>
            {nextActions.length ? nextActions.map((t, i) => (
              <div key={t.id} className="progress-action">
                <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="title">{t.title}</div>
                  <div className="meta">{t.subject} · {t.dueDate || t.due}</div>
                </div>
                <PriorityTag priority={t.priority} />
              </div>
            )) : (
              <div style={{ padding: 28, color: 'var(--muted)' }}>No tasks yet</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Focus mix</h2>
            <span className="t-mut">Recommended split</span>
          </div>
          <div className="panel-pad" style={{ display: 'grid', gap: 14 }}>
            {focusMix.length ? focusMix.map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</span>
                  <span className="tnum" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{f.value}%</span>
                </div>
                <div className="progressbar" style={{ height: 6, background: 'var(--bg-sunken)' }}>
                  <div style={{ width: f.value + '%', height: '100%', background: f.label === 'Deep work' ? 'var(--ink)' : 'var(--muted-2)' }} />
                </div>
                <div className="t-mut" style={{ marginTop: 6 }}>{f.note}</div>
              </div>
            )) : (
              <div style={{ padding: '8px 0', color: 'var(--muted)' }}>No focus data yet</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="t-h2">Planning health</h2>
            <span className="t-mut">{planningScore}% completion</span>
          </div>
          <div className="habit-list">
            {habits.length ? habits.map(h => (
              <div key={h.label} className="habit-row">
                <div>
                  <div className="label">{h.label}</div>
                  <div className="detail">{h.detail}</div>
                </div>
                <div className="value">{h.value}</div>
              </div>
            )) : (
              <div style={{ padding: 24, color: 'var(--muted)' }}>No planning data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({ items, onMarkAll, onToggle, onDismiss }) {
  const [show, setShow] = React.useState('all');
  const list = show === 'unread' ? items.filter(i => i.unread) : items;
  const unreadCount = items.filter(i => i.unread).length;
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Inbox</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Notifications <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ {unreadCount} new</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="seg">
            {['all', 'unread'].map(s => (
              <button key={s} className={show === s ? 'on' : ''} onClick={() => setShow(s)}>{s.toUpperCase()}</button>
            ))}
          </div>
          <button className="btn ghost" onClick={onMarkAll} disabled={unreadCount === 0}>Mark all read</button>
        </div>
      </div>

      <div className="panel">
        {list.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
            <div className="t-eyebrow">Inbox zero</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: 'var(--ink)' }}>
              {show === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
            </div>
          </div>
        ) : list.map(n => (
          <div
            key={n.id}
            className={'notif' + (n.unread ? ' unread' : '')}
            onClick={() => onToggle?.(n.id)}
            title={n.unread ? 'Mark as read' : 'Mark as unread'}
          >
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
            <button
              className="dismiss"
              data-sound="delete"
              onClick={e => { e.stopPropagation(); onDismiss?.(n.id); }}
              aria-label="Dismiss notification" title="Dismiss"
            ><IconClose size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user, tasks = [], groups = [] }) {
  const defaults = {
    name: user?.username || user?.name || '', email: user?.email || '', year: 'First Year',
    major: 'Engineering', bio: '',
  };
  const [saved, setSaved] = usePersistentState('profile', defaults);
  const profile = {
    ...defaults,
    ...saved,
    name: user?.username || user?.name || saved.name || defaults.name || 'Student',
    email: user?.email || saved.email || defaults.email,
  };
  const [draft, setDraft] = React.useState(profile);
  React.useEffect(() => {
    setDraft(profile);
  }, [user?.username, user?.name, user?.email, saved.year, saved.major, saved.bio]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const initials = PlanifyAPI.initials(profile.name, 'U');
  const save = () => { setSaved({ ...saved, ...draft }); notify('Profile saved'); };
  const streak = 0;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Account</div>
        <h1 className="t-h1" style={{ marginTop: 8 }}>Profile</h1>
      </div>
      <div className="profile-grid">
        <div className="panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
          <div className="avatar" style={{ width: 96, height: 96, fontSize: 32, borderRadius: '50%' }}>{initials}</div>
          <div>
            <div className="t-h2">{profile.name}</div>
            <div className="t-mut">{profile.year} · {profile.major}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, paddingTop: 14, borderTop: '1px solid var(--line)', width: '100%' }}>
            <div>
              <div className="t-eyebrow">Tasks</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>{tasks.length}</div>
            </div>
            <div>
              <div className="t-eyebrow">Groups</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>{groups.length}</div>
            </div>
            <div>
              <div className="t-eyebrow">Streak</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>{streak}d</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3 className="t-h3">Personal information</h3></div>
          <div className="panel-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="field"><label>Full name</label><input className="input" value={draft.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" value={draft.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="field"><label>Year</label>
              <select className="select" value={draft.year} onChange={e => set('year', e.target.value)}>
                <option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option>
              </select>
            </div>
            <div className="field"><label>Major</label><input className="input" value={draft.major} onChange={e => set('major', e.target.value)} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Bio</label><textarea className="textarea" rows={3} value={draft.bio} onChange={e => set('bio', e.target.value)} /></div>
          </div>
          <div className="profile-actions" style={{ padding: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
            {dirty ? <span className="t-mut" style={{ marginRight: 'auto' }}>Unsaved changes</span> : null}
            <button className="btn ghost" data-sound="close" onClick={() => setDraft(profile)} disabled={!dirty}>Cancel</button>
            <button className="btn" onClick={save} disabled={!dirty}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ subjects = [], onAddSubject, onRemoveSubject, onSignOut }) {
  const [prefs, setPrefs] = usePersistentState('settings', {
    push: true, email: true, digest: false, ai: true, calendar: false, publicProfile: false,
  });
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const [newSubject, setNewSubject] = React.useState('');
  const addSubject = () => {
    const v = newSubject.trim();
    if (!v) return;
    onAddSubject?.(v);
    setNewSubject('');
  };
  const sections = [
    {
      title: 'Notifications', sub: 'Push, email and weekly digest preferences',
      items: [
        { k: 'push', label: 'Push notifications' },
        { k: 'email', label: 'Email reminders' },
        { k: 'digest', label: 'Weekly digest' },
      ],
    },
    {
      title: 'AI suggestions', sub: 'Allow Planify to suggest schedules and study blocks',
      items: [{ k: 'ai', label: 'Smart scheduling suggestions' }],
    },
    {
      title: 'Calendar sync', sub: 'Connect Google or Apple calendar',
      items: [{ k: 'calendar', label: 'Sync external calendar' }],
    },
    {
      title: 'Data & privacy', sub: 'Export, delete, and visibility controls',
      items: [{ k: 'publicProfile', label: 'Public profile' }],
    },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Preferences</div>
        <h1 className="t-h1" style={{ marginTop: 8 }}>Settings</h1>
      </div>
      <div className="panel">
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Subjects</div>
          <div className="t-mut" style={{ marginTop: 4 }}>The subjects available across tasks, groups and schedules</div>
          <div className="subject-chips" style={{ marginTop: 16 }}>
            {subjects.map(s => (
              <span key={s} className="subject-chip">
                {s}
                <button data-sound="delete" onClick={() => onRemoveSubject?.(s)} aria-label={'Remove ' + s} title="Remove subject">
                  <IconClose size={10} />
                </button>
              </span>
            ))}
            {subjects.length === 0 ? <span className="t-mut">No subjects yet — add one below.</span> : null}
          </div>
          <div className="subject-add-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 14, maxWidth: 440 }}>
            <input
              className="input" placeholder="Add a subject — e.g. Linear Algebra II"
              value={newSubject} onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
            />
            <button className="btn" onClick={addSubject} disabled={!newSubject.trim()}><IconPlus size={13} /> Add</button>
          </div>
        </div>
        {sections.map((s) => (
          <div key={s.title} style={{ padding: '24px 28px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.title}</div>
            <div className="t-mut" style={{ marginTop: 4 }}>{s.sub}</div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {s.items.map(it => (
                <div key={it.k} className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{it.label}</span>
                  <button
                    className={'switch' + (prefs[it.k] ? ' on' : '')}
                    onClick={() => toggle(it.k)}
                    role="switch" aria-checked={prefs[it.k]} aria-label={it.label}
                  ><span className="knob" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ padding: '24px 28px', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Account</div>
          <div className="t-mut" style={{ marginTop: 4 }}>End this session and return to the landing page</div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn ghost danger" onClick={onSignOut}>
              <IconLogout size={14} /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SchedulePage, ProgressPage, NotificationsPage, ProfilePage, SettingsPage });

export { SchedulePage, ProgressPage, NotificationsPage, ProfilePage, SettingsPage };
