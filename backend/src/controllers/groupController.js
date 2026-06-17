import { prisma } from "../config/db.js";

// Post - Create user a group (you will be a creator and admin member)
export const createGroup = async (req, res) => {
  const { name } = req.body;
  const group = await prisma.studyGroup.create({
    data: {
      name,
      createBy: req.user.id,
      groupMembers: { create: { userId: req.user.id, role: "admin" } },
    },
    include: {
      groupMembers: {
        include: { user: { id: true, name: true, email: true } },
      },
    },
  });
  res.status(201).json(group);
};

// Get - List all the group memeber you're a member of
export const getMyGroups = async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { userId: req.user.id },
    include: {
      group: {
        include: {
          creator: { select: { id: true, name: true } },
          groupMembers: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
      },
    },
  });
  res.json(membership.map((m) => m.group));
};

// Get - get group detials
export const getMyGroupsById = async (req, res) => {
  const group = await prisma.studyGroup.findUnique({
    where: { id: req.params.id },
    include: {
      creator: { select: { id: true, name: true } },
      groupMembers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!group) return res.status(401).json({ message: "Group Not Found" });
  res.json(group);
};

// Put - rename group (create or admin only)
export const updateGroup = async (req, res) => {
  const group = await prisma.studyGroup.findUnique({
    where: { id: req.params.id },
  });

  if (!group) return res.status(401).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can update" });
  const updated = await prisma.studyGroup.update({
    where: { id: req.params.id },
    data: { name: req.body.name },
  });
  res.json(updated);
};

// Delete - id delete group (create only)
export const deleteGroup = async (req, res) => {
  const group = await prisma.studyGroup.findUnique({
    where: { id: req.params.id },
  });
  if (!group) return res.status(401).json({ message: "Group Not Found" });
  if (group.createBy !== req.user.id)
    return res.status(403).json({ message: "Only the creator can delete" });

  await prisma.studyGroup.delete({
    where: { id: req.params.id },
  });
  res.json({ message: "Group deleted" });
};
export const addMember = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return res.status(404).json({ message: "User Not Found" });
  const existing = await prisma.groupMember.findUnique({
    where: { groupId: req.params.id, userId: user.id },
  });
  if (existing) return res.status(404).json({ message: "Already a member" });
  const member = await prisma.groupMember.create({
    data: { groupId: req.params.id, userId: user.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json(member);
};
// Delete /api/group/:id/members/:memberid - remove a member id
export const removeMember = async (req, res) => {
  const group = await prisma.studyGroup.findUnique({
    where: { id: req.params.id },
  });
  if (!group) return res.status(404).json({ message: "Group Not Found" });

  // Only the creator and the member themselves can remove
  const member = await prisma.groupMember.findUnique({
    where: { id: req.params.memberId },
  });
  if (!member) return res.status(404).json({ message: "Member Not Found" });
  if (group.createBy !== req.user.id && member.userId !== req.user.id) {
    return res.status(403).json({ message: "Not Authorized" });
  }

  await prisma.groupMember.delete({
    where: { id: req.params.memberId },
  });
  res.json({ message: "Member remove" });
};
