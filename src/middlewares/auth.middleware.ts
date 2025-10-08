import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.config";

const JWT_SECRET = process.env.JWT_SECRET as string;

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      email: string;
      password: string;
    };

    const user = {
      ...decoded,
      id: String(decoded.id),
      username: String(decoded.username),
      email: String(decoded.email),
    };

    const searchUserQuery = await pool.query(
      `
    SELECT id FROM users WHERE username = $1
    `,
      [user.username]
    );

    if (searchUserQuery.rows.length > 0) {
      user.id = searchUserQuery.rows[0].id;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};
