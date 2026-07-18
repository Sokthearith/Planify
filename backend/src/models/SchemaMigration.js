export default (sequelize, DataTypes) => sequelize.define(
  "SchemaMigration",
  {
    name: { type: DataTypes.STRING, primaryKey: true },
    appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, tableName: "SchemaMigration" },
);
