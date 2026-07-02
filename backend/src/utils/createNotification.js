import { Notifications } from "../models/index.js";

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

  return Notifications.create({
    userId,
    taskId,
    groupId,
    inviterId,
    type,
    inviteStatus,
    message: message.trim(),
  });
};

export default createNotification;
