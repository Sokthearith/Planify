import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import groupRoutes from "./routes/groupRoute.js";

config();
connectDB();

const app = express();
app.use(express.json());

app.use("/api/groups", groupRoutes);

const PORT = 5001;

const server = app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection: ", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("SIGTERM", async () => {
  console.error("SIGTERM recieved, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
