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

function getFallbackWindows(dayIndex, options = {}) {
  if (options.includeWeekends === false && (dayIndex === 0 || dayIndex === 6)) {
    return [];
  }
  const config = getDayConfig(dayIndex);
  const preferredStart = options.focusStart ? timeToMinutes(options.focusStart) : config.start * 60;
  const preferredEnd = options.focusEnd ? timeToMinutes(options.focusEnd) : config.end * 60;
  const start = Math.max(config.start * 60, preferredStart);
  const end = Math.min(config.end * 60, preferredEnd);
  if (end <= start) return [];
  if (config.lunchStart !== undefined && config.lunchEnd !== undefined) {
    return [
      { start, end: Math.min(end, config.lunchStart * 60) },
      { start: Math.max(start, config.lunchEnd * 60), end },
    ].filter((window) => window.end > window.start);
  }
  return [{ start, end }];
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

function buildAvailabilityMap(availability, options = {}) {
  const map = {};
  for (let i = 0; i < 7; i++) {
    if (options.includeWeekends === false && (i === 0 || i === 6)) {
      map[i] = [];
      continue;
    }
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

    const focusStart = options.focusStart ? timeToMinutes(options.focusStart) : 0;
    const focusEnd = options.focusEnd ? timeToMinutes(options.focusEnd) : 24 * 60;
    map[i] = subtractWindows(available, blocked)
      .map((window) => ({
        start: Math.max(window.start, focusStart),
        end: Math.min(window.end, focusEnd),
      }))
      .filter((window) => window.end > window.start);
  }
  return map;
}

function dateFromOffset(offset, startDate) {
  const d = startDate ? new Date(`${startDate}T12:00:00`) : new Date();
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

function chunkSize(task, sessionMinutes) {
  if (sessionMinutes) return sessionMinutes;
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

export function deterministicSchedule(tasks, availability = null, options = {}) {
  if (!tasks.length) return [];

  const availabilityMap = availability?.length
    ? buildAvailabilityMap(availability, options)
    : null;

  const sorted = sortTasks(tasks);
  const entries = [];
  let dayOffset = 0;
  let cursor = 0;

  for (const task of sorted) {
    let remaining = totalMinutes(task);
    const chunk = chunkSize(task, options.sessionMinutes);
    const totalSessions = Math.ceil(remaining / chunk);
    let sessionCount = 0;

    while (remaining > 0) {
      const date = dateFromOffset(dayOffset, options.weekStart);
      const dayIndex = date.getDay();
      const dayName = DAY_NAMES[dayIndex];

      const windows = availabilityMap
        ? availabilityMap[dayIndex]
        : getFallbackWindows(dayIndex, options);

      const largestWindow = windows.reduce(
        (largest, window) => Math.max(largest, window.end - window.start),
        0,
      );
      if (!largestWindow) {
        dayOffset++;
        cursor = 0;
        continue;
      }

      const currentChunk = Math.min(chunk, remaining, largestWindow);
      const sessionInfo = totalSessions > 1
        ? { current: sessionCount + 1, total: Math.max(totalSessions, sessionCount + 1) }
        : undefined;
      const result = placeEntry(task, currentChunk, date, dayName, windows, cursor, sessionInfo);

      if (!result.placed) {
        dayOffset++;
        cursor = 0;
        continue;
      }

      entries.push(result.entry);
      sessionCount++;
      remaining -= currentChunk;
      cursor = result.cursor;
    }
  }

  return entries;
}
