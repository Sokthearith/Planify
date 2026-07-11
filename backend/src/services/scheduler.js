const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const BREAK_MIN = 15;

const DAY_CONFIG = {
  weekday: { start: 8, end: 20, lunchStart: 12, lunchEnd: 13 },
  weekend: { start: 10, end: 16 },
};

function getDayConfig(dayIndex) {
  return dayIndex === 0 || dayIndex === 6 ? DAY_CONFIG.weekend : DAY_CONFIG.weekday;
}

function getFallbackWindows(dayIndex) {
  const config = getDayConfig(dayIndex);
  if (config.lunchStart !== undefined && config.lunchEnd !== undefined) {
    return [
      { start: config.start * 60, end: config.lunchStart * 60 },
      { start: config.lunchEnd * 60, end: config.end * 60 },
    ];
  }
  return [{ start: config.start * 60, end: config.end * 60 }];
}

function timeToMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function subtractWindows(avail, blocked) {
  let windows = [...avail];
  for (const b of blocked) {
    windows = windows.flatMap(w => {
      if (b.start >= w.end || b.end <= w.start) return [w];
      const parts = [];
      if (b.start > w.start) parts.push({ start: w.start, end: b.start });
      if (b.end < w.end) parts.push({ start: b.end, end: w.end });
      return parts;
    });
  }
  return windows;
}

function buildAvailabilityMap(availability) {
  const map = {};
  for (let i = 0; i < 7; i++) {
    const available = [];
    const blocked = [];

    for (const slot of availability) {
      if (slot.dayOfWeek !== i) continue;
      const win = { start: timeToMinutes(slot.startTime), end: timeToMinutes(slot.endTime) };
      if (slot.type === "available") available.push(win);
      else if (slot.type === "blocked") blocked.push(win);
    }

    if (available.length === 0) {
      available.push({ start: 6 * 60, end: 23 * 60 });
    }

    available.sort((a, b) => a.start - b.start);
    blocked.sort((a, b) => a.start - b.start);

    map[i] = subtractWindows(available, blocked);
  }
  return map;
}

function dateFromOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return typeof iso === "string" ? iso : null;
  const date = formatDate(d);
  const h = d.getHours();
  const min = d.getMinutes();
  if (h === 0 && min === 0) return date;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${date} ${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const pa = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (pa !== 0) return pa;
    return new Date(a.deadline || 0) - new Date(b.deadline || 0);
  });
}

function totalMinutes(task) {
  if (task.type === "break") return 15;
  if (task.estimatedHours) return Math.round(task.estimatedHours * 60);
  if (task.priority === "high") return 90;
  return 60;
}

function chunkSize(task) {
  if (task.priority === "high") return 90;
  return 60;
}

function createEntry(task, startMin, endMin, date, dayName, sessionInfo) {
  let taskName = task.title;
  if (sessionInfo) {
    taskName += ` (${sessionInfo.current}/${sessionInfo.total})`;
  }

  return {
    taskName,
    priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
    day: dayName,
    date: formatDate(date),
    startTime: formatTime(startMin),
    endTime: formatTime(endMin),
    dueDate: formatDateTime(task.deadline),
  };
}

function placeEntry(task, chunkMinutes, date, dayName, windows, cursor, sessionInfo) {
  for (const win of windows) {
    if (win.end <= cursor) continue;
    const effectiveCursor = Math.max(cursor, win.start);

    if (effectiveCursor + chunkMinutes <= win.end) {
      const entry = createEntry(task, effectiveCursor, effectiveCursor + chunkMinutes, date, dayName, sessionInfo);
      return { placed: true, entry, cursor: effectiveCursor + chunkMinutes + BREAK_MIN };
    }
  }

  return { placed: false, cursor: 0 };
}

export function deterministicSchedule(tasks, availability = null) {
  if (!tasks.length) return [];

  const availabilityMap = availability?.length
    ? buildAvailabilityMap(availability)
    : null;

  const sorted = sortTasks(tasks);
  const entries = [];
  let dayOffset = 0;
  let cursor = 0;

  for (const task of sorted) {
    let remaining = totalMinutes(task);
    const chunk = chunkSize(task);
    const totalSessions = Math.ceil(remaining / chunk);
    let sessionCount = 0;

    while (remaining > 0) {
      const date = dateFromOffset(dayOffset);
      const dayIndex = date.getDay();
      const dayName = DAY_NAMES[dayIndex];

      const windows = availabilityMap
        ? availabilityMap[dayIndex]
        : getFallbackWindows(dayIndex);

      const currentChunk = Math.min(chunk, remaining);
      sessionCount++;

      const sessionInfo = totalSessions > 1 ? { current: sessionCount, total: totalSessions } : undefined;
      const result = placeEntry(task, currentChunk, date, dayName, windows, cursor, sessionInfo);

      if (!result.placed) {
        dayOffset++;
        cursor = 0;
        continue;
      }

      entries.push(result.entry);
      remaining -= currentChunk;
      cursor = result.cursor;
    }
  }

  return entries;
}
