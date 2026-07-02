export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Notifications",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      taskId: { type: DataTypes.UUID, allowNull: true },
      groupId: { type: DataTypes.UUID, allowNull: true },
      inviterId: { type: DataTypes.UUID, allowNull: true },
      type: {
        type: DataTypes.ENUM("task", "group", "group_invite", "ai", "system"),
        defaultValue: "task",
      },
      inviteStatus: {
        type: DataTypes.ENUM("pending", "accepted", "declined"),
        allowNull: true,
      },
      message: { type: DataTypes.STRING, allowNull: false },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "Notifications",
      indexes: [
        { fields: ["userId"] },
        { fields: ["groupId"] },
        { fields: ["inviterId"] },
        { fields: ["isRead"] },
        { fields: ["inviteStatus"] },
        { fields: ["sentAt"] },
      ],
    },
  );
};
