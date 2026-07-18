import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { GroupMember, User } from "../models/index.js";
import generateToken from "../utils/generateToken.js";
import { promises as dns } from "dns";
import { normalizePreferences } from "../utils/userPreferences.js";
import { emitToGroupMembers } from "../utils/realtime.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_ATTRIBUTES = ["id", "name", "email", "password"];
const PASSWORD_RESET_ATTRIBUTES = [
  ...LOGIN_ATTRIBUTES,
  "resetPasswordCode",
  "resetPasswordExpires",
];

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  year: user.year || "First Year",
  major: user.major || "Engineering",
  bio: user.bio || "",
  avatar: user.avatar || "",
  subjects: Array.isArray(user.subjects) ? user.subjects : [],
  preferences: normalizePreferences(user.preferences),
});

const validAvatar = (value) => (
  value === "" || value === null || (
    typeof value === "string" &&
    /^data:image\/(jpeg|png|webp);base64,/.test(value) &&
    value.length <= 700_000
  )
);

const validatePassword = (password) => {
  const errors = [];

  if (!password) return ["Password is required"];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/\d/.test(password)) errors.push("One number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push("One special character");
  return errors;
};

const validateEmailDomain = async (email) => {
  const domain = email.split("@")[1];
  const mx = await Promise.race([
    dns.resolveMx(domain),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
  ]);
  return mx && mx.length > 0;
};

const resetCodeDevResponse = (code, user, delivery = "Code logged by backend and returned for local development.") => {
  console.log(`Password reset code for ${user.email}: ${code}`);
  return {
    devCode: code,
    delivery,
  };
};

