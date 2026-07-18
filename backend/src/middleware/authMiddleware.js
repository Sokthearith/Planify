import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const AUTH_USER_ATTRIBUTES = ["id", "name", "email"];

const findAuthenticatedUser = async (id) => {
  try {
    return await User.findByPk(id, {
      attributes: { exclude: ["password", "resetPasswordCode"] },
    });
  } catch (error) {
    const missingOptionalColumn = error?.original?.code === "ER_BAD_FIELD_ERROR" ||
      /unknown column/i.test(error.message || "");
    if (!missingOptionalColumn) throw error;
    return User.findByPk(id, { attributes: AUTH_USER_ATTRIBUTES });
  }
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      // Load the complete account on migrated databases and fall back to the
      // legacy account shape while additive profile migrations are pending.
      req.user = await findAuthenticatedUser(decode.id);
      if (!req.user) return res.status(401).json({ message: "User Not Found" });
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorize, no token" });
  }
};

export { protect };
