import {
  GroupMember,
  GroupTask,
  GroupTaskAssignee,
  Schedule,
  StudyGroup,
  Task,
} from "../models/index.js";
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


const deadlineEntryForGroupTask = (task, group, entries, timezone, rows = []) => {
  const date = dateKeyInTimezone(task.dueDate, timezone);
  if (!date) return null;

  const sourceId = `group-task:${task.id}`;
  const existing = entries.find(
    (entry) => entry.sourceType === "group-task-deadline" && entry.sourceId === sourceId,
  );

  const deadlineTime = () => {
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return defaultDeadlineTime(entries, date, rows);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    id: existing?.id || sourceId,
    sourceType: "group-task-deadline",
    sourceId,
    groupTaskId: task.id,
    groupId: task.groupId,
    date,
    time: existing?.manualTime ? existing.time : deadlineTime(),
    manualTime: Boolean(existing?.manualTime),
    title: task.title,
    subj: group?.name || group?.subject || "Group task",
    priority: task.priority,
    status: task.done ? "done" : "pending",
    done: Boolean(task.done),
    urgent: task.priority === "high",
    kind: "deadline",
  };
};

export const syncTaskDeadlinesForSchedule = async (schedule, options = {}) => {
  const timezone = options.timezone || schedule.planData?.timezone || DEFAULT_TIMEZONE;
  const planData = normalizePlanData(schedule.planData, timezone);
  const rows = Array.isArray(planData.rows) ? planData.rows : [];
  const deadlineSourceTypes = new Set(["task-deadline", "group-task-deadline"]);
  const manualEntries = planData.entries.filter((entry) => !deadlineSourceTypes.has(entry.sourceType));
  const oldDeadlineEntries = planData.entries.filter((entry) => deadlineSourceTypes.has(entry.sourceType));

  const tasks = await Task.findAll({
    where: { userId: schedule.userId, groupId: null },
    order: [["deadline", "ASC"]],
  });

  const taskEntries = tasks
    .filter((task) => task.deadline)
    .map((task) => deadlineEntryForTask(task, [...manualEntries, ...oldDeadlineEntries], timezone, rows))
    .filter(Boolean);

  const memberships = await GroupMember.findAll({
    where: { userId: schedule.userId, status: "accepted" },
    attributes: ["groupId"],
  });
  const groupIds = memberships.map((membership) => membership.groupId);
  const groupTasks = groupIds.length
    ? await GroupTask.findAll({
        where: { groupId: groupIds },
        include: [
          { model: StudyGroup },
          {
            model: GroupTaskAssignee,
            as: "assigneeLinks",
            where: { userId: schedule.userId },
            attributes: [],
            required: true,
          },
        ],
        order: [["dueDate", "ASC"]],
      })
    : [];
  const groupTaskEntries = groupTasks
    .filter((task) => task.dueDate)
    .map((task) => deadlineEntryForGroupTask(
      task,
      task.StudyGroup,
      [...manualEntries, ...oldDeadlineEntries],
      timezone,
      rows,
    ))
    .filter(Boolean);

  const nextPlanData = {
    ...planData,
    timezone,
    entries: [...manualEntries, ...taskEntries, ...groupTaskEntries],
  };

  await schedule.update({ planData: nextPlanData });
  return schedule;
};

const schedulesForUser = async (userId, options = {}) => {
  let schedules = await Schedule.findAll({ where: { userId } });
  let created = false;
  if (schedules.length === 0 && options.createIfMissing !== false) {
    schedules = [
      await Schedule.create({
        userId,
        isActive: true,
        planData: { timezone: options.timezone || DEFAULT_TIMEZONE, entries: [] },
      }),
    ];
    created = true;
  }
  return { schedules, created };
};

const mutateUserSchedules = async (userIds, mutator, options = {}) => {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))];
  await Promise.all(ids.map(async (userId) => {
    const { schedules, created } = await schedulesForUser(userId, options);
    await Promise.all(schedules.map(async (schedule) => {
      const timezone = options.timezone || schedule.planData?.timezone || DEFAULT_TIMEZONE;
      const planData = normalizePlanData(schedule.planData, timezone);
      const rows = Array.isArray(planData.rows) ? planData.rows : [];
      const entries = mutator({
        entries: planData.entries,
        planData,
        rows,
        schedule,
        timezone,
        userId,
      });
      await schedule.update({ planData: { ...planData, timezone, entries } });
      emitToUser(userId, created ? "schedule:created" : "schedule:updated", schedule);
    }));
  }));
};

const replaceEntry = (entries, predicate, nextEntry) => {
  const withoutEntry = entries.filter((entry) => !predicate(entry));
  return nextEntry ? [...withoutEntry, nextEntry] : withoutEntry;
};

export const upsertTaskDeadlineForUser = async (userId, task, options = {}) => {
  await mutateUserSchedules(userId, ({ entries, rows, timezone }) => {
    const predicate = (entry) =>
      entry.sourceType === "task-deadline" && entry.sourceId === task.id;
    const nextEntry = task.deadline
      ? deadlineEntryForTask(task, entries, timezone, rows)
      : null;
    return replaceEntry(entries, predicate, nextEntry);
  }, options);
};

export const removeTaskDeadlineForUser = async (userId, taskId) => {
  await mutateUserSchedules(userId, ({ entries }) =>
    entries.filter((entry) =>
      !(entry.sourceType === "task-deadline" && entry.sourceId === taskId),
    ), { createIfMissing: false });
};

export const upsertGroupTaskDeadlineForUsers = async (
  userIds,
  task,
  group,
  options = {},
) => {
  const sourceId = `group-task:${task.id}`;
  await mutateUserSchedules(userIds, ({ entries, rows, timezone }) => {
    const predicate = (entry) =>
      entry.sourceType === "group-task-deadline" && entry.sourceId === sourceId;
    const nextEntry = task.dueDate
      ? deadlineEntryForGroupTask(task, group, entries, timezone, rows)
      : null;
    return replaceEntry(entries, predicate, nextEntry);
  }, options);
};

export const removeGroupTaskDeadlineForUsers = async (userIds, taskId) => {
  const sourceId = `group-task:${taskId}`;
  await mutateUserSchedules(userIds, ({ entries }) =>
    entries.filter((entry) =>
      !(entry.sourceType === "group-task-deadline" && entry.sourceId === sourceId),
    ), { createIfMissing: false });
};

export const removeGroupDeadlinesForUsers = async (userIds, groupId) => {
  await mutateUserSchedules(userIds, ({ entries }) =>
    entries.filter((entry) =>
      !(entry.sourceType === "group-task-deadline" && entry.groupId === groupId),
    ), { createIfMissing: false });
};

export const syncGroupTaskDeadlinesForUser = async (userId, groupId) => {
  const tasks = await GroupTask.findAll({
    where: { groupId },
    include: [
      { model: StudyGroup },
      {
        model: GroupTaskAssignee,
        as: "assigneeLinks",
        where: { userId },
        attributes: [],
        required: true,
      },
    ],
  });
  await mutateUserSchedules(userId, ({ entries, rows, timezone }) => {
    const retained = entries.filter((entry) =>
      !(entry.sourceType === "group-task-deadline" && entry.groupId === groupId),
    );
    const taskEntries = tasks
      .filter((task) => task.dueDate)
      .map((task) => deadlineEntryForGroupTask(
        task,
        task.StudyGroup,
        entries,
        timezone,
        rows,
      ))
      .filter(Boolean);
    return [...retained, ...taskEntries];
  });
};


export const findActiveSchedule = (userId) =>
  Schedule.findOne({ where: { userId, isActive: true } });

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
