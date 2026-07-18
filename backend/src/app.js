import express from "express";
import groupRoutes from "./routes/groupRoute.js";
import authRoutes from "./routes/authRoute.js";
import taskRoutes from "./routes/taskRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";
import chatbotRoutes from "./routes/chatbotRoute.js";
import availabilityRoutes from "./routes/availabilityRoute.js";
import focusSessionRoutes from "./routes/focusSessionRoute.js";
import progressRoutes from "./routes/progressRoute.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_ORIGIN || req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
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
app.use("/api/focus-sessions", focusSessionRoutes);
app.use("/api/progress", progressRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "Unexpected server error" : error.message,
  });
});

export default app;
