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

function estimateDuration(task) {
  if (task.type === "break") return 15;
  if (task.priority === "high") return 90;
  return 60;
}

export function deterministicSchedule(tasks) {
  if (!tasks.length) return [];

  const sorted = sortTasks(tasks);
  const entries = [];
  let dayOffset = 0;
  let cursor = 0;

  for (const task of sorted) {
    const date = dateFromOffset(dayOffset);
    const dayIndex = date.getDay();
    const config = getDayConfig(dayIndex);
    const dayName = DAY_NAMES[dayIndex];
    const dayStart = config.start * 60;
    const dayEnd = config.end * 60;
    const hasLunch = config.lunchStart !== undefined;
    const lunchStart = hasLunch ? config.lunchStart * 60 : null;
    const lunchEnd = hasLunch ? config.lunchEnd * 60 : null;

    if (cursor === 0) cursor = dayStart;

    const duration = estimateDuration(task);

    if (cursor + duration > dayEnd) {
      dayOffset++;
      cursor = 0;
      continue;
    }

    if (hasLunch && cursor < lunchStart && cursor + duration > lunchStart) {
      cursor = lunchEnd;
    }

    if (cursor + duration > dayEnd) {
      dayOffset++;
      cursor = 0;
      continue;
    }

    const startMin = cursor;
    const endMin = cursor + duration;

    entries.push({
      taskName: task.title,
      priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      day: dayName,
      date: formatDate(date),
      startTime: formatTime(startMin),
      endTime: formatTime(endMin),
      dueDate: task.deadline
        ? (typeof task.deadline === "string" ? task.deadline : formatDate(new Date(task.deadline)))
        : null,
    });

    cursor = endMin + BREAK_MIN;

    if (cursor >= dayEnd) {
      dayOffset++;
      cursor = 0;
    }
  }

  return entries;
}
