import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./models/index.js";
import groupRoutes from "./routes/groupRoute.js";
import authRoutes from "./routes/authRoute.js";
import taskRoutes from "./routes/taskRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import { startDeadlineReminderJob } from "./utils/deadlineReminderJob.js";

config();
await connectDB();

const app = express();
app.use(express.json());

app.use("/api/groups", groupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = 5001;

const server = app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

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
