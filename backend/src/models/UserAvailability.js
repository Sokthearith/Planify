export default (sequelize, DataTypes) => {
  return sequelize.define(
    "UserAvailability",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      dayOfWeek: { type: DataTypes.TINYINT, allowNull: false },
      startTime: { type: DataTypes.STRING, allowNull: false },
      endTime: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM("available", "blocked"),
        defaultValue: "available",
      },
    },
    {
      timestamps: false,
      tableName: "UserAvailability",
      indexes: [
        { fields: ["userId", "dayOfWeek"] },
      ],
    },
  );
};
