export default (sequelize, DataTypes) => {
  return sequelize.define(
    "GroupMember",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      groupId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      role: { type: DataTypes.STRING, defaultValue: "member" },
      status: {
        type: DataTypes.ENUM("pending", "accepted"),
        defaultValue: "accepted",
      },
    },
    {
      timestamps: false,
      tableName: "GroupMember",
      indexes: [
        { fields: ["groupId", "userId"] },
        { fields: ["userId", "status"] },
        { fields: ["groupId", "status"] },
      ],
    },
  );
};
