import { Notifications, User } from "../models/index.js";
import { emitToUser } from "./realtime.js";
import { notificationPreferenceEnabled } from "./userPreferences.js";

const createNotification = async ({
  userId,
  message,
  type = "system",
  taskId = null,
  groupId = null,
  inviterId = null,
  inviteStatus = null,
  category = null,
  dedupeKey = null,
}) => {
  if (!userId || typeof message !== "string" || !message.trim()) return null;
  if (category) {
    const user = await User.findByPk(userId, { attributes: ["preferences"] });
    if (!user || !notificationPreferenceEnabled(user.preferences, category)) return null;
  }

  const values = {
    userId, taskId, groupId, inviterId, type, inviteStatus,
    dedupeKey, message: message.trim(),
  };
  let notification;
  let created = true;
  if (dedupeKey) {
    [notification, created] = await Notifications.findOrCreate({
      where: { userId, dedupeKey },
      defaults: values,
    });
  } else {
    notification = await Notifications.create(values);
  }

  if (created) emitToUser(userId, "notification:created", notification);
  return notification;
};

export default createNotification;
