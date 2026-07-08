import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import {
  GroupMember,
  GroupMessage,
  StudyGroup,
  User,
} from "../models/index.js";

let io = null;

const userRoom = (userId) => `user:${userId}`;
const groupRoom = (groupId) => `group:${groupId}`;

export const isAcceptedGroupMember = async (groupId, userId) => {
  const membership = await GroupMember.findOne({
    where: { groupId, userId, status: "accepted" },
  });
  return Boolean(membership);
};

export const getAcceptedGroupMemberIds = async (groupId) => {
  const members = await GroupMember.findAll({
    where: { groupId, status: "accepted" },
    attributes: ["userId"],
  });
  return members.map((member) => member.userId);
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
};

export const emitToGroup = (groupId, event, payload) => {
  if (!io || !groupId) return;
  io.to(groupRoom(groupId)).emit(event, payload);
};

export const emitToGroupMembers = async (groupId, event, payload) => {
  const memberIds = await getAcceptedGroupMemberIds(groupId);
  memberIds.forEach((userId) => emitToUser(userId, event, payload));
};

const getTokenFromHandshake = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.split(" ")[1];

  return null;
};

const loadSocketUser = async (socket) => {
  const token = getTokenFromHandshake(socket);
  if (!token) throw new Error("Missing auth token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ["password"] },
  });
  if (!user) throw new Error("User not found");
  return user;
};

const serializeMessage = (message) => ({
  id: message.id,
  groupId: message.groupId,
  senderId: message.senderId,
  message: message.message,
  sentAt: message.sentAt,
  sender: message.sender
    ? {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
      }
    : null,
});

export const initRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      socket.user = await loadSocketUser(socket);
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(userRoom(userId));
    socket.emit("connection:ready", { userId });

    socket.on("group:join", async ({ groupId } = {}, ack) => {
      try {
        if (!groupId) throw new Error("groupId is required");
        const allowed = await isAcceptedGroupMember(groupId, userId);
        if (!allowed) throw new Error("Not authorized for this group");
        socket.join(groupRoom(groupId));
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
        socket.emit("error:message", { message: error.message });
      }
    });

    socket.on("group:leave", ({ groupId } = {}) => {
      if (groupId) socket.leave(groupRoom(groupId));
    });

    socket.on("group:message:send", async ({ groupId, message } = {}, ack) => {
      try {
        const text = typeof message === "string" ? message.trim() : "";
        if (!groupId) throw new Error("groupId is required");
        if (!text) throw new Error("Message is required");
        if (text.length > 2000) throw new Error("Message is too long");

        const allowed = await isAcceptedGroupMember(groupId, userId);
        if (!allowed) throw new Error("Not authorized for this group");

        const group = await StudyGroup.findByPk(groupId);
        if (!group) throw new Error("Group not found");

        const saved = await GroupMessage.create({
          groupId,
          senderId: userId,
          message: text,
        });
        const full = await GroupMessage.findByPk(saved.id, {
          include: [{ model: User, as: "sender", attributes: ["id", "name", "email"] }],
        });
        const payload = serializeMessage(full);
        emitToGroup(groupId, "group-chat:message", payload);
        ack?.({ ok: true, message: payload });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
        socket.emit("error:message", { message: error.message });
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getRealtimeServer = () => io;
