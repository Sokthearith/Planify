import bcrypt from "bcrypt";
import {
  sequelize,
  User,
  Task,
  StudyGroup,
  GroupMember,
  GroupTask,
  GroupMessage,
  UserAvailability,
} from "./models/index.js";

async function seed() {
  await sequelize.sync({ force: true });

  const hash = await bcrypt.hash("Password123!", 10);
  const priorities = ["high", "medium", "low"];
  const statuses = ["pending", "in_progress", "done"];
  const subjects = ["Mathematics", "Physics", "History", "Programming", "English"];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const userData = [];
  for (let i = 1; i <= 1000; i++) {
    userData.push({
      name: `User${i}`,
      email: `user${i}@gmail.com`,
      password: hash,
    });
  }
  const users = await User.bulkCreate(userData, { returning: true });
  console.log(`Created ${users.length} users`);

  const groupData = subjects.map((s, i) => ({
    name: `${s} Study Group`,
    subject: s,
    createBy: users[i].id,
  }));
  const groups = await StudyGroup.bulkCreate(groupData, { returning: true });
  console.log(`Created ${groups.length} groups`);

  const taskData = [];
  for (const user of users) {
    for (let j = 1; j <= 5; j++) {
      taskData.push({
        userId: user.id,
        groupId: j === 1 ? groups[j % groups.length].id : null,
        title: `Task ${j} - ${user.name}`,
        description: `Description for task ${j} of ${user.name}`,
        deadline: new Date(Date.now() + j * 86400000),
        estimatedHours: Math.round(j * 1.5 * 10) / 10,
        priority: priorities[j % 3],
        status: statuses[j % 3],
        assignees: j === 1 ? [users[(j + 1) % users.length].id] : [],
      });
    }
  }
  for (let i = 0; i < taskData.length; i += 1000) {
    await Task.bulkCreate(taskData.slice(i, i + 1000));
  }
  console.log("Created 5000 tasks");

  const memberData = [];
  for (const group of groups) {
    for (let i = 0; i < 20; i++) {
      memberData.push({
        groupId: group.id,
        userId: users[i].id,
        role: i === 0 ? "owner" : "member",
        status: i < 15 ? "accepted" : "pending",
      });
    }
  }
  await GroupMember.bulkCreate(memberData);
  console.log(`Created ${memberData.length} group members`);

  const groupTaskData = [];
  for (const group of groups) {
    for (let j = 1; j <= 3; j++) {
      groupTaskData.push({
        groupId: group.id,
        createBy: group.createBy,
        title: `Group Task ${j} - ${group.name}`,
        description: `Description for group task ${j}`,
        dueDate: new Date(Date.now() + j * 7 * 86400000),
        priority: priorities[j % 3],
        done: j === 1,
        assignees: [users[0].id, users[1].id],
      });
    }
  }
  await GroupTask.bulkCreate(groupTaskData);
  console.log(`Created ${groupTaskData.length} group tasks`);

  const msgData = [];
  for (const group of groups) {
    for (let j = 1; j <= 5; j++) {
      msgData.push({
        groupId: group.id,
        senderId: users[(j - 1) % 20].id,
        message: `Message ${j} in ${group.name}. This is a sample message.`,
      });
    }
  }
  await GroupMessage.bulkCreate(msgData);
  console.log(`Created ${msgData.length} group messages`);

  const availData = [];
  for (let i = 0; i < 20; i++) {
    availData.push({
      userId: users[i].id,
      name: dayNames[i % 5],
      dayOfWeek: (i % 5) + 1,
      startTime: "09:00",
      endTime: "12:00",
      type: i < 10 ? "available" : "blocked",
    });
  }
  await UserAvailability.bulkCreate(availData);
  console.log(`Created ${availData.length} availability slots`);

  console.log("Seed complete!");
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
