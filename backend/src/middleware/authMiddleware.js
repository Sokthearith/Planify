import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decode.id, {
        attributes: { exclude: "password" },
      });
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
