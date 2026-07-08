export default (sequelize, DataTypes) => {
  return sequelize.define(
    "GroupMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      groupId: { type: DataTypes.UUID, allowNull: false },
      senderId: { type: DataTypes.UUID, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "GroupMessage",
      indexes: [
        { fields: ["groupId"] },
        { fields: ["senderId"] },
        { fields: ["sentAt"] },
      ],
    },
  );
};
