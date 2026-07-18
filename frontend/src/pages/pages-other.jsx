/* Schedule, Progress, Notifications, Profile, Settings */

import React from 'react';
import PlanifyAPI from '../api.jsx';
import { notify } from '../data.jsx';
import {
  IconBell,
  IconCheck,
  IconClose,
  IconGroups,
  IconLogout,
  IconPlus,
  IconSpark,
  IconFullscreen,
} from '../components/icons.jsx';
import { PriorityTag, priorityClass, priorityLabel } from './pages-home-tasks.jsx';


function SchedulePage({ schedule: propSchedule, onSaveSchedule, onCreateTaskAt }) {
  const [schedule, setSchedule] = React.useState(propSchedule);
  const [view, setView] = React.useState('week');
  const timezone = schedule?.planData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  React.useEffect(() => {
    setSchedule(propSchedule);
  }, [propSchedule]);

  React.useEffect(() => {
    PlanifyAPI.getActiveSchedule().then(setSchedule).catch(() => {});
  }, []);
  const todayRef = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const mondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const [weekStart, setWeekStart] = React.useState(() => mondayOfWeek(new Date()));
  const goPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const goNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goPrevMonth = () => {
    const d = new Date(weekStart);
    d.setMonth(d.getMonth() - 1);
    setWeekStart(mondayOfWeek(d));
  };
  const goNextMonth = () => {
    const d = new Date(weekStart);
    d.setMonth(d.getMonth() + 1);
    setWeekStart(mondayOfWeek(d));
  };
  const todayKey = todayRef.toLocaleDateString('en-CA', { timeZone: timezone });
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = date.toLocaleDateString('en-CA', { timeZone: timezone });
    return {
      key,
      d: date.toLocaleDateString(undefined, { weekday: 'short' }),
      n: date.getDate(),
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      today: key === todayKey,
    };
  });
  const [activeDay, setActiveDay] = React.useState(days.find(d => d.today)?.key || days[0].key);
  React.useEffect(() => {
    if (!days.some(d => d.key === activeDay)) setActiveDay(days.find(d => d.today)?.key || days[0].key);
  }, [days.map(d => d.key).join('|')]);
  const planData = schedule?.planData || { timezone, entries: [] };
  const entries = planData.entries || [];
  const defaultRows = Array.from({ length: 14 }, (_, i) => String(i + 7).padStart(2, '0') + ':00');
  const hours = Array.isArray(planData.rows) && planData.rows.length ? planData.rows : defaultRows;
  const eventsByDay = entries.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});
  Object.values(eventsByDay).forEach(list => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
  const eventAt = (dayKey, hour) => (eventsByDay[dayKey] || []).find(e => (e.time || '').slice(0, 2) === hour.slice(0, 2));
  const countFor = (dayKey) => (eventsByDay[dayKey] || []).length;
  const activeInfo = days.find(d => d.key === activeDay) || days[0];
  const weekRange = days[0].label + ' - ' + days[6].label;
  const monthStart = React.useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekStart]);
  const monthLabel = monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const monthCells = React.useMemo(() => {
    const firstDay = monthStart.getDay() || 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - firstDay + 1);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = date.toLocaleDateString('en-CA', { timeZone: timezone });
      return {
        key,
        dayNum: date.getDate(),
        inMonth: date.getMonth() === monthStart.getMonth(),
        today: key === todayKey,
      };
    });
  }, [monthStart, timezone, todayKey]);

  const saveEntries = async (nextEntries) => {
    try {
      const saved = await onSaveSchedule?.({ ...planData, timezone, entries: nextEntries });
      if (saved) setSchedule(saved);
    } catch (e) {
      notify(e.message || 'Could not save schedule');
    }
  };
  const updateEvent = (id, patch) => {
    saveEntries(entries.map(event => event.id === id ? { ...event, ...patch, manualTime: patch.time ? true : event.manualTime } : event));
  };
  const deleteManualEvent = (id) => saveEntries(entries.filter(event => event.id !== id));
  const saveRows = async (rows, nextEntries = entries) => {
    try {
      const saved = await onSaveSchedule?.({ ...planData, timezone, rows, entries: nextEntries });
      if (saved) setSchedule(saved);
    } catch (e) {
      notify(e.message || 'Could not save schedule rows');
    }
  };
  const addRow = () => {
    const used = new Set(hours);
    let next = '18:00';
    for (let hour = 7; hour <= 23; hour += 1) {
      const candidate = String(hour).padStart(2, '0') + ':00';
      if (!used.has(candidate)) {
        next = candidate;
        break;
      }
    }
    saveRows([...hours, next].sort());
  };
  const updateRowTime = (oldTime, nextTime) => {
    if (!nextTime || hours.includes(nextTime)) return;
    const rows = hours.map(time => time === oldTime ? nextTime : time).sort();
    const nextEntries = entries.map(entry => entry.time === oldTime ? { ...entry, time: nextTime, manualTime: true } : entry);
    saveRows(rows, nextEntries);
  };
  const removeRow = (time) => {
    if (entries.some(entry => entry.time === time)) {
      notify('Move or remove items in this row first');
      return;
    }
    saveRows(hours.filter(row => row !== time));
  };



  return (
    <div className="page">
      <div className="page-head row" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-eyebrow">{view === 'month' ? monthLabel : weekRange} / {timezone}</div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>Schedule <span style={{ color: 'var(--muted-2)', fontWeight: 500 }}>/ Live</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn ghost" onClick={view === 'month' ? goPrevMonth : goPrevWeek} style={{ fontSize: 13 }}>←</button>
            <span className="t-mut" style={{ fontSize: 13, fontWeight: 600, minWidth: 100, textAlign: 'center' }}>{view === 'month' ? monthLabel : weekRange}</span>
            <button className="btn ghost" onClick={view === 'month' ? goNextMonth : goNextWeek} style={{ fontSize: 13 }}>→</button>
          </div>
          <div className="seg">
            {['day', 'week', 'month'].map(v => (
              <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v.toUpperCase()}</button>
            ))}
          </div>
          {view !== 'month' ? <button className="btn" onClick={addRow}><IconPlus size={14} /> Add row</button> : null}
        </div>
      </div>

      {view !== 'month' ? <div className="schedule-row-controls">
        {hours.map(time => (
          <div key={time} className="schedule-row-control">
            <input
              className="time-input"
              type="time"
              value={time}
              onChange={e => updateRowTime(time, e.target.value)}
              aria-label={'Change schedule row ' + time}
            />
            <button className="x" onClick={() => removeRow(time)} aria-label={'Remove row ' + time} title="Remove row">
              <IconClose size={12} />
            </button>
          </div>
        ))}
      </div> : null}

      {view === 'week' ? (
        <div className="week-wrap">
        <div className="week">
          <div className="hd" />
          {days.map(d => (
            <div
              key={d.d}
              className={'hd day clickable' + (d.today ? ' today' : '')}
              onClick={() => { setActiveDay(d.key); setView('day'); }}
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
                const ev = eventAt(d.key, h);
                return (
                  <div
                    key={d.d + h}
                    className={'cell' + (ev ? '' : ' empty')}
                    onClick={ev ? undefined : () => onCreateTaskAt?.({ date: d.key, time: h })}
                    title={ev ? ev.title : 'Create task due ' + d.d + ' ' + h}
                  >
                    {ev ? (
                      <div className={'event' + (ev.urgent || ev.kind === 'deadline' ? ' urgent' : '') + (ev.done ? ' done' : '')}>
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
              <button key={d.d} className={'day-pill' + (activeDay === d.key ? ' on' : '')} onClick={() => setActiveDay(d.key)}>
                <span className="d">{d.d} {d.today ? '· today' : ''}</span>
                <span className="n">{String(d.n).padStart(2, '0')}</span>
                <span className="meta">{countFor(d.key)} events</span>
              </button>
            ))}
          </div>
          <div className="panel">
            <div className="panel-head">
              <h2 className="t-h2">{activeInfo.d}, {activeInfo.label}</h2>
              <span className="t-mut">{countFor(activeDay)} scheduled</span>
            </div>
            <div>
              {hours.map(h => {
                const ev = eventAt(activeDay, h);
                return (
                  <div
                    key={h}
                    className="day-slot"
                    onClick={ev ? undefined : () => onCreateTaskAt?.({ date: activeDay, time: h })}
                    title={ev ? ev.title : 'Create task due at ' + h}
                  >
                    <input
                      className="time-input"
                      type="time"
                      value={h}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateRowTime(h, e.target.value)}
                      aria-label={'Change schedule row ' + h}
                    />
                    {ev ? (
                      <>
                        <div className={'event' + (ev.urgent || ev.kind === 'deadline' ? ' urgent' : '') + (ev.done ? ' done' : '')} style={{ flex: 1 }}>
                        <div>{ev.title}</div>
                        <div className="subj">{ev.subj}{ev.status ? ' / ' + ev.status.replace('_', ' ') : ''}</div>
                        {ev.kind === 'deadline' ? <div className="deadline-chip">{ev.done ? 'DONE' : 'TASK DEADLINE'}</div> : null}
                        </div>
                        {ev.sourceType === 'manual' ? (
                          <button className="x" onClick={(e) => { e.stopPropagation(); deleteManualEvent(ev.id); }} aria-label="Delete event" title="Delete event"><IconClose size={12} /></button>
                        ) : null}
                      </>
                    ) : (
                      <span className="free">Create task <IconPlus size={11} /></span>
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
          {monthCells.map((cell) => {
            // Mon June 2 — so June 1 lands on the Sunday of the first row
            const dayEvents = (eventsByDay[cell.key] || []).filter(ev => String(ev.title || '').trim());
            return (
              <div
                key={cell.key}
                className={'mcell clickable' + (!cell.inMonth ? ' muted' : '') + (cell.today ? ' today' : '')}
                onClick={() => {
                  const selected = new Date(cell.key + 'T12:00:00');
                  setWeekStart(mondayOfWeek(selected));
                  setActiveDay(cell.key);
                  setView('day');
                }}
                title={'Open ' + cell.key}
              >
                <span className="num">{String(cell.dayNum).padStart(2, '0')}</span>
                {dayEvents.map(ev => (
                  <div key={ev.id} className={'month-event' + (ev.urgent || ev.kind === 'deadline' ? ' urgent' : '') + (ev.done ? ' done' : '')}>
                    <span className="month-event-time">{ev.time || ''}</span>
                    <span className="month-event-title">{ev.title}</span>
                  </div>
                ))}
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

function FocusTimer({ value, onChange, onPreferencesChange }) {
  const timer = {
    mode: 'focus', workMinutes: 25, breakMinutes: 5, secondsLeft: 25 * 60,
    running: false, endsAt: null, sessions: 0, totalSeconds: 0,
    ...(value || {}),
  };
  const completedEndRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const durationFor = (mode, state = timer) =>
    (mode === 'focus' ? state.workMinutes : state.breakMinutes) * 60;

  React.useEffect(() => {
    const syncFullscreen = () => {
      const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(activeElement === timerRef.current);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  React.useEffect(() => {
    if (!timer.running || !timer.endsAt) return undefined;
    const tick = async () => {
      const secondsLeft = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      if (secondsLeft > 0) {
        onChange(current => current.secondsLeft === secondsLeft ? current : { ...current, secondsLeft });
        return;
      }
      if (completedEndRef.current === timer.endsAt) return;
      completedEndRef.current = timer.endsAt;
      const completedFocus = timer.mode === 'focus';
      if (timer.sessionId) {
        try { await PlanifyAPI.updateFocusSession(timer.sessionId, 'complete'); }
        catch (error) { notify(error.message || 'Could not save focus session'); }
      }
      onChange(current => {
        if (!current.running || current.endsAt !== timer.endsAt) return current;
        const nextMode = completedFocus ? 'break' : 'focus';
        return {
          ...current,
          mode: nextMode,
          running: false,
          endsAt: null,
          sessionId: null,
          sessionStatus: null,
          secondsLeft: durationFor(nextMode, current),
          sessions: (current.sessions || 0) + (completedFocus ? 1 : 0),
          totalSeconds: (current.totalSeconds || 0) + (completedFocus ? current.workMinutes * 60 : 0),
        };
      });
      window.PlanifySound?.play('success');
      notify(completedFocus ? 'Focus session complete — time for a break' : 'Break complete — ready to focus');
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timer.running, timer.endsAt, timer.mode, timer.workMinutes, timer.breakMinutes, onChange]);

  const applySession = (session) => onChange(current => ({
    ...current,
    mode: session.kind,
    running: session.status === 'running',
    endsAt: session.endsAt ? new Date(session.endsAt).getTime() : null,
    secondsLeft: session.status === 'running'
      ? Math.max(0, Math.ceil((new Date(session.endsAt).getTime() - Date.now()) / 1000))
      : Math.max(0, session.plannedSeconds - session.elapsedSeconds),
    sessionId: session.id,
    sessionStatus: session.status,
  }));
  const startPause = async () => {
    try {
      if (timer.running && timer.sessionId) {
        applySession(await PlanifyAPI.updateFocusSession(timer.sessionId, 'pause'));
      } else if (timer.sessionStatus === 'paused' && timer.sessionId) {
        applySession(await PlanifyAPI.updateFocusSession(timer.sessionId, 'resume'));
      } else {
        applySession(await PlanifyAPI.startFocusSession(timer.mode, durationFor(timer.mode)));
      }
    } catch (error) { notify(error.message || 'Could not update focus timer'); }
  };
  const reset = async () => {
    try { if (timer.sessionId) await PlanifyAPI.cancelFocusSession(timer.sessionId); }
    catch (error) { notify(error.message || 'Could not reset focus timer'); }
    onChange(current => ({
      ...current, running: false, endsAt: null, sessionId: null, sessionStatus: null,
      secondsLeft: durationFor(current.mode, current),
    }));
  };
  const switchMode = async (mode) => {
    if (timer.running || mode === timer.mode) return;
    if (timer.sessionId) {
      try { await PlanifyAPI.cancelFocusSession(timer.sessionId); }
      catch (error) { notify(error.message || 'Could not switch timer mode'); return; }
    }
    onChange(current => ({
      ...current, mode, running: false, endsAt: null, sessionId: null, sessionStatus: null,
      secondsLeft: durationFor(mode, current),
    }));
  };
  const setWorkMinutes = (minutes) => {
    if (timer.sessionId) return;
    onChange(current => ({
      ...current,
      workMinutes: minutes,
      secondsLeft: current.mode === 'focus' ? minutes * 60 : current.secondsLeft,
    }));
    Promise.resolve(onPreferencesChange?.({ focusMinutes: minutes }))
      .catch(error => notify(error.message || 'Could not save focus duration'));
  };
  const setBreakMinutes = (minutes) => {
    if (timer.sessionId) return;
    onChange(current => ({
      ...current,
      breakMinutes: minutes,
      secondsLeft: current.mode === 'break' ? minutes * 60 : current.secondsLeft,
    }));
    Promise.resolve(onPreferencesChange?.({ breakMinutes: minutes }))
      .catch(error => notify(error.message || 'Could not save break duration'));
  };
  const updateDuration = (kind, rawValue) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const maximum = kind === 'focus' ? 180 : 60;
    const minutes = Math.min(maximum, Math.max(1, Math.round(parsed)));
    if (kind === 'focus') setWorkMinutes(minutes);
    else setBreakMinutes(minutes);
  };
  const toggleFullscreen = async () => {
    try {
      const activeElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (activeElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit?.call(document);
        return;
      }
      const enter = timerRef.current?.requestFullscreen || timerRef.current?.webkitRequestFullscreen;
      if (!enter) throw new Error('Fullscreen is not supported by this browser');
      await enter.call(timerRef.current);
    } catch (error) {
      notify(error.message || 'Could not open the timer in full screen');
    }
  };
  const minutes = Math.floor(timer.secondsLeft / 60);
  const seconds = timer.secondsLeft % 60;
  const progress = 1 - (timer.secondsLeft / Math.max(1, durationFor(timer.mode)));

  return (
    <section ref={timerRef} className={'focus-timer panel ' + timer.mode} aria-label="Pomodoro focus timer">
      <div className="panel-head">
        <div>
          <div className="t-eyebrow">Pomodoro</div>
          <h2 className="t-h2" style={{ marginTop: 6 }}>Focus timer</h2>
        </div>
        <div className="focus-head-actions">
          <span className="t-mut">{timer.sessions || 0} sessions complete</span>
          <button
            className="btn ghost iconbtn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Open full screen'}
            title={isFullscreen ? 'Exit full screen' : 'Open full screen'}
          >
            <IconFullscreen size={15} exit={isFullscreen} />
          </button>
        </div>
      </div>
      <div className="focus-timer-body">
        <div className="focus-timer-settings">
          <div className="seg" aria-label="Timer mode">
            <button className={timer.mode === 'focus' ? 'on' : ''} onClick={() => switchMode('focus')}>FOCUS</button>
            <button className={timer.mode === 'break' ? 'on' : ''} onClick={() => switchMode('break')}>BREAK</button>
          </div>
          <div className="focus-lengths" aria-label="Focus length">
            {[25, 45, 60].map(length => (
              <button key={length} className={timer.workMinutes === length ? 'on' : ''} onClick={() => setWorkMinutes(length)} disabled={!!timer.sessionId}>
                {length}m
              </button>
            ))}
          </div>
        </div>
        <div className="focus-custom-durations">
          <label>
            <span>Focus minutes</span>
            <input
              className="input"
              type="number"
              min="1"
              max="180"
              step="1"
              value={timer.workMinutes}
              disabled={!!timer.sessionId}
              onChange={event => updateDuration('focus', event.target.value)}
            />
          </label>
          <label>
            <span>Break minutes</span>
            <input
              className="input"
              type="number"
              min="1"
              max="60"
              step="1"
              value={timer.breakMinutes}
              disabled={!!timer.sessionId}
              onChange={event => updateDuration('break', event.target.value)}
            />
          </label>
        </div>
        <div className="focus-clock" aria-live="polite">
          <span>{String(minutes).padStart(2, '0')}</span>
          <i>:</i>
          <span>{String(seconds).padStart(2, '0')}</span>
        </div>
        <div className="focus-track" aria-hidden="true"><span style={{ width: Math.min(100, Math.max(0, progress * 100)) + '%' }} /></div>
        <div className="focus-controls">
          <button className="btn" onClick={startPause}>{timer.running ? 'Pause' : (timer.sessionStatus === 'paused' ? 'Resume' : 'Start')} {timer.mode}</button>
          <button className="btn ghost" onClick={reset}>Reset</button>
        </div>
        <p className="focus-hint">{timer.mode === 'focus' ? 'Work on one task until the timer ends.' : `Step away, stretch, and recharge for ${timer.breakMinutes} minutes.`}</p>
      </div>
    </section>
  );
}

function ProgressPage({ tasks = [], focusTimer, setFocusTimer, onPreferencesChange }) {
  const [range, setRange] = React.useState('month');
  const [progressData, setProgressData] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    PlanifyAPI.getProgress(range)
      .then(result => { if (alive) setProgressData(result); })
      .catch(error => notify(error.message || 'Could not load progress'));
    return () => { alive = false; };
  }, [range, focusTimer?.sessions]);
  const taskList = tasks;
  const openTasks = taskList.filter(t => !t.done);
  const doneTasks = taskList.filter(t => t.done);
  const priorityCounts = ['urgent', 'medium', 'low'].map(p => ({
    key: p,
    label: priorityLabel(p),
    count: progressData?.priorities?.find(item => (item.priority === 'high' ? 'urgent' : item.priority) === p)?.count
      ?? openTasks.filter(t => priorityClass(t.priority) === p).length,
  }));
  const totalOpen = priorityCounts.reduce((sum, item) => sum + item.count, 0);
  const nextActions = progressData?.nextActions?.map(task => ({
    ...task,
    priority: task.priority === 'high' ? 'urgent' : task.priority,
    due: task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date',
  })) || openTasks.slice(0, 3);
  const planningScore = Math.round((doneTasks.length / Math.max(taskList.length, 1)) * 100);
  const focusSeconds = progressData?.stats?.focusSeconds || 0;
  const focusMix = focusSeconds ? [{ label: 'Focused work', value: 100, note: `${(focusSeconds / 3600).toFixed(1)} hours logged` }] : [];
  const data = {
    caption: range === 'week' ? 'This week, by day' : range === 'term' ? 'Last 6 months' : 'Last 7 weeks',
    cols: (progressData?.buckets || []).map((bucket, index, list) => ({
      l: bucket.label, val: bucket.rate, current: index === list.length - 1,
    })),
    stats: {
      done: progressData?.stats?.completed ?? doneTasks.length,
      onTime: progressData?.stats?.onTimeRate || 0,
      focus: Number((focusSeconds / 3600).toFixed(1)),
      streak: progressData?.stats?.streak || 0,
    },
  };
  const fallbackSubjects = Object.values(taskList.reduce((acc, task) => {
    const name = task.subject || 'General';
    acc[name] = acc[name] || { name, done: 0, total: 0 };
    acc[name].total += 1;
    if (task.done) acc[name].done += 1;
    return acc;
  }, {}));
  const subjects = progressData?.subjects || fallbackSubjects;
  const habits = taskList.length ? [
    { label: 'Overload risk', value: priorityCounts[0].count ? 'High' : 'Low', detail: priorityCounts[0].count + ' high-priority open' },
  ] : [];
  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">Historical analytics</div>
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
          <span className="label">Focus logged</span>
          <span className="t-stat">{data.stats.focus}<span style={{ fontSize: 28, color: 'var(--muted)' }}>h</span></span>
        </div>
        <div className="stat">
          <span className="label">Streak</span>
          <span className="t-stat">{data.stats.streak}<span style={{ fontSize: 28, color: 'var(--muted)' }}>d</span></span>
        </div>
      </div>

      <div style={{ height: 40 }} />

      <FocusTimer value={focusTimer} onChange={setFocusTimer} onPreferencesChange={onPreferencesChange} />

      <div style={{ height: 24 }} />

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

function NotificationsPage({ items, onMarkAll, onToggle, onDismiss, onAcceptInvite, onDeclineInvite }) {
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
               n.kind === 'invite' || n.kind === 'group' ? <IconGroups size={12} /> :
               <IconCheck size={12} />}
            </div>
            <div className="body">
              <div className="title">{n.title}</div>
              <div className="sub">{n.sub}</div>
              {n.kind === 'invite' && n.inviteStatus === 'pending' ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn" style={{ padding: '4px 14px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onAcceptInvite?.(n.id); }}>Accept</button>
                  <button className="btn ghost" style={{ padding: '4px 14px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onDeclineInvite?.(n.id); }}>Decline</button>
                </div>
              ) : null}
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

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Choose an image file'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Profile picture must be smaller than 5 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('Could not open that image'));
      image.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePage({ user, tasks = [], groups = [], progress, onSaveProfile }) {
  const defaults = {
    name: user?.username || user?.name || '', email: user?.email || '', year: 'First Year',
    major: 'Engineering', bio: '', avatar: '',
  };
  const profile = {
    ...defaults,
    year: user?.year || defaults.year,
    major: user?.major || defaults.major,
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    name: user?.username || user?.name || defaults.name || 'Student',
    email: user?.email || defaults.email,
  };
  const [draft, setDraft] = React.useState(profile);
  const [saving, setSaving] = React.useState(false);
  const photoInput = React.useRef(null);
  React.useEffect(() => {
    setDraft(profile);
  }, [user?.username, user?.name, user?.email, user?.year, user?.major, user?.bio, user?.avatar]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const initials = PlanifyAPI.initials(draft.name || profile.name, 'U');
  const save = async () => {
    setSaving(true);
    try {
      await onSaveProfile?.({
        name: draft.name,
        year: draft.year,
        major: draft.major,
        bio: draft.bio,
        avatar: draft.avatar,
      });
      notify('Profile saved');
    } catch (error) {
      notify(error.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const avatar = await resizeProfileImage(file);
      set('avatar', avatar);
    } catch (error) {
      notify(error.message || 'Could not add profile picture');
    }
  };
  const streak = progress?.stats?.streak || 0;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Account</div>
        <h1 className="t-h1" style={{ marginTop: 8 }}>Profile</h1>
      </div>
      <div className="profile-grid">
        <div className="panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
          <div className="profile-photo">
            {draft.avatar ? <img src={draft.avatar} alt={`${draft.name || 'User'} profile`} /> : <span>{initials}</span>}
          </div>
          <input ref={photoInput} className="profile-photo-input" type="file" accept="image/*" onChange={choosePhoto} />
          <div className="profile-photo-actions">
            <button className="btn ghost sm" onClick={() => photoInput.current?.click()}>{draft.avatar ? 'Change picture' : 'Add picture'}</button>
            {draft.avatar ? <button className="btn ghost sm" onClick={() => set('avatar', '')}>Remove</button> : null}
          </div>
          <div>
            <div className="t-h2">{draft.name}</div>
            <div className="t-mut">{draft.year} · {draft.major}</div>
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
            <div className="field"><label>Email</label><input className="input" type="email" value={draft.email} readOnly aria-readonly="true" title="Email changes are not available here" /></div>
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
            <button className="btn" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ preferences = {}, onUpdatePreferences, subjects = [], onAddSubject, onRemoveSubject, onSignOut }) {
  const toggle = async (key) => {
    try { await onUpdatePreferences?.({ [key]: !preferences[key] }); }
    catch (error) { notify(error.message || 'Could not save preference'); }
  };
  const [newSubject, setNewSubject] = React.useState('');
  const addSubject = () => {
    const v = newSubject.trim();
    if (!v) return;
    onAddSubject?.(v);
    setNewSubject('');
  };
  const sections = [
    {
      title: 'In-app notifications', sub: 'Choose which activity appears in your Planify inbox',
      items: [
        { k: 'inAppNotifications', label: 'Enable optional notifications' },
        { k: 'dueReminders', label: 'Deadline reminders' },
        { k: 'groupTaskUpdates', label: 'Group task updates' },
        { k: 'groupMessages', label: 'Group messages' },
      ],
    },
    {
      title: 'AI suggestions', sub: 'Allow Planify to suggest schedules and study blocks',
      items: [{ k: 'aiSuggestions', label: 'Smart scheduling suggestions' }],
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
                    className={'switch' + (preferences[it.k] ? ' on' : '')}
                    onClick={() => toggle(it.k)}
                    role="switch" aria-checked={!!preferences[it.k]} aria-label={it.label}
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
