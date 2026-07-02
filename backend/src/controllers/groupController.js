import {
  StudyGroup,
  GroupMember,
  Task,
  User,
  Notifications,
} from "../models/index.js";
import createNotification from "../utils/createNotification.js";

const allowedPriorities = ["high", "medium", "low"];
const allowedStatuses = ["pending", "in_progress", "done"];

const findGroupMembership = (groupId, userId) => {
  return GroupMember.findOne({ where: { groupId, userId } });
};

const pickGroupTaskFields = (body) => {
  const fields = {};
  [
    "subject",
    "title",
    "description",
    "deadline",
    "priority",
    "status",
    "assignees",
  ].forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });
  return fields;
};

const validateGroupTask = ({ title, priority, status }, requireTitle = false) => {
  if (requireTitle && !title) return { message: "Title is required" };
  if (priority && !allowedPriorities.includes(priority)) {
    return { message: "Invalid priority" };
  }
  if (status && !allowedStatuses.includes(status)) {
    return { message: "Invalid status" };
  }
  return null;
};

export const createGroup = async (req, res) => {
  const { name, subject } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });

  const group = await StudyGroup.create({
    name,
    subject,
    createBy: req.user.id,
  });
  await GroupMember.create({
    groupId: group.id,
    userId: req.user.id,
    role: "admin",
  });
  const full = await StudyGroup.findByPk(group.id, {
    include: [
      {
        model: GroupMember,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
  res.status(201).json(full);
};

export const getMyGroups = async (req, res) => {
  const membership = await GroupMember.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: StudyGroup,
        include: [
          { model: User, as: "creator", attributes: ["id", "name"] },
          {
            model: GroupMember,
            include: [{ model: User, attributes: ["id", "name", "email"] }],
          },
        ],
      },
    ],
  });
  res.json(membership.map((m) => m.StudyGroup));
};

export const getMyGroupsById = async (req, res) => {
  const membership = await findGroupMembership(req.params.id, req.user.id);
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const group = await StudyGroup.findByPk(req.params.id, {
    include: [
      { model: User, as: "creator", attributes: ["id", "name"] },
      {
        model: GroupMember,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  res.json(group);
};

export const updateGroup = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can update" });
  await group.update({
    name: req.body.name ?? group.name,
    subject: req.body.subject ?? group.subject,
  });
  res.json(group);
};

export const deleteGroup = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can delete" });
  await group.destroy();
  res.json({ message: "Group deleted" });
};

export const addMember = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const group = await StudyGroup.findByPk(req.params.id);

  if (!group) return res.status(404).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can add members" });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "User Not Found" });

  const existing = await GroupMember.findOne({
    where: { groupId: req.params.id, userId: user.id },
  });
  if (existing) return res.status(400).json({ message: "Already a member" });

  const existingInvite = await Notifications.findOne({
    where: {
      groupId: group.id,
      userId: user.id,
      type: "group_invite",
      inviteStatus: "pending",
    },
  });
  if (existingInvite) {
    return res.status(400).json({ message: "Invite already pending" });
  }

  const invite = await createNotification({
    userId: user.id,
    groupId: group.id,
    inviterId: req.user.id,
    type: "group_invite",
    inviteStatus: "pending",
    message: `${req.user.name} sent you an invite to join ${group.name}`,
  });

  res.status(201).json({ message: "Group invite sent", invite });
};

export const removeMember = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  const member = await GroupMember.findOne({
    where: { id: req.params.memberId, groupId: req.params.id },
  });
  if (!member) return res.status(404).json({ message: "Member Not Found" });
  if (group.createBy !== req.user.id && member.userId !== req.user.id)
    return res.status(403).json({ message: "Not Authorized" });
  await member.destroy();
  res.json({ message: "Member removed" });
};

export const getGroupTasks = async (req, res) => {
  const membership = await findGroupMembership(req.params.id, req.user.id);
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const tasks = await Task.findAll({
    where: { groupId: req.params.id },
    order: [
      ["deadline", "ASC"],
      ["createAt", "DESC"],
    ],
  });

  res.json(tasks);
};

export const createGroupTask = async (req, res) => {
  const membership = await findGroupMembership(req.params.id, req.user.id);
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const taskData = pickGroupTaskFields(req.body);
  const error = validateGroupTask(taskData, true);
  if (error) return res.status(400).json(error);

  const task = await Task.create({
    ...taskData,
    subject: taskData.subject || group.subject,
    userId: req.user.id,
    groupId: group.id,
  });

  await createNotification({
    userId: req.user.id,
    taskId: task.id,
    groupId: group.id,
    type: "group",
    message: `Group task created: ${task.title}`,
  });

  res.status(201).json(task);
};

export const updateGroupTask = async (req, res) => {
  const membership = await findGroupMembership(req.params.id, req.user.id);
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const task = await Task.findOne({
    where: { id: req.params.taskId, groupId: req.params.id },
  });
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  const taskData = pickGroupTaskFields(req.body);
  const error = validateGroupTask(taskData);
  if (error) return res.status(400).json(error);

  await task.update(taskData);
  res.json(task);
};

export const deleteGroupTask = async (req, res) => {
  const membership = await findGroupMembership(req.params.id, req.user.id);
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const task = await Task.findOne({
    where: { id: req.params.taskId, groupId: req.params.id },
  });
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  await task.destroy();
  res.json({ message: "Task deleted" });
};
