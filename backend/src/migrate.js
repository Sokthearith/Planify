import "dotenv/config";
import { disconnectDB, runMigrations, sequelize } from "./models/index.js";

try {
  await sequelize.authenticate();
  await runMigrations();
  console.log("Database migrations applied");
} catch (error) {
  console.error(`Database migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
