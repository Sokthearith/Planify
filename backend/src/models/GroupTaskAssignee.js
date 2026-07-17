export default (sequelize, DataTypes) => {
  return sequelize.define(
    "GroupTaskAssignee",
    {
      groupTaskId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "GroupTaskAssignee",
      indexes: [{ fields: ["userId", "groupTaskId"] }],
    },
  );
};
