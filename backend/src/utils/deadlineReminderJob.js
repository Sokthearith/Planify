import { Op } from "sequelize";
import {
  GroupTask,
  GroupTaskAssignee,
  Notifications,
  StudyGroup,
  Task,
} from "../models/index.js";
import createNotification from "./createNotification.js";
import { getAcceptedGroupMemberIds } from "./realtime.js";

const HOUR_IN_MS = 60 * 60 * 1000;

const getUpcomingRange = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 24 * HOUR_IN_MS);

  return { start, end };
};

export const sendDeadlineReminders = async () => {
  const { start, end } = getUpcomingRange();

  const [tasks, groupTasks] = await Promise.all([
    Task.findAll({
      where: {
        deadline: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
        status: {
          [Op.ne]: "done",
        },
      },
    }),
    GroupTask.findAll({
      where: {
        dueDate: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
        done: false,
      },
      include: [
        { model: StudyGroup, attributes: ["id", "name"] },
        {
          model: GroupTaskAssignee,
          as: "assigneeLinks",
          attributes: ["userId"],
          required: false,
        },
      ],
    }),
  ]);

  const personalReminders = tasks.map(async (task) => {
    const message = `Reminder: ${task.title} is due within 24 hours`;
    const dedupeKey = `personal-due:${task.id}:${new Date(task.deadline).toISOString()}`;
    const existing = await Notifications.findOne({
      where: {
        userId: task.userId,
        taskId: task.id,
        type: "task",
        message,
        dedupeKey,
      },
    });

    if (existing) return null;

    const notification = await createNotification({
      userId: task.userId,
      taskId: task.id,
      type: "task",
      message,
      category: "dueReminders",
      dedupeKey,
    });
    return notification;
  });

  const groupReminders = groupTasks.map(async (task) => {
    const acceptedMemberIds = await getAcceptedGroupMemberIds(task.groupId);
    const acceptedSet = new Set(acceptedMemberIds);
    const assignedIds = (task.assigneeLinks || [])
      .map((assignment) => assignment.userId)
      .filter((userId) => acceptedSet.has(userId));
    const recipients = assignedIds.length ? assignedIds : acceptedMemberIds;
    const groupName = task.StudyGroup?.name || "your group";
    const message = `Reminder: ${task.title} in ${groupName} is due within 24 hours`;
    const dedupeKey = `group-due:${task.id}:${new Date(task.dueDate).toISOString()}`;

    return Promise.all(recipients.map(async (userId) => {
      const existing = await Notifications.findOne({
        where: {
          userId,
          groupId: task.groupId,
          type: "group",
          message,
          dedupeKey,
        },
      });
      if (existing) return null;
      return createNotification({
        userId,
        groupId: task.groupId,
        type: "group",
        message,
        category: "dueReminders",
        dedupeKey,
      });
    }));
  });

  await Promise.all([...personalReminders, ...groupReminders]);
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
