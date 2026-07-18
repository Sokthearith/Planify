import { config } from "dotenv";
import { connectDB, disconnectDB } from "./models/index.js";
import { startDeadlineReminderJob } from "./utils/deadlineReminderJob.js";
import { initRealtime } from "./utils/realtime.js";
import app from "./app.js";

config();
await connectDB();

const PORT = Number(process.env.PORT || 5001);

const server = app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
initRealtime(server);

const deadlineReminderJob = startDeadlineReminderJob();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection: ", err);
  clearInterval(deadlineReminderJob);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err);
  clearInterval(deadlineReminderJob);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("SIGTERM", async () => {
  console.error("SIGTERM recieved, shutting down gracefully");
  clearInterval(deadlineReminderJob);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
