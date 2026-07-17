import {
  GroupMember,
  GroupTask,
  GroupTaskAssignee,
  sequelize,
  StudyGroup,
  User,
} from "../models/index.js";
import createNotification from "../utils/createNotification.js";
import { emitToGroup, emitToGroupMembers, emitToUser } from "../utils/realtime.js";
import {
  removeGroupDeadlinesForUsers,
  removeGroupTaskDeadlineForUsers,
  syncGroupTaskDeadlinesForUser,
  upsertGroupTaskDeadlineForUsers,
} from "../utils/scheduleSync.js";

const allowedPriorities = ["high", "medium", "low"];

const findGroupMembership = (groupId, userId, status) => {
  const where = { groupId, userId };
  if (status) where.status = status;
  return GroupMember.findOne({ where });
};

const pickGroupTaskFields = (body) => {
  const fields = {};
  ["title", "description", "dueDate", "priority", "assignees", "done"].forEach(
    (field) => {
      if (body[field] !== undefined) fields[field] = body[field];
    },
  );
  return fields;
};

const validateGroupTask = ({ title, priority }, requireTitle = false) => {
  if (requireTitle && !title) return { message: "Title is required" };
  if (priority && !allowedPriorities.includes(priority)) {
    return { message: "Invalid priority" };
  }
  return null;
};

const parseAssignees = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const normalizeAssignees = (value) =>
  [...new Set(parseAssignees(value).filter((userId) => typeof userId === "string" && userId))];

const getTaskAssigneeIds = async (task) => {
  const links = await GroupTaskAssignee.findAll({
    where: { groupTaskId: task.id },
    attributes: ["userId"],
  });
  return links.length
    ? links.map((link) => link.userId)
    : normalizeAssignees(task.assignees);
};

const replaceTaskAssignees = async (taskId, userIds, transaction) => {
  await GroupTaskAssignee.destroy({
    where: { groupTaskId: taskId },
    transaction,
  });
  if (userIds.length) {
    await GroupTaskAssignee.bulkCreate(
      userIds.map((userId) => ({ groupTaskId: taskId, userId })),
      { transaction },
    );
  }
};

const syncGroupTaskSchedules = async (task, group, previousIds, nextIds) => {
  const previous = new Set(previousIds);
  const next = new Set(nextIds);
  const removed = [...previous].filter((userId) => !next.has(userId));
  await Promise.all([
    upsertGroupTaskDeadlineForUsers([...next], task, group),
    removeGroupTaskDeadlineForUsers(removed, task.id),
  ]);
};

const removeUserFromGroupTaskAssignments = async (groupId, userId) => {
  const tasks = await GroupTask.findAll({
    where: { groupId },
    include: [{
      model: GroupTaskAssignee,
      as: "assigneeLinks",
      where: { userId },
      attributes: [],
      required: true,
    }],
    attributes: ["id", "assignees"],
  });
  const taskIds = tasks.map((task) => task.id);
  if (!taskIds.length) return;

  await sequelize.transaction(async (transaction) => {
    await GroupTaskAssignee.destroy({
      where: { groupTaskId: taskIds, userId },
      transaction,
    });
    await Promise.all(tasks.map((task) => {
      const assignees = normalizeAssignees(task.assignees)
        .filter((assigneeId) => assigneeId !== userId);
      return task.update({ assignees }, { transaction });
    }));
  });
};

