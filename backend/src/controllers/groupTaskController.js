import { GroupTask, StudyGroup, GroupMember } from "../models/index.js";

export const createTask = async (req, res) => {
  const { title, description, dueDate, priority, assignees } = req.body;
  const group = await StudyGroup.findByPk(req.params.id);

  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const task = await GroupTask.create({
    groupId: group.id,
    createBy: req.user.id,
    title,
    description,
    dueDate,
    priority,
    assignees: assignees || [],
  });

  res.status(201).json(task);
};

export const getTasks = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);

  if (!group) return res.status(404).json({ message: "Group Not Found" });
  const tasks = await GroupTask.findAll({
    where: { groupId: req.params.id },
    order: [["createAt", "DESC"]],
  });

  res.status(200).json(tasks);
};

export const updateTask = async (req, res) => {
  const task = await GroupTask.findByPk(req.params.taskId);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  const { title, description, dueDate, priority, done, assignees } = req.body;
  await task.update({
    title,
    description,
    dueDate,
    priority,
    done,
    assignees,
  });

  res.status(200).json(task);
};

export const deleteTask = async (req, res) => {
  const task = await GroupTask.findByPk(req.params.taskId);
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  await task.destroy();
  res.status(200).json({ message: "Task deleted" });
};

export const getMemberProgress = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const members = await GroupMember.findAll({
    where: { groupId: req.params.id, status: "accepted" },
  });

  const tasks = await GroupTask.findAll({
    where: { groupId: req.params.id },
  });

  const progress = members.map((m) => {
    const assigned = tasks.filter((t) =>
      (t.assignees || []).includes(m.userId),
    );
    const done = assigned.filter((t) => t.done).length;
    return {
      userId: m.userId,
      total: assigned.length,
      done,
      progress: assigned.length > 0 ? done / assigned.length : 0,
    };
  });

  res.status(200).json(progress);
};
