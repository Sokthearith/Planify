import React from "react";
import PlanifyAPI from "../api.jsx";
import { notify } from "../data.jsx";
import {
  IconArrow,
  IconBack,
  IconCal,
  IconCheck,
  IconClock,
  IconPlus,
  IconSpark,
} from "../components/icons.jsx";
import { TimeMapPopup } from "../components/time-map.jsx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_PREFERENCES = {
  instructions: "",
  focusStart: "08:00",
  focusEnd: "20:00",
  sessionMinutes: 60,
  includeWeekends: true,
};

function mondayOfWeek(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  next.setDate(next.getDate() - day + (day === 0 ? -6 : 1));
  return next;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekDays(monday) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: formatDateKey(date),
      label: DAY_LABELS[index],
      date: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: "short" }),
      today: formatDateKey(date) === formatDateKey(new Date()),
    };
  });
}

function focusEntries(entries = []) {
  return entries.filter(
    (entry) => entry.date && entry.startTime && entry.endTime && entry.taskName,
  );
}

function minutesBetween(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const duration = endHour * 60 + endMinute - startHour * 60 - startMinute;
  return Number.isFinite(duration) ? Math.max(0, duration) : 0;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatDeadline(value) {
  if (!value) return "No deadline";
  const normalized = String(value).slice(0, 10);
  const date = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function entryKey(entry, index) {
  return entry.id || `${entry.date}:${entry.startTime}:${entry.taskName}:${index}`;
}

function restoredPreferences(schedule) {
  const saved = schedule?.planData?.generation?.preferences;
  if (!saved || typeof saved !== "object") return null;

  return {
    instructions:
      typeof saved.instructions === "string"
        ? saved.instructions
        : DEFAULT_PREFERENCES.instructions,
    focusStart:
      typeof saved.focusStart === "string"
        ? saved.focusStart
        : DEFAULT_PREFERENCES.focusStart,
    focusEnd:
      typeof saved.focusEnd === "string"
        ? saved.focusEnd
        : DEFAULT_PREFERENCES.focusEnd,
    sessionMinutes: [30, 45, 60, 90, 120].includes(Number(saved.sessionMinutes))
      ? Number(saved.sessionMinutes)
      : DEFAULT_PREFERENCES.sessionMinutes,
    includeWeekends:
      typeof saved.includeWeekends === "boolean"
        ? saved.includeWeekends
        : DEFAULT_PREFERENCES.includeWeekends,
  };
}

function AISchedulePage({ onAdd }) {
  const [schedule, setSchedule] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [showTimeMap, setShowTimeMap] = React.useState(false);
  const [weekStart, setWeekStart] = React.useState(() => mondayOfWeek(new Date()));
  const [activeDay, setActiveDay] = React.useState(formatDateKey(new Date()));
  const [preferences, setPreferences] = React.useState(DEFAULT_PREFERENCES);
  const [completed, setCompleted] = React.useState({});

  const applySchedule = React.useCallback((nextSchedule, restoreView = false) => {
    setSchedule(nextSchedule);
    if (restoreView) {
      const savedPreferences = restoredPreferences(nextSchedule);
      if (savedPreferences) setPreferences(savedPreferences);

      const savedWeekStart = nextSchedule?.planData?.generation?.preferences?.weekStart;
      if (/^\d{4}-\d{2}-\d{2}$/.test(savedWeekStart || "")) {
        const restoredWeek = mondayOfWeek(new Date(`${savedWeekStart}T12:00:00`));
        const restoredDays = weekDays(restoredWeek);
        const today = formatDateKey(new Date());
        setWeekStart(restoredWeek);
        setActiveDay(
          restoredDays.some((day) => day.key === today) ? today : restoredDays[0].key,
        );
      }
    }

    if (!nextSchedule?.id) {
      setCompleted({});
      return;
    }
    try {
      const saved = JSON.parse(
        localStorage.getItem(`planify:ai-completed:${nextSchedule.id}`) || "{}",
      );
      setCompleted(saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {});
    } catch {
      setCompleted({});
    }
  }, []);

  React.useEffect(() => {
    PlanifyAPI.getActiveSchedule()
      .then((nextSchedule) => applySchedule(nextSchedule, true))
      .catch((error) => notify(error.message || "Could not load your schedule"))
      .finally(() => setLoading(false));
  }, [applySchedule]);

  React.useEffect(() => {
    const days = weekDays(weekStart);
    if (!days.some((day) => day.key === activeDay)) {
      setActiveDay(days.find((day) => day.today)?.key || days[0].key);
    }
  }, [activeDay, weekStart]);

  const entries = focusEntries(schedule?.planData?.entries);
  const generation = schedule?.planData?.generation;
  const days = weekDays(weekStart);
  const weekEnd = days[6].key;
  const weekEntries = entries.filter(
    (entry) => entry.date >= days[0].key && entry.date <= weekEnd,
  );
  const dayEntries = weekEntries
    .filter((entry) => entry.date === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalMinutes = weekEntries.reduce(
    (sum, entry) => sum + minutesBetween(entry.startTime, entry.endTime),
    0,
  );
  const highPriorityCount = weekEntries.filter(
    (entry) => entry.priority?.toLowerCase() === "high",
  ).length;
  const nextDeadline = weekEntries
    .filter((entry) => entry.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate;

  const updatePreference = (field, value) => {
    setPreferences((current) => ({ ...current, [field]: value }));
  };

  const generate = async (event) => {
    event?.preventDefault();
    if (preferences.focusEnd <= preferences.focusStart) {
      notify("Focus end time must be later than the start time");
      return;
    }

    setGenerating(true);
    try {
      const nextSchedule = await PlanifyAPI.autoGenerateSchedule({
        ...preferences,
        weekStart: formatDateKey(weekStart),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      applySchedule(nextSchedule);
      const provider = nextSchedule.planData?.generation?.provider;
      notify(
        provider === "gemini"
          ? "Gemini built your new study plan"
          : "Schedule created with the local planner",
      );
    } catch (error) {
      notify(error.message || "Could not generate your schedule");
    } finally {
      setGenerating(false);
    }
  };

  const moveWeek = (amount) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + amount * 7);
    setWeekStart(next);
  };

  const goToToday = () => {
    setWeekStart(mondayOfWeek(new Date()));
    setActiveDay(formatDateKey(new Date()));
  };

  const toggleComplete = (entry, index) => {
    const key = entryKey(entry, index);
    setCompleted((current) => {
      const next = { ...current, [key]: !current[key] };
      if (schedule?.id) {
        try {
          localStorage.setItem(`planify:ai-completed:${schedule.id}`, JSON.stringify(next));
        } catch {
          // Keep the interaction usable even when browser storage is unavailable.
        }
      }
      return next;
    });
  };

  const providerLabel =
    generation?.provider === "gemini"
      ? generation.model || "Gemini"
      : generation?.provider === "local-fallback"
        ? "Local fallback"
        : "Ready to plan";
  const weekLabel = `${days[0].month} ${days[0].date} - ${days[6].month} ${days[6].date}`;

  return (
    <div className="page ai-schedule-page">
      <header className="page-head row ai-page-head">
        <div>
          <div className="page-eyebrow">
            <span
              className={`ai-provider-dot ${generation?.provider || "idle"}`}
              aria-hidden="true"
            />
            {providerLabel}
          </div>
          <h1 className="t-h1">AI Schedule</h1>
          <p className="t-mut">Turn your task list into a focused, deadline-aware study week.</p>
        </div>
        <button className="btn ghost" type="button" onClick={onAdd}>
          <IconPlus size={15} /> Add task
        </button>
      </header>

      <form className="ai-composer" onSubmit={generate} aria-busy={generating}>
        <div className="ai-composer-copy">
          <div className="ai-composer-title">
            <IconSpark size={18} />
            <div>
              <h2>Plan with Gemini</h2>
              <p>Gemini uses your pending tasks, deadlines, saved availability, and the controls below.</p>
            </div>
          </div>
          <label className="ai-prompt-label" htmlFor="schedule-instructions">
            Planning instructions
          </label>
          <textarea
            id="schedule-instructions"
            value={preferences.instructions}
            onChange={(event) => updatePreference("instructions", event.target.value)}
            placeholder="Example: Put calculus before lunch and keep Friday evening light."
            maxLength={800}
            rows={3}
            disabled={generating}
          />
          <div className="ai-prompt-presets" aria-label="Planning instruction presets">
            {["Prioritize urgent deadlines", "Keep evenings light", "Balance subjects evenly"].map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updatePreference("instructions", preset)}
                  aria-pressed={preferences.instructions === preset}
                  disabled={generating}
                >
                  {preset}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="ai-preferences">
          <div className="ai-field-group">
            <label htmlFor="focus-start">Focus window</label>
            <div className="ai-time-range">
              <input
                id="focus-start"
                type="time"
                value={preferences.focusStart}
                onChange={(event) => updatePreference("focusStart", event.target.value)}
                required
                disabled={generating}
              />
              <span>to</span>
              <input
                aria-label="Focus end time"
                type="time"
                value={preferences.focusEnd}
                onChange={(event) => updatePreference("focusEnd", event.target.value)}
                required
                disabled={generating}
              />
            </div>
          </div>
          <div className="ai-field-group">
            <label htmlFor="session-length">Session length</label>
            <select
              id="session-length"
              value={preferences.sessionMinutes}
              onChange={(event) => updatePreference("sessionMinutes", Number(event.target.value))}
              disabled={generating}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
          <label className="ai-weekend-toggle">
            <input
              type="checkbox"
              checked={preferences.includeWeekends}
              onChange={(event) => updatePreference("includeWeekends", event.target.checked)}
              disabled={generating}
            />
            <span>
              <strong>Use weekends</strong>
              <small>Include Saturday and Sunday when useful</small>
            </span>
          </label>
          <div className="ai-generate-actions">
            <button className="btn ai-generate-button" type="submit" disabled={generating}>
              <IconSpark size={15} />
              {generating ? "Building your plan..." : entries.length ? "Regenerate plan" : "Generate plan"}
            </button>
            <button className="btn ghost" type="button" onClick={() => setShowTimeMap(true)}>
              <IconClock size={15} /> Time map
            </button>
          </div>
        </div>
      </form>

      <TimeMapPopup open={showTimeMap} onClose={() => setShowTimeMap(false)} />

      <section className="ai-summary-strip" aria-label="Schedule summary">
        <div><span>Blocks</span><strong>{weekEntries.length}</strong></div>
        <div><span>Focus time</span><strong>{formatDuration(totalMinutes)}</strong></div>
        <div><span>High priority</span><strong>{highPriorityCount}</strong></div>
        <div><span>Next deadline</span><strong>{formatDeadline(nextDeadline)}</strong></div>
      </section>

      <div className="ai-week-toolbar">
        <div>
          <span className="t-eyebrow">Study week</span>
          <strong>{weekLabel}</strong>
        </div>
        <div className="ai-week-actions">
          <button className="btn ghost ai-icon-button" type="button" onClick={() => moveWeek(-1)} title="Previous week" aria-label="Previous week">
            <IconBack size={16} />
          </button>
          <button className="btn ghost" type="button" onClick={goToToday}>Today</button>
          <button className="btn ghost ai-icon-button" type="button" onClick={() => moveWeek(1)} title="Next week" aria-label="Next week">
            <IconArrow size={16} />
          </button>
        </div>
      </div>

      <div className="ai-day-tabs" role="tablist" aria-label="Days of the week">
        {days.map((day) => {
          const count = weekEntries.filter((entry) => entry.date === day.key).length;
          return (
            <button
              key={day.key}
              className={`${activeDay === day.key ? "active" : ""} ${day.today ? "today" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeDay === day.key}
              aria-current={day.today ? "date" : undefined}
              onClick={() => setActiveDay(day.key)}
            >
              <span>{day.label}</span>
              <strong>{day.date}</strong>
              <small>{count} {count === 1 ? "block" : "blocks"}</small>
            </button>
          );
        })}
      </div>

      <div className="ai-workspace">
        <section className="ai-timeline-panel">
          <div className="ai-section-head">
            <div>
              <span className="t-eyebrow">Daily timeline</span>
              <h2>{new Date(`${activeDay}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
            </div>
            <span className="ai-day-total">{formatDuration(dayEntries.reduce((sum, entry) => sum + minutesBetween(entry.startTime, entry.endTime), 0))}</span>
          </div>

          {loading || generating ? (
            <div className="ai-loading-state" role="status" aria-live="polite">
              <span />
              <span />
              <span />
              <p className="ai-loading-copy">
                {generating ? "Building your schedule" : "Loading your schedule"}
              </p>
            </div>
          ) : dayEntries.length ? (
            <div className="ai-timeline-list">
              {dayEntries.map((entry, index) => {
                const key = entryKey(entry, index);
                const isDone = Boolean(completed[key]);
                const rawPriority = entry.priority?.toLowerCase();
                const priority = ["high", "medium", "low"].includes(rawPriority)
                  ? rawPriority
                  : "medium";
                return (
                  <article className={`ai-focus-row priority-${priority} ${isDone ? "complete" : ""}`} key={key}>
                    <div className="ai-focus-time">
                      <strong>{entry.startTime}</strong>
                      <span>{entry.endTime}</span>
                    </div>
                    <div className="ai-focus-copy">
                      <div className="ai-focus-meta">
                        <span>{entry.subject || `${entry.priority || "Medium"} priority`}</span>
                        {entry.dueDate ? <span>Due {formatDeadline(entry.dueDate)}</span> : null}
                      </div>
                      <h3>{entry.taskName}</h3>
                      {entry.reason ? <p>{entry.reason}</p> : null}
                    </div>
                    <button
                      className="ai-complete-button"
                      type="button"
                      onClick={() => toggleComplete(entry, index)}
                      title={isDone ? "Mark incomplete" : "Mark complete"}
                      aria-label={isDone ? `Mark ${entry.taskName} incomplete` : `Mark ${entry.taskName} complete`}
                      aria-pressed={isDone}
                    >
                      <IconCheck size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="ai-empty-state">
              <IconCal size={24} />
              <h3>No focus blocks on this day</h3>
              <p>{entries.length ? "Choose another day or regenerate with different preferences." : "Add pending tasks, then ask Gemini to build your week."}</p>
              {!entries.length ? <button className="btn ghost" type="button" onClick={onAdd}><IconPlus size={14} /> Add your first task</button> : null}
            </div>
          )}
        </section>

        <aside className="ai-insights-column">
          <section className="ai-insight-panel">
            <div className="ai-section-head compact">
              <div>
                <span className="t-eyebrow">Plan intelligence</span>
                <h2>Why this works</h2>
              </div>
              <IconSpark size={17} />
            </div>
            <p className="ai-generation-summary">
              {generation?.summary || "Generate a plan to see the scheduling strategy and workload decisions."}
            </p>
            {Array.isArray(generation?.strategyNotes) && generation.strategyNotes.length ? (
              <ul className="ai-strategy-list">
                {generation.strategyNotes.map((note, index) => <li key={`${note}:${index}`}>{note}</li>)}
              </ul>
            ) : null}
            {generation?.provider === "local-fallback" ? (
              <div className="ai-fallback-note">Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> to enable Gemini planning.</div>
            ) : null}
          </section>

          <section className="ai-load-panel">
            <div className="ai-section-head compact">
              <div>
                <span className="t-eyebrow">Weekly load</span>
                <h2>Focus distribution</h2>
              </div>
            </div>
            <div className="ai-load-list">
              {days.map((day) => {
                const minutes = weekEntries
                  .filter((entry) => entry.date === day.key)
                  .reduce((sum, entry) => sum + minutesBetween(entry.startTime, entry.endTime), 0);
                const maxMinutes = Math.max(
                  60,
                  ...days.map((item) => weekEntries
                    .filter((entry) => entry.date === item.key)
                    .reduce((sum, entry) => sum + minutesBetween(entry.startTime, entry.endTime), 0)),
                );
                return (
                  <div className="ai-load-row" key={day.key}>
                    <span>{day.label}</span>
                    <div><i style={{ width: `${(minutes / maxMinutes) * 100}%` }} /></div>
                    <strong>{formatDuration(minutes)}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { AISchedulePage });
export { AISchedulePage };