export const createGroup = async (req, res) => {
  const { name, subject, invites } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  const inviteEmails = [...new Set(
    (Array.isArray(invites) ? invites : [])
      .map((email) => String(email).trim().toLowerCase())
      .filter(Boolean),
  )];

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

  if (inviteEmails.length > 0) {
    const foundUsers = await User.findAll({ where: { email: inviteEmails } });
    const users = foundUsers.filter((user) => user.id !== req.user.id);
    const members = users.map((u) => ({
      groupId: group.id,
      userId: u.id,
      role: "member",
      status: "pending",
    }));

    await GroupMember.bulkCreate(members);

    await Promise.all(users.map(u =>
      createNotification({
        userId: u.id,
        groupId: group.id,
        inviterId: req.user.id,
        type: "group_invite",
        inviteStatus: "pending",
        message: `${req.user.name} invited you to join ${group.name}`,
      })
    ));
  }

  const full = await StudyGroup.findByPk(group.id, {
    include: [
      {
        model: GroupMember,
        where: { status: "accepted" },
        required: false,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
  emitToUser(req.user.id, "group:created", full);
  res.status(201).json(full);
};

export const getMyGroups = async (req, res) => {
  const membership = await GroupMember.findAll({
    where: { userId: req.user.id, status: "accepted" },
    include: [
      {
        model: StudyGroup,
        include: [
          { model: User, as: "creator", attributes: ["id", "name"] },
          {
            model: GroupMember,
            where: { status: "accepted" },
            required: false,
            include: [{ model: User, attributes: ["id", "name", "email"] }],
          },
        ],
      },
    ],
  });
  console.log(`getMyGroups for user ${req.user.id}: found ${membership.length} memberships`);
  membership.forEach(m => console.log(`  groupId=${m.groupId}, status=${m.status}`));
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
        where: { status: "accepted" },
        required: false,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });

  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const isMember = group.GroupMembers.some((m) => m.userId === req.user.id);
  if (group.createBy !== req.user.id && !isMember) {
    return res.status(403).json({ message: "Not a member of this group" });
  }

  res.status(200).json(group);
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
  await emitToGroupMembers(group.id, "group:updated", group);
  res.status(200).json(group);
};

export const deleteGroup = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can delete" });

  const acceptedMembers = await GroupMember.findAll({
    where: { groupId: req.params.id, status: "accepted" },
    attributes: ["userId"],
  });
  const affectedUserIds = acceptedMembers.map((member) => member.userId);
  await emitToGroupMembers(req.params.id, "group:deleted", { id: req.params.id });
  emitToGroup(req.params.id, "group:deleted", { id: req.params.id });
  await group.destroy();
  await removeGroupDeadlinesForUsers(affectedUserIds, group.id);
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

  const member = await GroupMember.create({
    groupId: req.params.id,
    userId: user.id,
    status: "pending",
  });

  await createNotification({
    userId: user.id,
    groupId: group.id,
    inviterId: req.user.id,
    type: "group_invite",
    inviteStatus: "pending",
    message: `${req.user.name} sent you an invite to join ${group.name}`,
  });

  const full = await GroupMember.findByPk(member.id, {
    include: [{ model: User, attributes: ["id", "name", "email"] }],
  });
  await emitToGroupMembers(group.id, "group:member-added", full);
  res.status(201).json(full);
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

  const removedUserId = member.userId;
  await member.destroy();
  await removeUserFromGroupTaskAssignments(req.params.id, removedUserId);
  await removeGroupDeadlinesForUsers([removedUserId], req.params.id);
  const payload = {
    groupId: req.params.id,
    memberId: req.params.memberId,
    userId: removedUserId,
  };
  await emitToGroupMembers(req.params.id, "group:member-removed", payload);
  emitToUser(removedUserId, "group:member-removed", payload);
  res.json({ message: "Member removed" });
};

export const getGroupTasks = async (req, res) => {
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const tasks = await GroupTask.findAll({
    where: { groupId: req.params.id },
    order: [["createAt", "DESC"]],
  });
  res.json(tasks);
};

export const createGroupTask = async (req, res) => {
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const taskData = pickGroupTaskFields(req.body);
  const error = validateGroupTask(taskData, true);
  if (error) return res.status(400).json(error);
  const assigneeIds = normalizeAssignees(taskData.assignees);
  const task = await sequelize.transaction(async (transaction) => {
    const created = await GroupTask.create({
      groupId: group.id,
      createBy: req.user.id,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      assignees: assigneeIds,
    }, { transaction });
    await replaceTaskAssignees(created.id, assigneeIds, transaction);
    return created;
  });

  await createNotification({
    userId: req.user.id,
    groupId: group.id,
    type: "group",
    message: `Group task created: ${task.title}`,
  });

  await upsertGroupTaskDeadlineForUsers(assigneeIds, task, group);
  await emitToGroupMembers(group.id, "group-task:created", task);

  res.status(201).json(task);
};

export const updateGroupTask = async (req, res) => {
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const task = await GroupTask.findOne({
    where: { id: req.params.taskId, groupId: req.params.id },
  });
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  const taskData = pickGroupTaskFields(req.body);
  const previousAssignees = await getTaskAssigneeIds(task);

  if (group.createBy !== req.user.id) {
    const assigneeIds = previousAssignees;
    if (!assigneeIds.includes(req.user.id)) {
      return res.status(403).json({ message: "Only assigned members or the creator can edit this task" });
    }
    delete taskData.assignees;
  }

  const error = validateGroupTask(taskData);
  if (error) return res.status(400).json(error);

  const nextAssignees = taskData.assignees !== undefined
    ? normalizeAssignees(taskData.assignees)
    : previousAssignees;
  if (taskData.assignees !== undefined) taskData.assignees = nextAssignees;

  await sequelize.transaction(async (transaction) => {
    await task.update(taskData, { transaction });
    if (taskData.assignees !== undefined) {
      await replaceTaskAssignees(task.id, nextAssignees, transaction);
    }
  });
  await syncGroupTaskSchedules(task, group, previousAssignees, nextAssignees);
  await emitToGroupMembers(group.id, "group-task:updated", task);
  res.json(task);
};

export const deleteGroupTask = async (req, res) => {
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  if (group.createBy !== req.user.id) {
    return res.status(403).json({ message: "Only the group creator can delete tasks" });
  }

  const task = await GroupTask.findOne({
    where: { id: req.params.taskId, groupId: req.params.id },
  });
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  const previousAssignees = await getTaskAssigneeIds(task);
  await task.destroy();
  await removeGroupTaskDeadlineForUsers(previousAssignees, task.id);
  await emitToGroupMembers(group.id, "group-task:deleted", {
    groupId: group.id,
    id: req.params.taskId,
  });
  res.json({ message: "Task deleted" });
};

export const getInvites = async (req, res) => {
  const invites = await GroupMember.findAll({
    where: { userId: req.user.id, status: "pending" },
    include: [{ model: StudyGroup }],
  });
  res.status(200).json(invites);
};

export const acceptInvite = async (req, res) => {
  const membership = await GroupMember.findOne({
    where: { groupId: req.params.id, userId: req.user.id, status: "pending" },
  });
  if (!membership) return res.status(404).json({ message: "Invite not found" });

  await membership.update({ status: "accepted" });
  await syncGroupTaskDeadlinesForUser(req.user.id, req.params.id);
  const full = await GroupMember.findByPk(membership.id, {
    include: [{ model: User, attributes: ["id", "name", "email"] }],
  });
  await emitToGroupMembers(req.params.id, "group:member-updated", {
    groupId: req.params.id,
    member: full,
  });
  res.status(200).json({ message: "Invite accepted", member: full });
};

export const rejectInvite = async (req, res) => {
  const membership = await GroupMember.findOne({
    where: { groupId: req.params.id, userId: req.user.id, status: "pending" },
  });
  if (!membership) return res.status(404).json({ message: "Invite not found" });

  await membership.destroy();
  res.status(200).json({ message: "Invite rejected" });
};
