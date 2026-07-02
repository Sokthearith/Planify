export default (sequelize, DataTypes) => {
  return sequelize.define(
    "StudyGroup",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      subject: { type: DataTypes.STRING },
      createBy: { type: DataTypes.UUID, allowNull: false },
      createAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      tableName: "StudyGroup",
    },
  );
};
