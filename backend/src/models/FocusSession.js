export default (sequelize, DataTypes) => {
  return sequelize.define(
    "FocusSession",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      kind: {
        type: DataTypes.ENUM("focus", "break"),
        defaultValue: "focus",
      },
      status: {
        type: DataTypes.ENUM("running", "paused", "completed", "cancelled"),
        defaultValue: "running",
      },
      plannedSeconds: { type: DataTypes.INTEGER, allowNull: false },
      elapsedSeconds: { type: DataTypes.INTEGER, defaultValue: 0 },
      startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      endsAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "FocusSession",
      indexes: [
        { fields: ["userId", "status"] },
        { fields: ["userId", "completedAt"] },
      ],
    },
  );
};
