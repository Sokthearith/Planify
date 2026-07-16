import { sequelize } from "./src/models/index.js";

async function grant() {
  await sequelize.authenticate();

  await sequelize.query("CREATE USER IF NOT EXISTS 'frontend_dev'@'%' IDENTIFIED BY 'Frontend123!'");
  await sequelize.query("CREATE USER IF NOT EXISTS 'backend_dev'@'%' IDENTIFIED BY 'Backend123!'");
  await sequelize.query("CREATE USER IF NOT EXISTS 'maint_dev'@'%' IDENTIFIED BY 'Maint123!'");

  await sequelize.query("GRANT SELECT ON defaultdb.* TO 'frontend_dev'@'%'");
  await sequelize.query("GRANT SELECT, INSERT, UPDATE, DELETE ON defaultdb.* TO 'backend_dev'@'%'");
  await sequelize.query("GRANT ALL PRIVILEGES ON defaultdb.* TO 'maint_dev'@'%'");

  await sequelize.query("FLUSH PRIVILEGES");
  console.log("Users created and privileges granted.");
  await sequelize.close();
}

grant().catch((err) => {
  console.error(err);
  process.exit(1);
});
