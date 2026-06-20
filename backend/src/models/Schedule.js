export default (sequelize, DataTypes) => {
  return sequelize.define(
    "Schedule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      generatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      planData: { type: DataTypes.JSON, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      timestamps: false,
      tableName: "Schedule",
    },
  );
};
