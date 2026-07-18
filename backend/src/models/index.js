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
    // Existing installations need additive columns before model sync attempts
    // to create indexes that reference them (notably Notifications.dedupeKey).
    try {
      await runMigrations();
    } catch (error) {
      // Additive product migrations must not take authentication offline. The
      // legacy auth queries intentionally work without the optional columns.
      console.error(`DB migration warning: ${error.message}`);
    }
    try {
      await sequelize.sync();
    } catch (error) {
      // Keep legacy authentication online even if an optional model/index
      // cannot be synchronized yet.
      console.error(`DB model sync warning: ${error.message}`);
    }
    try {
      await backfillGroupTaskAssignees();
    } catch (error) {
      console.error(`DB backfill warning: ${error.message}`);
    }
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
import GroupTaskAssigneeModel from "./GroupTaskAssignee.js";
import NotificationModel from "./Notifications.js";
import GroupMessageModel from "./GroupMessage.js";
import UserAvailabilityModel from "./UserAvailability.js";
import FocusSessionModel from "./FocusSession.js";
import SchemaMigrationModel from "./SchemaMigration.js";

const User = UserModel(sequelize, DataTypes);
const Task = TaskModel(sequelize, DataTypes);
const Schedule = ScheduleModel(sequelize, DataTypes);
const StudyGroup = StudyGroupModel(sequelize, DataTypes);
const GroupMember = GroupMemberModel(sequelize, DataTypes);
const GroupTask = GroupTaskModel(sequelize, DataTypes);
const GroupTaskAssignee = GroupTaskAssigneeModel(sequelize, DataTypes);
const Notifications = NotificationModel(sequelize, DataTypes);
const GroupMessage = GroupMessageModel(sequelize, DataTypes);
const UserAvailability = UserAvailabilityModel(sequelize, DataTypes);
const FocusSession = FocusSessionModel(sequelize, DataTypes);
const SchemaMigration = SchemaMigrationModel(sequelize, DataTypes);

const ensureColumn = async (queryInterface, table, column, definition) => {
  const columns = await queryInterface.describeTable(table);
  if (!columns[column]) await queryInterface.addColumn(table, column, definition);
};

const runMigrations = async () => {
  await SchemaMigration.sync();
  const migrationName = "20260718-account-progress-focus";
  if (await SchemaMigration.findByPk(migrationName)) return;
  const queryInterface = sequelize.getQueryInterface();
  await ensureColumn(queryInterface, "User", "year", { type: DataTypes.STRING, allowNull: true });
  await ensureColumn(queryInterface, "User", "major", { type: DataTypes.STRING, allowNull: true });
  await ensureColumn(queryInterface, "User", "bio", { type: DataTypes.TEXT, allowNull: true });
  await ensureColumn(queryInterface, "User", "avatar", { type: DataTypes.TEXT("long"), allowNull: true });
  await ensureColumn(queryInterface, "User", "subjects", { type: DataTypes.JSON, allowNull: true });
  await ensureColumn(queryInterface, "User", "preferences", { type: DataTypes.JSON, allowNull: true });
  await ensureColumn(queryInterface, "Task", "completedAt", { type: DataTypes.DATE, allowNull: true });
  await ensureColumn(queryInterface, "GroupTask", "completedAt", { type: DataTypes.DATE, allowNull: true });
  await ensureColumn(queryInterface, "GroupTask", "estimatedHours", { type: DataTypes.FLOAT, allowNull: true });
  await ensureColumn(queryInterface, "Notifications", "dedupeKey", { type: DataTypes.STRING, allowNull: true });
  const indexes = await queryInterface.showIndex("Notifications");
  if (!indexes.some((index) => index.name === "notifications_user_dedupe")) {
    await queryInterface.addIndex("Notifications", ["userId", "dedupeKey"], {
      name: "notifications_user_dedupe",
      unique: true,
    });
  }
  await sequelize.query("UPDATE `Task` SET `completedAt` = `createAt` WHERE `status` = 'done' AND `completedAt` IS NULL");
  await sequelize.query("UPDATE `GroupTask` SET `completedAt` = `createAt` WHERE `done` = 1 AND `completedAt` IS NULL");
  await SchemaMigration.create({ name: migrationName });
};

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

GroupTask.hasMany(GroupTaskAssignee, {
  as: "assigneeLinks",
  foreignKey: "groupTaskId",
  onDelete: "CASCADE",
});
GroupTaskAssignee.belongsTo(GroupTask, {
  foreignKey: "groupTaskId",
  onDelete: "CASCADE",
});
User.hasMany(GroupTaskAssignee, {
  as: "groupTaskAssignments",
  foreignKey: "userId",
  onDelete: "CASCADE",
});
GroupTaskAssignee.belongsTo(User, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

StudyGroup.hasMany(GroupMessage, {
  foreignKey: "groupId",
  onDelete: "CASCADE",
});
GroupMessage.belongsTo(StudyGroup, {
  foreignKey: "groupId",
  onDelete: "CASCADE",
});

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

User.hasMany(FocusSession, { foreignKey: "userId", onDelete: "CASCADE" });
FocusSession.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

Task.hasMany(Notifications, { foreignKey: "taskId", onDelete: "CASCADE" });
Notifications.belongsTo(Task, { foreignKey: "taskId", onDelete: "CASCADE" });

const parseLegacyAssignees = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const backfillGroupTaskAssignees = async () => {
  const tasks = await GroupTask.findAll({ attributes: ["id", "assignees"] });
  const candidates = tasks.flatMap((task) =>
    [...new Set(parseLegacyAssignees(task.assignees).filter(Boolean))].map((userId) => ({
      groupTaskId: task.id,
      userId,
    })),
  );
  if (!candidates.length) return;

  const users = await User.findAll({
    where: { id: [...new Set(candidates.map((candidate) => candidate.userId))] },
    attributes: ["id"],
  });
  const validUserIds = new Set(users.map((user) => user.id));
  const rows = candidates.filter((candidate) => validUserIds.has(candidate.userId));
  if (rows.length) {
    await GroupTaskAssignee.bulkCreate(rows, { ignoreDuplicates: true });
  }
};

export {
  sequelize,
  connectDB,
  disconnectDB,
  runMigrations,
  User,
  Task,
  Schedule,
  StudyGroup,
  GroupMember,
  GroupTask,
  GroupTaskAssignee,
  GroupMessage,
  Notifications,
  UserAvailability,
  FocusSession,
  SchemaMigration,
};
