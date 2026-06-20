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
      subject: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      deadline: { type: DataTypes.DATE },
      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        defaultValue: "low",
      },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "done"),
        defaultValue: "pending",
      },
      createAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "Task",
      indexes: [
        { fields: ["userId"] },
        { fields: ["deadline"] },
        { fields: ["status"] },
      ],
    },
  );
};
