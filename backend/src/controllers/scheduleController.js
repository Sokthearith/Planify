import { Schedule } from "../models/index.js";

const getScheduleForUser = (scheduleId, userId) => {
  return Schedule.findOne({ where: { id: scheduleId, userId } });
};

const pickScheduleFields = (body) => {
  const fields = {};
  ["planData", "isActive"].forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });
  return fields;
};

const validateSchedule = ({ planData }, requirePlan = false) => {
  if (requirePlan && (planData === undefined || planData === null)) {
    return { message: "planData is required" };
  }
  return null;
};

const setActiveSchedule = async (schedule, userId) => {
  await Schedule.update({ isActive: false }, { where: { userId } });
  await schedule.update({ isActive: true });
};

export const createSchedule = async (req, res) => {
  const scheduleData = pickScheduleFields(req.body);
  const error = validateSchedule(scheduleData, true);
  if (error) return res.status(400).json(error);

  const schedule = await Schedule.create({
    ...scheduleData,
    userId: req.user.id,
  });

  if (schedule.isActive) await setActiveSchedule(schedule, req.user.id);

  res.status(201).json(schedule);
};

export const getMySchedules = async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.active === "true") where.isActive = true;
  if (req.query.active === "false") where.isActive = false;

  const schedules = await Schedule.findAll({
    where,
    order: [["generatedAt", "DESC"]],
  });

  res.json(schedules);
};

export const getScheduleById = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  res.json(schedule);
};

export const updateSchedule = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  const scheduleData = pickScheduleFields(req.body);
  const error = validateSchedule(scheduleData);
  if (error) return res.status(400).json(error);

  await schedule.update(scheduleData);
  if (scheduleData.isActive) await setActiveSchedule(schedule, req.user.id);

  res.json(schedule);
};

export const deleteSchedule = async (req, res) => {
  const schedule = await getScheduleForUser(req.params.id, req.user.id);
  if (!schedule) return res.status(404).json({ message: "Schedule Not Found" });

  await schedule.destroy();
  res.json({ message: "Schedule deleted" });
};
