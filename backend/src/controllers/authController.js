import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import generateToken from "../utils/generateToken.js";
import { promises as dns } from "dns";

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

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const domain = email.split("@")[1];
  try {
    const mx = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    if (!mx || mx.length === 0) {
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

  const exist = await User.findOne({ where: { email } });
  if (exist) return res.status(400).json({ message: "User already exists" });
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashPassword });

  const token = generateToken(user.id, res);

  res.status(201).json({
    status: "register Successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const domain = email.split("@")[1];
  try {
    const mx = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    if (!mx || mx.length === 0) {
      return res.status(400).json({ message: "Email domain does not accept mail" });
    }
  } catch (e) {
    if (e.message === "timeout") {
      return res.status(400).json({ message: "Email domain lookup timed out" });
    }
    return res.status(400).json({ message: "Email domain not found" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });
  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = generateToken(user.id, res);

  res.json({
    status: "Logins Successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  });
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
  res.json({
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};
