import { StudyGroup, GroupMember, User } from "../models/index.js";

export const createGroup = async (req, res) => {
  const { name } = req.body;
  const group = await StudyGroup.create({
    name,
    createBy: req.user.id,
  });
  await GroupMember.create({
    groupId: group.id,
    userId: req.user.id,
    role: "admin",
  });
  const full = await StudyGroup.findByPk(group.id, {
    include: [
      {
        model: GroupMember,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
  res.status(201).json(full);
};

export const getMyGroups = async (req, res) => {
  const membership = await GroupMember.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: StudyGroup,
        include: [
          { model: User, as: "creator", attributes: ["id", "name"] },
          {
            model: GroupMember,
            include: [{ model: User, attributes: ["id", "email"] }],
          },
        ],
      },
    ],
  });
  res.json(membership.map((m) => m.StudyGroup));
};

export const getMyGroupsById = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id, {
    include: [
      { model: User, as: "creator", attributes: ["id", "name"] },
      {
        model: GroupMember,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      },
    ],
  });
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  res.json(group);
};

export const updateGroup = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can update" });
  await group.update({ name: req.body.name });
  res.json(group);
};

export const deleteGroup = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can delete" });
  await group.destroy();
  res.json({ message: "Group deleted" });
};

export const addMember = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "User Not Found" });
  const existing = await GroupMember.findOne({
    where: { groupId: req.params.id, userId: user.id },
  });
  if (existing) return res.status(400).json({ message: "Already a member" });
  const member = await GroupMember.create({
    groupId: req.params.id,
    userId: user.id,
  });
  const full = await GroupMember.findByPk(member.id, {
    include: [{ model: User, attributes: ["id", "name", "email"] }],
  });
  res.status(201).json(full);
};

export const removeMember = async (req, res) => {
  const group = await StudyGroup.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: "Group Not Found" });
  const member = await GroupMember.findByPk(req.params.memberId);
  if (!member) return res.status(404).json({ message: "Member Not Found" });
  if (group.createBy !== req.user.id && member.userId !== req.user.id)
    return res.status(403).json({ message: "Not Authorized" });
  await member.destroy();
  res.json({ message: "Member removed" });
};
