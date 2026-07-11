import { Sequelize, DataTypes } from "sequelize";
import "dotenv/config";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected via Sequelize");
    await sequelize.sync();
    console.log("Models synced with database");
  } catch (error) {
    console.error(`DB error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await sequelize.close();
};

import UserModel from "./User.js";
import TaskModel from "./Task.js";
import ScheduleModel from "./Schedule.js";
import StudyGroupModel from "./StudyGroup.js";
import GroupMemberModel from "./GroupMember.js";
import GroupTaskModel from "./GroupTask.js";
import NotificationModel from "./Notifications.js";
import GroupMessageModel from "./GroupMessage.js";
import UserAvailabilityModel from "./UserAvailability.js";

const User = UserModel(sequelize, DataTypes);
const Task = TaskModel(sequelize, DataTypes);
const Schedule = ScheduleModel(sequelize, DataTypes);
const StudyGroup = StudyGroupModel(sequelize, DataTypes);
const GroupMember = GroupMemberModel(sequelize, DataTypes);
const GroupTask = GroupTaskModel(sequelize, DataTypes);
const Notifications = NotificationModel(sequelize, DataTypes);
const GroupMessage = GroupMessageModel(sequelize, DataTypes);
const UserAvailability = UserAvailabilityModel(sequelize, DataTypes);

User.hasMany(Task, { foreignKey: "userId", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

User.hasMany(Schedule, { foreignKey: "userId", onDelete: "CASCADE" });
Schedule.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

User.hasMany(StudyGroup, { foreignKey: "createBy", onDelete: "CASCADE" });
StudyGroup.belongsTo(User, {
  as: "creator",
  foreignKey: "createBy",
  onDelete: "CASCADE",
});

User.hasMany(GroupMember, { foreignKey: "userId", onDelete: "CASCADE" });
GroupMember.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

StudyGroup.hasMany(GroupMember, { foreignKey: "groupId", onDelete: "CASCADE" });
GroupMember.belongsTo(StudyGroup, {
  foreignKey: "groupId",
  onDelete: "CASCADE",
});

StudyGroup.hasMany(Task, { foreignKey: "groupId", onDelete: "CASCADE" });
Task.belongsTo(StudyGroup, { foreignKey: "groupId", onDelete: "CASCADE" });
StudyGroup.hasMany(GroupTask, { foreignKey: "groupId", onDelete: "CASCADE" });
GroupTask.belongsTo(StudyGroup, { foreignKey: "groupId", onDelete: "CASCADE" });

StudyGroup.hasMany(GroupMessage, { foreignKey: "groupId", onDelete: "CASCADE" });
GroupMessage.belongsTo(StudyGroup, { foreignKey: "groupId", onDelete: "CASCADE" });

User.hasMany(GroupMessage, { foreignKey: "senderId", onDelete: "CASCADE" });
GroupMessage.belongsTo(User, {
  as: "sender",
  foreignKey: "senderId",
  onDelete: "CASCADE",
});

User.hasMany(Notifications, { foreignKey: "userId", onDelete: "CASCADE" });
Notifications.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

User.hasMany(UserAvailability, { foreignKey: "userId", onDelete: "CASCADE" });
UserAvailability.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

Task.hasMany(Notifications, { foreignKey: "taskId", onDelete: "CASCADE" });
Notifications.belongsTo(Task, { foreignKey: "taskId", onDelete: "CASCADE" });

export {
  sequelize,
  connectDB,
  disconnectDB,
  User,
  Task,
  Schedule,
  StudyGroup,
  GroupMember,
  GroupTask,
  GroupMessage,
  Notifications,
  UserAvailability,
};
