import { Task } from "../models/index.js";
import createNotification from "../utils/createNotification.js";
import { emitToUser } from "../utils/realtime.js";
import {
  removeTaskDeadlineForUser,
  upsertTaskDeadlineForUser,
} from "../utils/scheduleSync.js";

const allowedPriorities = ["high", "medium", "low"];
const allowedStatuses = ["pending", "in_progress", "done"];

const getTaskForUser = async (taskId, userId) => {
  return Task.findOne({
    where: {
      id: taskId,
      userId,
    },
  });
};

const pickTaskFields = (body) => {
  const fields = {};
  const allowedFields = [
    "subject",
    "title",
    "description",
    "deadline",
    "dueDate",
    "estimatedHours",
    "priority",
    "status",
    "done",
    "assignees",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });

  if (fields.dueDate !== undefined && fields.deadline === undefined) {
    fields.deadline = fields.dueDate;
  }
  delete fields.dueDate;

  if (fields.done !== undefined) {
    fields.status = fields.done
      ? "done"
      : fields.status === "in_progress" ? "in_progress" : "pending";
  }
  delete fields.done;

  return fields;
};

const validateTask = ({ title, priority, status }, requireTitle = false) => {
  if (requireTitle && !title) {
    return { message: "Title is required" };
  }

  if (priority && !allowedPriorities.includes(priority)) {
    return { message: "Invalid priority" };
  }

  if (status && !allowedStatuses.includes(status)) {
    return { message: "Invalid status" };
  }

  return null;
};

export const createTask = async (req, res) => {
  const taskData = pickTaskFields(req.body);
  const error = validateTask(taskData, true);
  if (error) return res.status(400).json(error);

  const task = await Task.create({
    ...taskData,
    completedAt: taskData.status === "done" ? new Date() : null,
    userId: req.user.id,
    groupId: null,
  });

  await upsertTaskDeadlineForUser(req.user.id, task);
  emitToUser(req.user.id, "task:created", task);

  res.status(201).json(task);
};

export const getMyTasks = async (req, res) => {
  const where = { userId: req.user.id, groupId: null };
  const { status, priority } = req.query;

  if (status) {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    where.status = status;
  }

  if (priority) {
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }
    where.priority = priority;
  }

  const tasks = await Task.findAll({
    where,
    order: [
      ["deadline", "ASC"],
      ["createAt", "DESC"],
    ],
  });

  res.json(tasks);
};

export const getTaskById = async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  res.json(task);
};

export const updateTask = async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  const taskData = pickTaskFields(req.body);
  const error = validateTask(taskData);
  if (error) return res.status(400).json(error);

  const previousDeadline = task.deadline ? task.deadline.toISOString() : null;
  if (taskData.status !== undefined) {
    taskData.completedAt = taskData.status === "done"
      ? (task.completedAt || new Date())
      : null;
  }
  await task.update(taskData);

  const notifications = [];

  if (taskData.deadline !== undefined) {
    const nextDeadline = task.deadline ? task.deadline.toISOString() : null;

    if (previousDeadline !== nextDeadline) {
      notifications.push(
        createNotification({
          userId: req.user.id,
          taskId: task.id,
          type: "task",
          message: `Deadline updated for: ${task.title}`,
          category: "dueReminders",
        }),
      );
    }
  }

  await Promise.all(notifications);
  if (
    taskData.deadline !== undefined ||
    taskData.title !== undefined ||
    taskData.subject !== undefined ||
    taskData.priority !== undefined ||
    taskData.status !== undefined
  ) {
    await upsertTaskDeadlineForUser(req.user.id, task);
  }
  emitToUser(req.user.id, "task:updated", task);
  res.json(task);
};

export const deleteTask = async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  await task.destroy();
  await removeTaskDeadlineForUser(req.user.id, req.params.id);
  emitToUser(req.user.id, "task:deleted", { id: req.params.id });
  res.json({ message: "Task deleted" });
};
