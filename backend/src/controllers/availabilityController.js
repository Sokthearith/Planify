import { UserAvailability } from "../models/index.js";

const validDays = [0, 1, 2, 3, 4, 5, 6];
const validTypes = ["available", "blocked"];
const timeRegex = /^\d{2}:\d{2}$/;

function validateSlots(slots) {
  for (const slot of slots) {
    if (!slot.name || !slot.name.trim())
      return { valid: false, message: "name is required" };
    if (!validDays.includes(slot.dayOfWeek))
      return { valid: false, message: `dayOfWeek must be 0-6` };
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime))
      return { valid: false, message: `startTime and endTime must be HH:MM` };
    if (slot.type && !validTypes.includes(slot.type))
      return { valid: false, message: `type must be 'available' or 'blocked'` };
  }
  return { valid: true };
}

export const getMyAvailability = async (req, res) => {
  const slots = await UserAvailability.findAll({
    where: { userId: req.user.id },
    order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]],
  });
  res.json(slots);
};

export const setAvailability = async (req, res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots))
    return res.status(400).json({ message: "slots must be an array" });

  const validation = validateSlots(slots);
  if (!validation.valid)
    return res.status(400).json({ message: validation.message });

  await UserAvailability.destroy({ where: { userId: req.user.id } });

  const records = slots.map((slot) => ({
    userId: req.user.id,
    name: slot.name.trim(),
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    type: slot.type || "available",
  }));

  const created = await UserAvailability.bulkCreate(records);
  res.status(200).json(created);
};

export const deleteAvailability = async (req, res) => {
  await UserAvailability.destroy({ where: { userId: req.user.id } });
  res.json({ message: "All availability slots deleted" });
};
