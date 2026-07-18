import { Schedule } from "../models/index.js";
import { emitToUser } from "../utils/realtime.js";
import {
  findActiveSchedule,
  normalizeSchedulePayload,
  syncTaskDeadlinesForSchedule,
} from "../utils/scheduleSync.js";
import { autoScheduleTasks, handleSmartScheduler } from "../services/genai.js";
import { deterministicSchedule } from "../services/scheduler.js";
import { Op } from "sequelize";
import {
  GroupTask,
  GroupTaskAssignee,
  Task,
  UserAvailability,
} from "../models/index.js";

const getScheduleForUser = (scheduleId, userId) => {
  return Schedule.findOne({ where: { id: scheduleId, userId } });
};

const pickScheduleFields = (body) => {
  const fields = {};
  ["planData", "isActive", "timezone"].forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });
  return fields;
};

const validateSchedule = ({ planData }, requirePlan = false) => {
  if (requirePlan && (planData === undefined || planData === null)) {
    return { message: "planData is required" };
  }
  return null;
};

const setActiveSchedule = async (schedule, userId) => {
  await Schedule.update({ isActive: false }, { where: { userId } });
  await schedule.update({ isActive: true });
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const dateInTimezone = (date, timezone) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const dateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && DATE_PATTERN.test(value.slice(0, 10))) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10);
};

const startOfCurrentWeek = (timezone) => {
  const todayStr = dateInTimezone(new Date(), timezone);
  const today = new Date(`${todayStr}T00:00:00.000Z`);
  const day = today.getUTCDay();
  today.setUTCDate(today.getUTCDate() - day + (day === 0 ? -6 : 1));
  return today.toISOString().slice(0, 10);
};

const normalizePreferences = (body = {}) => {
  const allowedSessions = [30, 45, 60, 90, 120];
  const sessionMinutes = Number(body.sessionMinutes);
  return {
    weekStart: DATE_PATTERN.test(body.weekStart || "")
      ? body.weekStart
      : startOfCurrentWeek(body.timezone),
    timezone:
      typeof body.timezone === "string" && body.timezone.length <= 80
        ? body.timezone
        : "UTC",
    focusStart: TIME_PATTERN.test(body.focusStart || "")
      ? body.focusStart
      : "08:00",
    focusEnd: TIME_PATTERN.test(body.focusEnd || "") ? body.focusEnd : "20:00",
    sessionMinutes: allowedSessions.includes(sessionMinutes)
      ? sessionMinutes
      : 60,
    includeWeekends: body.includeWeekends !== false,
    instructions:
      typeof body.instructions === "string"
        ? body.instructions.trim().slice(0, 800)
        : "",
  };
};

const timeInMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const normalizeGeminiEntries = (
  result,
  tasks,
  preferences,
  availability = [],
) => {
  const { weekStart, timezone } = preferences;
  const today = new Date(
    `${dateInTimezone(new Date(), timezone)}T00:00:00.000Z`,
  );
  const firstDay = new Date(
    Math.max(new Date(`${weekStart}T00:00:00.000Z`).getTime(), today.getTime()),
  );
  const lastDay = new Date(firstDay);
  lastDay.setUTCDate(lastDay.getUTCDate() + 6);
  const lastEndByDate = new Map();

  const entries = (Array.isArray(result?.entries) ? result.entries : [])
    .map((entry, index) => {
      const match = /^T(\d+)$/.exec(entry.taskRef || "");
      const task = match ? tasks[Number(match[1]) - 1] : null;
      if (!task || !DATE_PATTERN.test(entry.date || "")) return null;
      if (
        !TIME_PATTERN.test(entry.startTime || "") ||
        !TIME_PATTERN.test(entry.endTime || "")
      )
        return null;
      if (entry.endTime <= entry.startTime) return null;

      const entryDate = new Date(`${entry.date}T00:00:00.000Z`);
      if (entryDate < firstDay || entryDate > lastDay) return null;
      const dayOfWeek = entryDate.getUTCDay();
      if (!preferences.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6))
        return null;
      if (
        entry.startTime < preferences.focusStart ||
        entry.endTime > preferences.focusEnd
      )
        return null;
      const deadlinePast = task.deadline
        ? new Date(`${task.deadline}T23:59:59.000Z`) < today
        : false;
      if (!deadlinePast && task.deadline && entry.date > task.deadline)
        return null;

      const daySlots = availability.filter(
        (slot) => slot.dayOfWeek === dayOfWeek,
      );
      const availableSlots = daySlots.filter(
        (slot) => slot.type === "available",
      );
      const isInsideAvailability =
        !availableSlots.length ||
        availableSlots.some(
          (slot) =>
            entry.startTime >= slot.startTime && entry.endTime <= slot.endTime,
        );
      const overlapsBlockedTime = daySlots
        .filter((slot) => slot.type === "blocked")
        .some(
          (slot) =>
            entry.startTime < slot.endTime && entry.endTime > slot.startTime,
        );
      if (!isInsideAvailability || overlapsBlockedTime) return null;

      return {
        id: `ai:${Date.now()}:${index}`,
        sourceType: "ai-schedule",
        sourceId: task.id,
        kind: "focus",
        taskName: task.title,
        subject: task.subject || "General",
        priority:
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
        day: DAY_NAMES[entryDate.getUTCDay()],
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        dueDate: dateKey(task.deadline),
        reason:
          typeof entry.reason === "string" ? entry.reason.slice(0, 180) : "",
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    )
    .filter((entry) => {
      const lastEnd = lastEndByDate.get(entry.date);
      if (
        lastEnd !== undefined &&
        timeInMinutes(entry.startTime) < lastEnd + 10
      ) {
        return false;
      }
      lastEndByDate.set(entry.date, timeInMinutes(entry.endTime));
      return true;
    });

  if (!entries.length)
    throw new Error("Gemini returned no valid schedule entries");
  const scheduledTaskIds = new Set(entries.map((entry) => entry.sourceId));
  if (tasks.some((task) => !scheduledTaskIds.has(task.id))) {
    throw new Error("Gemini returned an incomplete schedule");
  }
  return entries;
};

export const createSchedule = async (req, res) => {
  const scheduleData = pickScheduleFields(req.body);
  const error = validateSchedule(scheduleData, true);
  if (error) return res.status(400).json(error);

  const schedule = await Schedule.create({
    planData: normalizeSchedulePayload(
      scheduleData.planData,
      scheduleData.timezone,
    ),
    isActive: Boolean(scheduleData.isActive),
    userId: req.user.id,
  });

  if (schedule.isActive) await setActiveSchedule(schedule, req.user.id);
  await syncTaskDeadlinesForSchedule(schedule, {
    timezone: scheduleData.timezone,
  });
  emitToUser(req.user.id, "schedule:created", schedule);

  res.status(201).json(schedule);
};

export const getActiveSchedule = async (req, res) => {
  const schedule = await findActiveSchedule(req.user.id);
  res.json(schedule);
};

export const getMySchedules = async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.active === "true") where.isActive = true;
  if (req.query.active === "false") where.isActive = false;

  const schedules = await Schedule.findAll({
    where,
    order: [["generatedAt", "DESC"]],
  });

  res.json(schedules);
};

