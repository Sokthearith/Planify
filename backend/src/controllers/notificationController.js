import {
  GroupMember,
  Notifications,
  StudyGroup,
  Task,
  User,
} from "../models/index.js";
import { emitToGroupMembers, emitToUser } from "../utils/realtime.js";
import { syncGroupTaskDeadlinesForUser } from "../utils/scheduleSync.js";

const allowedTypes = ["task", "group", "group_invite", "ai", "system"];
const isExcludedPersonalTaskNotification = (notification) => (
  notification.type === "task" &&
  /^(Task created|Task completed):/.test(notification.message || "")
);

const getNotificationForUser = async (notificationId, userId) => {
  return Notifications.findOne({
    where: {
      id: notificationId,
      userId,
    },
  });
};

const validateNotification = async ({ message, type, taskId }, userId) => {
  if (typeof message !== "string" || !message.trim()) {
    return { message: "Message is required" };
  }

  if (type && !allowedTypes.includes(type)) {
    return { message: "Invalid notification type" };
  }

  if (type === "group_invite") {
    return { message: "Use the group invite endpoint to invite members" };
  }

  if (taskId) {
    const task = await Task.findOne({ where: { id: taskId, userId } });
    if (!task) return { message: "Task Not Found" };
  }

  return null;
};

export const createNotification = async (req, res) => {
  const { message, taskId, type = "task" } = req.body;
  const error = await validateNotification({ message, taskId, type }, req.user.id);

  if (error) {
    const status = error.message === "Task Not Found" ? 404 : 400;
    return res.status(status).json(error);
  }

  const notification = await Notifications.create({
    userId: req.user.id,
    taskId: taskId || null,
    type,
    message: message.trim(),
  });

  emitToUser(req.user.id, "notification:created", notification);

  res.status(201).json(notification);
};

export const getMyNotifications = async (req, res) => {
  const where = { userId: req.user.id };
  const { unread, type } = req.query;

  if (unread === "true") where.isRead = false;
  if (unread === "false") where.isRead = true;

  if (type) {
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid notification type" });
    }
    where.type = type;
  }

  const notifications = await Notifications.findAll({
    where,
    include: [{ model: Task, attributes: ["id", "title", "deadline", "priority"] }],
    order: [["sentAt", "DESC"]],
  });

  res.json(notifications.filter(notification => !isExcludedPersonalTaskNotification(notification)));
};

export const markNotificationRead = async (req, res) => {
  const notification = await getNotificationForUser(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ message: "Notification Not Found" });
  }

  await notification.update({ isRead: true });
  emitToUser(req.user.id, "notification:updated", notification);
  res.json(notification);
};

export const markAllNotificationsRead = async (req, res) => {
  const [updatedCount] = await Notifications.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } },
  );

  emitToUser(req.user.id, "notifications:read-all", {});
  res.json({ message: "Notifications marked as read", updatedCount });
};

export const acceptGroupInvite = async (req, res) => {
  console.log(`acceptGroupInvite called: notificationId=${req.params.id}, userId=${req.user.id}`);
  const notification = await getNotificationForUser(req.params.id, req.user.id);

  if (!notification) {
    console.log('Notification not found');
    return res.status(404).json({ message: "Notification Not Found" });
  }

  console.log(`Notification found: type=${notification.type}, inviteStatus=${notification.inviteStatus}, groupId=${notification.groupId}`);

  if (
    notification.type !== "group_invite" ||
    notification.inviteStatus !== "pending" ||
    !notification.groupId
  ) {
    return res.status(400).json({ message: "No pending group invite found" });
  }

  const group = await StudyGroup.findByPk(notification.groupId);
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  const existing = await GroupMember.findOne({
    where: { groupId: notification.groupId, userId: req.user.id },
  });

  console.log(`Existing GroupMember: ${existing ? 'found, status=' + existing.status : 'not found'}`);

  if (!existing) {
    await GroupMember.create({
      groupId: notification.groupId,
      userId: req.user.id,
      status: "accepted",
    });
  } else {
    await existing.update({ status: "accepted" });
  }

  await notification.update({ inviteStatus: "accepted", isRead: true });
  emitToUser(req.user.id, "notification:updated", notification);
  await syncGroupTaskDeadlinesForUser(req.user.id, notification.groupId);

  const [member, fullGroup] = await Promise.all([
    GroupMember.findOne({
      where: { groupId: notification.groupId, userId: req.user.id },
      include: [{ model: User, attributes: ["id", "name", "email", "avatar"] }],
    }),
    StudyGroup.findByPk(notification.groupId, {
      include: [{
        model: GroupMember,
        where: { status: "accepted" },
        required: false,
        include: [{ model: User, attributes: ["id", "name", "email", "avatar"] }],
      }],
    }),
  ]);
  await emitToGroupMembers(notification.groupId, "group:member-updated", {
    groupId: notification.groupId,
    member,
  });

  console.log(`Invite accepted for user ${req.user.id} in group ${notification.groupId}`);
  res.json({
    message: "Group invite accepted",
    groupId: notification.groupId,
    group: fullGroup,
  });
};

export const declineGroupInvite = async (req, res) => {
  const notification = await getNotificationForUser(req.params.id, req.user.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification Not Found" });
  }

  if (
    notification.type !== "group_invite" ||
    notification.inviteStatus !== "pending"
  ) {
    return res.status(400).json({ message: "No pending group invite found" });
  }

  await notification.update({ inviteStatus: "declined", isRead: true });
  emitToUser(req.user.id, "notification:updated", notification);

  res.json({ message: "Group invite declined" });
};

export const deleteNotification = async (req, res) => {
  const notification = await getNotificationForUser(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ message: "Notification Not Found" });
  }

  await notification.destroy();
  emitToUser(req.user.id, "notification:deleted", { id: req.params.id });
  res.json({ message: "Notification deleted" });
};
