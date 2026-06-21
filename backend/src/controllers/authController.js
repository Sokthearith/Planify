import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import generateToken from "../utils/generateToken.js";

const validatePassword = (password) => {
  const errors = [];

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
    secure: process.env.NODE_ENV === "productions",
    sameSite: "strict",
    maxAge: 0,
  });
  res.json({ message: "Logout Successfully" });
};
