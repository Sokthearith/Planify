import { StudyGroup, GroupMember, GroupTask, User } from "../models/index.js";
import createNotification from "../utils/createNotification.js";

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

export const createGroup = async (req, res) => {
  const { name, subject, invites } = req.body;
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

  if (invites && invites.length > 0) {
    const users = await User.findAll({ where: { email: invites } });
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
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
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
  res.status(200).json(group);
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

  await member.destroy();
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

  const task = await GroupTask.create({
    groupId: group.id,
    createBy: req.user.id,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    priority: taskData.priority,
    assignees: taskData.assignees || [],
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
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const task = await GroupTask.findOne({
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
  const membership = await findGroupMembership(
    req.params.id, req.user.id, "accepted"
  );
  if (!membership) return res.status(404).json({ message: "Group Not Found" });

  const task = await GroupTask.findOne({
    where: { id: req.params.taskId, groupId: req.params.id },
  });
  if (!task) return res.status(404).json({ message: "Task Not Found" });

  await task.destroy();
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
  res.status(200).json({ message: "Invite accepted" });
};

export const rejectInvite = async (req, res) => {
  const membership = await GroupMember.findOne({
    where: { groupId: req.params.id, userId: req.user.id, status: "pending" },
  });
  if (!membership) return res.status(404).json({ message: "Invite not found" });

  await membership.destroy();
  res.status(200).json({ message: "Invite rejected" });
};
