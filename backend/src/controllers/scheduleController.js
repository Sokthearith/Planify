import { Schedule } from "../models/index.js";
import { emitToUser } from "../utils/realtime.js";
import {
  ensureActiveSchedule,
  normalizeSchedulePayload,
  syncTaskDeadlinesForSchedule,
} from "../utils/scheduleSync.js";
import { handleSmartScheduler } from "../services/genai.js";
import { deterministicSchedule } from "../services/scheduler.js";
import { Sequelize, Op } from "sequelize";
import { Task, GroupTask, UserAvailability } from "../models/index.js";

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
  const schedule = await ensureActiveSchedule(req.user.id, req.query.timezone);
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

  if (req.query.withDeadlines === "true") {
    for (const schedule of schedules) {
      await syncTaskDeadlinesForSchedule(schedule, {
        timezone: req.query.timezone,
      });
    }
  }

  res.json(schedules);
};

export const getScheduleById = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  await syncTaskDeadlinesForSchedule(schedule, {
    timezone: req.query.timezone,
  });

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
          Sequelize.where(
            Sequelize.fn(
              "JSON_CONTAINS",
              Sequelize.col("assignees"),
              Sequelize.literal(`'"${req.user.id}"'`),
            ),
            1,
          ),
        ],
        done: false,
      },
      order: [["dueDate", "ASC"]],
    }),
    UserAvailability.findAll({ where: { userId: req.user.id } }),
  ]);

  const allTasks = [
    ...personalTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      subject: t.subject || "General",
      deadline: t.deadline,
      estimatedHours: t.estimatedHours,
      type: "personal",
    })),
    ...groupTasks.map((t) => ({
      title: t.title + " (group)",
      priority: t.priority,
      subject: "Group",
      deadline: t.dueDate,
      type: "group",
    })),
  ];

  if (!allTasks.length) {
    return res.status(400).json({ message: "No pending tasks to schedule" });
  }

  const entries = deterministicSchedule(allTasks, availability);
  const schedule = await Schedule.create({
    planData: { entries },
    userId: req.user.id,
  });

  await setActiveSchedule(schedule, req.user.id);

  res.status(201).json(schedule);
};