export const getScheduleById = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  res.json(schedule);
};

export const updateSchedule = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  const scheduleData = pickScheduleFields(req.body);
  const error = validateSchedule(scheduleData);
  if (error) return res.status(400).json(error);

  const updates = {};
  if (scheduleData.planData !== undefined) {
    updates.planData = normalizeSchedulePayload(
      scheduleData.planData,
      scheduleData.timezone,
    );
  }
  if (scheduleData.isActive !== undefined)
    updates.isActive = scheduleData.isActive;

  await schedule.update(updates);
  if (scheduleData.isActive) await setActiveSchedule(schedule, req.user.id);
  await syncTaskDeadlinesForSchedule(schedule, {
    timezone: scheduleData.timezone,
  });
  emitToUser(req.user.id, "schedule:updated", schedule);

  res.json(schedule);
};

export const deleteSchedule = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  await schedule.destroy();
  emitToUser(req.user.id, "schedule:deleted", { id: req.params.id });
  res.json({ message: "Schedule deleted" });
};

export const generateScheduleFromText = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "prompt is required" });

  const entries = await handleSmartScheduler(prompt);
  const schedule = await Schedule.create({
    planData: { entries },
    isActive: true,
    userId: req.user.id,
  });

  res.status(201).json(schedule);
};
export const autoGenerateSchedule = async (req, res) => {
  const [personalTasks, groupTasks, availability] = await Promise.all([
    Task.findAll({
      where: { userId: req.user.id, status: ["pending", "in_progress"] },
      order: [["deadline", "ASC"]],
    }),
    GroupTask.findAll({
      where: {
        [Op.or]: [
          { createBy: req.user.id },
          { "$assigneeLinks.userId$": req.user.id },
        ],
        done: false,
      },
      include: [
        {
          model: GroupTaskAssignee,
          as: "assigneeLinks",
          attributes: [],
          required: false,
        },
      ],
      order: [["dueDate", "ASC"]],
    }),
    UserAvailability.findAll({ where: { userId: req.user.id } }),
  ]);

  const allTasks = [
    ...personalTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      subject: t.subject || "General",
      deadline: dateKey(t.deadline),
      estimatedHours: t.estimatedHours,
      type: "personal",
    })),
    ...groupTasks.map((t) => ({
      id: t.id,
      title: t.title + " (group)",
      priority: t.priority,
      subject: "Group",
      deadline: dateKey(t.dueDate),
      estimatedHours: t.estimatedHours,
      type: "group",
    })),
  ];

  if (!allTasks.length) {
    return res.status(400).json({ message: "No pending tasks to schedule" });
  }

  const preferences = normalizePreferences(req.body);
  if (preferences.focusEnd <= preferences.focusStart) {
    return res.status(400).json({
      message: "focusEnd must be later than focusStart",
    });
  }
  let entries;
  let generation;

  try {
    const result = await autoScheduleTasks(allTasks, {
      ...preferences,
      availability: availability.map((slot) => slot.toJSON()),
    });
    entries = normalizeGeminiEntries(
      result,
      allTasks,
      preferences,
      availability,
    );
    generation = {
      provider: "bazaar",
      model: result.model,
      summary: result.summary,
      strategyNotes: Array.isArray(result.strategyNotes)
        ? result.strategyNotes.slice(0, 4)
        : [],
      preferences,
    };
  } catch (error) {
    console.warn(`Bazaar schedule fallback: ${error.message}`);
    entries = deterministicSchedule(allTasks, availability, preferences);
    generation = {
      provider: "local-fallback",
      model: null,
      summary:
        error.code === "BAZAARLINK_NOT_CONFIGURED"
          ? "Generated locally because the BazaarLink API key is not configured."
          : "Generated locally because Gemini was temporarily unavailable.",
      strategyNotes: [
        "Tasks are ordered by priority and deadline.",
        "Saved availability is used when present.",
      ],
      preferences,
    };
  }

  const schedule = await Schedule.create({
    planData: {
      timezone: preferences.timezone,
      entries,
      generation,
    },
    userId: req.user.id,
  });

  await setActiveSchedule(schedule, req.user.id);
  emitToUser(req.user.id, "schedule:created", schedule);

  res.status(201).json(schedule);
};
