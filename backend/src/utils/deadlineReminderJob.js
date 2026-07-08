import { Op } from "sequelize";
import { Notifications, Task } from "../models/index.js";
import createNotification from "./createNotification.js";

const HOUR_IN_MS = 60 * 60 * 1000;

const getTomorrowRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const sendDeadlineReminders = async () => {
  const { start, end } = getTomorrowRange();

  const tasks = await Task.findAll({
    where: {
      deadline: {
        [Op.gte]: start,
        [Op.lt]: end,
      },
      status: {
        [Op.ne]: "done",
      },
    },
  });

  await Promise.all(
    tasks.map(async (task) => {
      const message = `Reminder: ${task.title} is due tomorrow`;
      const existing = await Notifications.findOne({
        where: {
          userId: task.userId,
          taskId: task.id,
          type: "task",
          message,
        },
      });

      if (existing) return null;

      const notification = await createNotification({
        userId: task.userId,
        taskId: task.id,
        type: "task",
        message,
      });
      return notification;
    }),
  );
};

export const startDeadlineReminderJob = () => {
  sendDeadlineReminders().catch((error) => {
    console.error(`Deadline reminder error: ${error.message}`);
  });

  return setInterval(() => {
    sendDeadlineReminders().catch((error) => {
      console.error(`Deadline reminder error: ${error.message}`);
    });
  }, HOUR_IN_MS);
};