const deliverResetCode = async (code, user) => {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Password reset email is not configured");
    }
    return resetCodeDevResponse(code, user);
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const auth = process.env.SMTP_USER || process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "Planify <no-reply@planify.local>",
    to: user.email,
    subject: "Your Planify password reset code",
    text: `Your Planify password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Planify password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  return { delivery: "Verification code emailed." };
};

export const register = async (req, res) => {
  const { name, password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    if (!(await validateEmailDomain(email))) {
      return res.status(400).json({ message: "Email domain does not accept mail" });
    }
  } catch (e) {
    if (e.message === "timeout") {
      return res.status(400).json({ message: "Email domain lookup timed out" });
    }
    return res.status(400).json({ message: "Email domain not found" });
  }

  const errors = validatePassword(password);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Password too weak", errors });
  }

  const exist = await User.findOne({
    where: { email },
    attributes: ["id"],
  });
  if (exist) return res.status(400).json({ message: "User already exists" });
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email,
    password: hashPassword,
  });

  const token = generateToken(user.id, res);

  res.status(201).json({
    status: "register Successfully",
    data: publicUser(user),
    token,
  });
};

export const login = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  // Keep sign-in compatible with databases that have not applied the optional
  // profile/preferences columns yet. The migration can then run independently
  // without making existing accounts inaccessible.
  const user = await User.findOne({
    where: { email },
    attributes: LOGIN_ATTRIBUTES,
  });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });
  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = generateToken(user.id, res);

  res.json({
    status: "Logins Successfully",
    data: publicUser(user),
    token,
  });
};

export const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const user = await User.findOne({
    where: { email },
    attributes: PASSWORD_RESET_ATTRIBUTES,
  });
  if (!user) {
    return res.json({
      message: "If an account exists for that email, a verification code has been sent.",
    });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const salt = await bcrypt.genSalt(10);
  user.resetPasswordCode = await bcrypt.hash(code, salt);
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  let deliveryMeta;
  try {
    deliveryMeta = await deliverResetCode(code, user);
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      return res.status(502).json({ message: "Could not send verification code" });
    }
    console.error(`Password reset email delivery failed: ${e.message}`);
    deliveryMeta = resetCodeDevResponse(code, user, "Email delivery failed; code returned for local development.");
  }

  res.json({
    message: "Verification code sent. It expires in 10 minutes.",
    ...deliveryMeta,
  });
};

export const verifyResetCode = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "").trim();

  if (!email || !emailRegex.test(email) || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  const user = await User.findOne({
    where: { email },
    attributes: PASSWORD_RESET_ATTRIBUTES,
  });
  const expired = !user?.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now();
  const match = user?.resetPasswordCode ? await bcrypt.compare(code, user.resetPasswordCode) : false;

  if (!user || expired || !match) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  res.json({ message: "Code verified. Choose a new password." });
};

export const resetPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "").trim();
  const { password } = req.body;

  if (!email || !emailRegex.test(email) || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  const errors = validatePassword(password);
  if (errors.length > 0) {
    return res.status(400).json({ message: "Password too weak", errors });
  }

  const user = await User.findOne({
    where: { email },
    attributes: PASSWORD_RESET_ATTRIBUTES,
  });
  const expired = !user?.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now();
  const match = user?.resetPasswordCode ? await bcrypt.compare(code, user.resetPasswordCode) : false;

  if (!user || expired || !match) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: "Password reset successfully. You can sign in now." });
};

export const logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
  res.json({ message: "Logout Successfully" });
};

export const getMe = async (req, res) => {
  res.json({ data: publicUser(req.user) });
};

export const updateMe = async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ message: "Name is required" });
    updates.name = name.slice(0, 120);
  }
  ["year", "major", "bio"].forEach((field) => {
    if (req.body[field] !== undefined) {
      const maximum = field === "bio" ? 1000 : 120;
      updates[field] = String(req.body[field]).trim().slice(0, maximum);
    }
  });
  if (req.body.avatar !== undefined) {
    if (!validAvatar(req.body.avatar)) {
      return res.status(400).json({ message: "Avatar must be a JPEG, PNG, or WebP image under 700 KB" });
    }
    updates.avatar = req.body.avatar || null;
  }
  await req.user.update(updates);
  if (updates.avatar !== undefined || updates.name !== undefined) {
    const memberships = await GroupMember.findAll({
      where: { userId: req.user.id, status: "accepted" },
      attributes: ["groupId"],
    });
    await Promise.all(memberships.map((membership) => emitToGroupMembers(
      membership.groupId,
      "user:profile-updated",
      { userId: req.user.id, name: req.user.name, avatar: req.user.avatar || "" },
    )));
  }
  res.json({ data: publicUser(req.user) });
};

export const getPreferences = async (req, res) => {
  res.json({
    preferences: normalizePreferences(req.user.preferences),
    subjects: Array.isArray(req.user.subjects) ? req.user.subjects : [],
  });
};

export const updatePreferences = async (req, res) => {
  const allowed = [
    "inAppNotifications", "dueReminders", "groupTaskUpdates",
    "groupMessages", "aiSuggestions", "focusMinutes", "breakMinutes",
  ];
  const preferences = normalizePreferences(req.user.preferences);
  allowed.forEach((field) => {
    if (req.body.preferences?.[field] !== undefined) {
      preferences[field] = ["focusMinutes", "breakMinutes"].includes(field)
        ? req.body.preferences[field]
        : Boolean(req.body.preferences[field]);
    }
  });
  preferences.focusMinutes = Math.min(180, Math.max(1, Number(preferences.focusMinutes) || 25));
  preferences.breakMinutes = Math.min(60, Math.max(1, Number(preferences.breakMinutes) || 5));

  let subjects = Array.isArray(req.user.subjects) ? req.user.subjects : [];
  if (req.body.subjects !== undefined) {
    if (!Array.isArray(req.body.subjects)) {
      return res.status(400).json({ message: "Subjects must be an array" });
    }
    subjects = [...new Set(req.body.subjects
      .map((subject) => String(subject).trim())
      .filter(Boolean))].slice(0, 100);
  }
  await req.user.update({ preferences, subjects });
  res.json({ preferences, subjects });
};
