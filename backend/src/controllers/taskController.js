import { Task } from "../models/index.js";

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
    "priority",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });

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
    userId: req.user.id,
  });

  res.status(201).json(task);
};

export const getMyTasks = async (req, res) => {
  const where = { userId: req.user.id };
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

  await task.update(taskData);
  res.json(task);
};

export const deleteTask = async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  await task.destroy();
  res.json({ message: "Task deleted" });
};
