export default (sequelize, DataTypes) => {
  return sequelize.define(
    "GroupTask",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: { type: DataTypes.TEXT },
      dueDate: { type: DataTypes.DATE },
      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        defaultValue: "medium",
      },
      done: { type: DataTypes.BOOLEAN, defaultValue: false },
      assignees: { type: DataTypes.JSON, defaultValue: [] },
      createAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "GroupTask",
    },
  );
};
