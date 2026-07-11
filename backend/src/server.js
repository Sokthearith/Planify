import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./models/index.js";
import groupRoutes from "./routes/groupRoute.js";
import authRoutes from "./routes/authRoute.js";
import taskRoutes from "./routes/taskRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";
import { startDeadlineReminderJob } from "./utils/deadlineReminderJob.js";
import { initRealtime } from "./utils/realtime.js";
import chatbotRoutes from "./routes/chatbotRoute.js";
import availabilityRoutes from "./routes/availabilityRoute.js";

config();
await connectDB();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_ORIGIN || req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/api/groups", groupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/availability", availabilityRoutes);

const PORT = 5001;

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
