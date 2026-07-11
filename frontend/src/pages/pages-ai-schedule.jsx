import React from "react";
import PlanifyAPI from "../api.jsx";
import { notify } from "../data.jsx";
import { IconPlus, IconSpark } from "../components/icons.jsx";
import { TimeMapPopup } from "../components/time-map.jsx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mondayOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(dateKey) {
  return dateKey === formatDateKey(new Date());
}

function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: formatDateKey(d),
      label: DAY_LABELS[i],
      date: d.getDate(),
      today: isToday(formatDateKey(d)),
    };
  });
}

function entriesInWeek(entries, monday) {
  const start = formatDateKey(monday);
  const nextMon = new Date(monday);
  nextMon.setDate(monday.getDate() + 7);
  const end = formatDateKey(nextMon);
  return entries.filter((e) => e.date >= start && e.date < end);
}

function AISchedulePage({ onAdd }) {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [weekStart, setWeekStart] = React.useState(() =>
    mondayOfWeek(new Date()),
  );
  const [activeDay, setActiveDay] = React.useState(null);
  const [doneBlocks, setDoneBlocks] = React.useState({});

  React.useEffect(() => {
    PlanifyAPI.getActiveSchedule()
      .then((s) => setEntries(s.planData?.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const today = formatDateKey(new Date());
    const days = weekDays(weekStart);
    const found = days.find((d) => d.today);
    if (found && !days.some((d) => d.key === activeDay)) {
      setActiveDay(found.key);
    } else if (!activeDay) {
      setActiveDay(days[0].key);
    }
  }, [weekStart]);

  const generate = async () => {
    setGenerating(true);
    try {
      const schedule = await PlanifyAPI.autoGenerateSchedule();
      setEntries(schedule.planData?.entries || []);
      notify("Schedule generated from your tasks");
    } catch (e) {
      notify(e.message || "Could not generate schedule");
    } finally {
      setGenerating(false);
    }
  };

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

  const days = weekDays(weekStart);
  const weekEntries = entriesInWeek(entries, weekStart);
  const dayEntries = weekEntries.filter((e) => e.date === activeDay);
  const doneCount = dayEntries.filter(
    (e) => doneBlocks[e.taskName + e.startTime],
  ).length;
  const toggleDone = (e) =>
    setDoneBlocks((d) => ({
      ...d,
      [e.taskName + e.startTime]: !d[e.taskName + e.startTime],
    }));

  const weekLabel = `${days[0].key.slice(5)}/${days[0].date} – ${days[6].key.slice(5)}/${days[6].date}`;

  const [showTimeMap, setShowTimeMap] = React.useState(false);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <div className="page-eyebrow">
            {entries.length
              ? `Generated · ${entries.length} tasks scheduled`
              : "No schedule yet"}
          </div>
          <h1 className="t-h1" style={{ marginTop: 8 }}>
            AI Schedule
          </h1>
          <div className="t-mut" style={{ marginTop: 8 }}>
            An optimized study plan based on your tasks, deadlines and
            priorities.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost" onClick={onAdd}>
            <IconPlus size={14} /> Manual event
          </button>
        </div>
      </div>

      <div className="ai-banner">
        <div className="icon-wrap">
          <IconSpark size={22} />
        </div>
        <div>
          <h3>AI-Optimized Schedule</h3>
          <p>
            Click "Generate from my tasks" to create a personalized weekly
            schedule based on your pending tasks, deadlines, and priorities.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="regen" onClick={generate} disabled={generating}>
            <span
              style={{
                display: "inline-block",
                transition: "transform .6s",
                transform: generating ? "rotate(360deg)" : "none",
              }}
            >
              ↻
            </span>
            {generating ? "Generating" : "Generate from my tasks"}
          </button>
          <button
            className="btn ghost"
            onClick={() => setShowTimeMap(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            {" "}
            Time Map
          </button>
        </div>
      </div>

      <TimeMapPopup open={showTimeMap} onClose={() => setShowTimeMap(false)} />

      <div style={{ height: 32 }} />

      <div className="week-nav">
        <button className="btn ghost" onClick={goPrevWeek}>
          ← Prev
        </button>
        <span className="week-label">{weekLabel}</span>
        <button className="btn ghost" onClick={goNextWeek}>
          Next →
        </button>
      </div>

      <div style={{ height: 16 }} />

      <div className="day-pills">
        {days.map((d) => {
          const count = weekEntries.filter((e) => e.date === d.key).length;
          return (
            <button
              key={d.key}
              className={
                "day-pill" +
                (activeDay === d.key ? " on" : "") +
                (d.today ? " today" : "")
              }
              onClick={() => setActiveDay(d.key)}
            >
              <span className="d">{d.label}</span>
              <span className="n">{d.date}</span>
              <span className="meta">{count} blocks</span>
            </button>
          );
        })}
      </div>

      <div style={{ height: 24 }} />

      <div className="ai-grid">
        <div className="ai-day">
          <div className="t-mut" style={{ marginBottom: 12 }}>
            {loading
              ? "Loading..."
              : generating
                ? "Generating..."
                : dayEntries.length
                  ? `Click a block to mark it complete · ${doneCount}/${dayEntries.length} done`
                  : "No tasks scheduled for this day."}
          </div>
          {dayEntries.map((e, i) => {
            const isDone = !!doneBlocks[e.taskName + e.startTime];
            return (
              <div key={i} className="ai-row">
                <div className="time">{e.startTime}</div>
                <div
                  className={
                    "block busy" +
                    (e.priority === "High" ? " urgent" : "") +
                    (isDone ? " done" : "")
                  }
                  onClick={() => toggleDone(e)}
                  title={isDone ? "Mark as not done" : "Mark as done"}
                >
                  <div className="subj">
                    <span>
                      {e.priority === "High"
                        ? "High Priority"
                        : e.priority === "Medium"
                          ? "Medium Priority"
                          : "Low Priority"}
                    </span>
                  </div>
                  <div className="title">{e.taskName}</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <span className="t-mut" style={{ fontSize: 12 }}>
                      {e.startTime} – {e.endTime}
                    </span>
                    {e.dueDate ? (
                      <span
                        className="t-mut"
                        style={{ fontSize: 11, color: "var(--urgent)" }}
                      >
                        due {e.dueDate}
                      </span>
                    ) : null}
                  </div>
                  {isDone ? (
                    <div
                      className="badge-end"
                      style={{ background: "var(--ok)" }}
                    >
                      DONE
                    </div>
                  ) : e.priority === "High" ? (
                    <div className="badge-end">DEADLINE</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="insight">
            <div className="eyebrow">
              <IconSpark size={11} /> Why this plan
            </div>
            <div className="body">
              High-priority tasks are placed in morning peak hours. Tasks with
              earlier deadlines are scheduled first. Subjects are balanced
              across the week.
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ padding: "18px 20px" }}>
              <h3 className="t-h3">Day balance</h3>
            </div>
            <div
              className="panel-pad"
              style={{
                padding: "14px 20px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {[
                { lbl: "High priority", color: "var(--urgent)" },
                { lbl: "Medium priority", color: "var(--accent)" },
                { lbl: "Low priority", color: "var(--muted)" },
              ].map((b) => {
                const count = entries.filter(
                  (e) => e.priority === b.lbl.split(" ")[0],
                ).length;
                const total = entries.length || 1;
                return (
                  <div key={b.lbl}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <span>{b.lbl}</span>
                      <span className="tnum" style={{ color: "var(--muted)" }}>
                        {count} tasks
                      </span>
                    </div>
                    <div
                      className="progressbar"
                      style={{
                        height: 4,
                        background: "var(--bg-sunken)",
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          width: (count / total) * 100 + "%",
                          height: "100%",
                          background: b.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AISchedulePage });
export { AISchedulePage };
