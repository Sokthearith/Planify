import { Op } from "sequelize";
import { FocusSession, GroupTask, GroupTaskAssignee, Task } from "../models/index.js";

const dateKey = (value, timeZone) => new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(value));

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const rangeDefinition = (range) => {
  const now = new Date();
  if (range === "week") {
    const start = startOfDay(now);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + index);
      const end = new Date(bucketStart);
      end.setDate(end.getDate() + 1);
      return { start: bucketStart, end, label: bucketStart.toLocaleDateString(undefined, { weekday: "short" }) };
    });
    return { start, end: buckets.at(-1).end, buckets };
  }
  if (range === "term") {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const bucketStart = new Date(start.getFullYear(), start.getMonth() + index, 1);
      const end = new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 1);
      return { start: bucketStart, end, label: bucketStart.toLocaleDateString(undefined, { month: "short" }) };
    });
    return { start, end: buckets.at(-1).end, buckets };
  }

  const currentMonday = startOfDay(now);
  currentMonday.setDate(currentMonday.getDate() - (currentMonday.getDay() || 7) + 1);
  const start = new Date(currentMonday);
  start.setDate(start.getDate() - 6 * 7);
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * 7);
    const end = new Date(bucketStart);
    end.setDate(end.getDate() + 7);
    return { start: bucketStart, end, label: bucketStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  });
  return { start, end: buckets.at(-1).end, buckets };
};

export const getProgress = async (req, res) => {
  const range = ["week", "month", "term"].includes(req.query.range) ? req.query.range : "month";
  const timeZone = req.query.timezone || "UTC";
  let definition;
  try {
    dateKey(new Date(), timeZone);
    definition = rangeDefinition(range);
  } catch (error) {
    return res.status(400).json({ message: "Invalid timezone" });
  }

  const [personalTasks, groupTasks, focusSessions] = await Promise.all([
    Task.findAll({ where: { userId: req.user.id, groupId: null } }),
    GroupTask.findAll({
      where: {
        [Op.or]: [
          { createBy: req.user.id },
          { "$assigneeLinks.userId$": req.user.id },
        ],
      },
      include: [{
        model: GroupTaskAssignee,
        as: "assigneeLinks",
        attributes: [],
        required: false,
      }],
    }),
    FocusSession.findAll({
      where: {
        userId: req.user.id,
        kind: "focus",
        status: "completed",
        completedAt: { [Op.gte]: definition.start, [Op.lt]: definition.end },
      },
    }),
  ]);

  const tasks = [
    ...personalTasks.map((task) => ({
      id: task.id, title: task.title, subject: task.subject || "General",
      priority: task.priority, done: task.status === "done", deadline: task.deadline,
      completedAt: task.completedAt, source: "personal",
    })),
    ...groupTasks.map((task) => ({
      id: task.id, title: task.title, subject: "Group", priority: task.priority,
      done: task.done, deadline: task.dueDate, completedAt: task.completedAt, source: "group",
    })),
  ];

  const inRange = (value, bucket = definition) => value && new Date(value) >= bucket.start && new Date(value) < bucket.end;
  const dueTasks = tasks.filter((task) => inRange(task.deadline));
  const completedInRange = tasks.filter((task) => task.done && inRange(task.completedAt));
  const completedDueTasks = dueTasks.filter((task) => task.done);
  const onTime = completedDueTasks.filter((task) => task.completedAt && new Date(task.completedAt) <= new Date(task.deadline)).length;
  const focusSeconds = focusSessions.reduce((sum, session) => sum + session.elapsedSeconds, 0);

  const activityDays = new Set([
    ...tasks.filter((task) => task.completedAt).map((task) => dateKey(task.completedAt, timeZone)),
    ...focusSessions.map((session) => dateKey(session.completedAt, timeZone)),
  ]);
  let streak = 0;
  const cursor = startOfDay(new Date());
  while (activityDays.has(dateKey(cursor, timeZone))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const subjectMap = new Map();
  tasks.forEach((task) => {
    const current = subjectMap.get(task.subject) || { name: task.subject, done: 0, total: 0 };
    current.total += 1;
    if (task.done) current.done += 1;
    subjectMap.set(task.subject, current);
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const nextActions = tasks.filter((task) => !task.done)
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || new Date(a.deadline || 8640000000000000) - new Date(b.deadline || 8640000000000000))
    .slice(0, 3);

  res.json({
    range,
    stats: {
      completed: completedInRange.length,
      onTimeRate: completedDueTasks.length ? Math.round((onTime / completedDueTasks.length) * 100) : 0,
      focusSeconds,
      streak,
    },
    buckets: definition.buckets.map((bucket) => {
      const bucketTasks = tasks.filter((task) => inRange(task.deadline, bucket));
      const done = bucketTasks.filter((task) => task.done).length;
      return { label: bucket.label, total: bucketTasks.length, done, rate: bucketTasks.length ? done / bucketTasks.length : 0 };
    }),
    subjects: [...subjectMap.values()],
    priorities: ["high", "medium", "low"].map((priority) => ({
      priority,
      count: tasks.filter((task) => !task.done && task.priority === priority).length,
    })),
    nextActions,
  });
};
