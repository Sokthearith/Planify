import { Schedule, Task } from "../models/index.js";
import { emitToUser } from "./realtime.js";

const DEFAULT_TIMEZONE = "UTC";

const pad = (value) => String(value).padStart(2, "0");

const dateKeyInTimezone = (value, timezone = DEFAULT_TIMEZONE) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const normalizePlanData = (planData, timezone = DEFAULT_TIMEZONE) => {
  if (Array.isArray(planData)) {
    return { timezone, entries: planData };
  }

  if (planData && typeof planData === "object") {
    return {
      ...planData,
      timezone: planData.timezone || timezone,
      entries: Array.isArray(planData.entries) ? planData.entries : [],
    };
  }

  return { timezone, entries: [] };
};

const defaultDeadlineTime = (entries, date, rows = []) => {
  const used = new Set(entries.filter((entry) => entry.date === date).map((entry) => entry.time));
  for (const time of rows) {
    if (!used.has(time)) return time;
  }
  for (let hour = 9; hour <= 18; hour += 1) {
    const time = `${pad(hour)}:00`;
    if (!used.has(time)) return time;
  }
  return "18:00";
};

const deadlineEntryForTask = (task, entries, timezone, rows = []) => {
  const date = dateKeyInTimezone(task.deadline, timezone);
  if (!date) return null;

  const existing = entries.find((entry) => entry.sourceType === "task-deadline" && entry.sourceId === task.id);

  const deadlineTime = () => {
    const d = new Date(task.deadline);
    if (isNaN(d.getTime())) return defaultDeadlineTime(entries, date, rows);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    id: existing?.id || `task:${task.id}`,
    sourceType: "task-deadline",
    sourceId: task.id,
    taskId: task.id,
    date,
    time: existing?.manualTime ? existing.time : deadlineTime(),
    manualTime: Boolean(existing?.manualTime),
    title: task.title,
    subj: task.subject || "Task",
    priority: task.priority,
    status: task.status,
    done: task.status === "done",
    urgent: task.priority === "high",
    kind: "deadline",
  };
};

export const syncTaskDeadlinesForSchedule = async (schedule, options = {}) => {
  const timezone = options.timezone || schedule.planData?.timezone || DEFAULT_TIMEZONE;
  const planData = normalizePlanData(schedule.planData, timezone);
  const rows = Array.isArray(planData.rows) ? planData.rows : [];
  const manualEntries = planData.entries.filter((entry) => entry.sourceType !== "task-deadline");
  const oldDeadlineEntries = planData.entries.filter((entry) => entry.sourceType === "task-deadline");

  const tasks = await Task.findAll({
    where: { userId: schedule.userId, groupId: null },
    order: [["deadline", "ASC"]],
  });

  const taskEntries = tasks
    .filter((task) => task.deadline)
    .map((task) => deadlineEntryForTask(task, [...manualEntries, ...oldDeadlineEntries], timezone, rows))
    .filter(Boolean);

  const nextPlanData = {
    ...planData,
    timezone,
    entries: [...manualEntries, ...taskEntries],
  };

  await schedule.update({ planData: nextPlanData });
  return schedule;
};

export const syncUserSchedulesWithTaskDeadlines = async (userId, options = {}) => {
  let schedules = await Schedule.findAll({ where: { userId } });
  if (schedules.length === 0) {
    schedules = [
      await Schedule.create({
        userId,
        isActive: true,
        planData: { timezone: options.timezone || DEFAULT_TIMEZONE, entries: [] },
      }),
    ];
  }
  const synced = [];

  for (const schedule of schedules) {
    await syncTaskDeadlinesForSchedule(schedule, options);
    synced.push(schedule);
    emitToUser(userId, "schedule:updated", schedule);
  }

  return synced;
};

export const ensureActiveSchedule = async (userId, timezone = DEFAULT_TIMEZONE) => {
  let schedule = await Schedule.findOne({ where: { userId, isActive: true } });
  if (!schedule) {
    schedule = await Schedule.create({
      userId,
      isActive: true,
      planData: { timezone, entries: [] },
    });
  }

  await syncTaskDeadlinesForSchedule(schedule, { timezone });
  return schedule;
};

export const normalizeSchedulePayload = (planData, timezone = DEFAULT_TIMEZONE) => {
  const normalized = normalizePlanData(planData, timezone);
  return {
    ...normalized,
    entries: normalized.entries.map((entry) => ({
      ...entry,
      id: entry.id || `manual:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      sourceType: entry.sourceType || "manual",
      kind: entry.kind || "manual",
    })),
  };
};
