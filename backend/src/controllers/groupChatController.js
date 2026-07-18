import { GroupMember, GroupMessage, User } from "../models/index.js";

const isMember = async (groupId, userId) => {
  const membership = await GroupMember.findOne({
    where: { groupId, userId, status: "accepted" },
  });
  return Boolean(membership);
};

export const getGroupMessages = async (req, res) => {
  const allowed = await isMember(req.params.id, req.user.id);
  if (!allowed) return res.status(404).json({ message: "Group Not Found" });

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const messages = await GroupMessage.findAll({
    where: { groupId: req.params.id },
    include: [{ model: User, as: "sender", attributes: ["id", "name", "email", "avatar"] }],
    order: [["sentAt", "DESC"]],
    limit,
  });

  res.json(messages.reverse());
};
