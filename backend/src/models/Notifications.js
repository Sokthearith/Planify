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
      taskId: { type: DataTypes.UUID, allowNull: false },
      message: { type: DataTypes.STRING, allowNull: false },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "Notifications",
    },
  );
};
