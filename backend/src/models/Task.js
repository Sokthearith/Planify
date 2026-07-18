export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      groupId: { type: DataTypes.UUID, allowNull: true },
      subject: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      deadline: { type: DataTypes.DATE },
      estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
      assignees: { type: DataTypes.JSON },
      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        defaultValue: "low",
      },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "done"),
        defaultValue: "pending",
      },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      createAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "Task",
      indexes: [
        { fields: ["userId"] },
        { fields: ["groupId"] },
        { fields: ["deadline"] },
        { fields: ["status"] },
      ],
    },
  );
};
