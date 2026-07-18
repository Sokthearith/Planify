import { FocusSession } from "../models/index.js";
import { emitToUser } from "../utils/realtime.js";

const activeWhere = (userId) => ({ userId, status: ["running", "paused"] });

const serialize = (session) => session ? session.toJSON() : null;

const finishExpired = async (session) => {
  if (!session || session.status !== "running" || !session.endsAt) return session;
  if (session.endsAt.getTime() > Date.now()) return session;
  await session.update({
    status: "completed",
    elapsedSeconds: session.plannedSeconds,
    completedAt: new Date(),
    endsAt: null,
  });
  emitToUser(session.userId, "focus-session:updated", serialize(session));
  return session;
};

export const getCurrentFocusSession = async (req, res) => {
  const session = await FocusSession.findOne({
    where: activeWhere(req.user.id),
    order: [["createdAt", "DESC"]],
  });
  await finishExpired(session);
  res.json(session?.status === "completed" ? null : serialize(session));
};

export const startFocusSession = async (req, res) => {
  const kind = req.body.kind === "break" ? "break" : "focus";
  const maximum = kind === "focus" ? 180 * 60 : 60 * 60;
  const plannedSeconds = Math.min(maximum, Math.max(60, Math.round(Number(req.body.plannedSeconds) || 0)));
  if (!Number.isFinite(plannedSeconds)) {
    return res.status(400).json({ message: "A valid duration is required" });
  }

  await FocusSession.update(
    { status: "cancelled", endsAt: null },
    { where: activeWhere(req.user.id) },
  );
  const now = new Date();
  const session = await FocusSession.create({
    userId: req.user.id,
    kind,
    status: "running",
    plannedSeconds,
    elapsedSeconds: 0,
    startedAt: now,
    endsAt: new Date(now.getTime() + plannedSeconds * 1000),
  });
  emitToUser(req.user.id, "focus-session:updated", serialize(session));
  res.status(201).json(session);
};

export const updateFocusSession = async (req, res) => {
  const session = await FocusSession.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!session) return res.status(404).json({ message: "Focus session not found" });
  const action = req.body.action;

  if (action === "pause" && session.status === "running") {
    const remaining = Math.max(0, Math.ceil((session.endsAt.getTime() - Date.now()) / 1000));
    await session.update({
      status: "paused",
      elapsedSeconds: session.plannedSeconds - remaining,
      endsAt: null,
    });
  } else if (action === "resume" && session.status === "paused") {
    const remaining = Math.max(1, session.plannedSeconds - session.elapsedSeconds);
    await session.update({
      status: "running",
      endsAt: new Date(Date.now() + remaining * 1000),
    });
  } else if (action === "complete") {
    if (session.status !== "completed") {
      await session.update({
        status: "completed",
        elapsedSeconds: session.plannedSeconds,
        completedAt: new Date(),
        endsAt: null,
      });
    }
  } else {
    return res.status(400).json({ message: "Invalid focus-session action" });
  }

  emitToUser(req.user.id, "focus-session:updated", serialize(session));
  res.json(session);
};

export const cancelFocusSession = async (req, res) => {
  const session = await FocusSession.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!session) return res.status(404).json({ message: "Focus session not found" });
  if (!["completed", "cancelled"].includes(session.status)) {
    await session.update({ status: "cancelled", endsAt: null });
  }
  emitToUser(req.user.id, "focus-session:updated", serialize(session));
  res.json(session);
};
