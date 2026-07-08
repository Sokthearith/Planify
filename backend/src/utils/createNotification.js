import { Notifications } from "../models/index.js";
import { emitToUser } from "./realtime.js";

const createNotification = async ({
  userId,
  message,
  type = "system",
  taskId = null,
  groupId = null,
  inviterId = null,
  inviteStatus = null,
}) => {
  if (!userId || typeof message !== "string" || !message.trim()) return null;

  const notification = await Notifications.create({
    userId,
    taskId,
    groupId,
    inviterId,
    type,
    inviteStatus,
    message: message.trim(),
  });

  emitToUser(userId, "notification:created", notification);
  return notification;
};

export default createNotification;
