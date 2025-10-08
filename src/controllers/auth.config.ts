import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.config";
import { validationResult } from "express-validator";

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;

interface RegisterProps {
  username: string;
  email: string;
  age: string;
  password: string;
  userId?: string;
}

interface LoginProps {
  username: string;
  password: string;
}

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  const requestBody: RegisterProps = req.body;
  if (
    !requestBody ||
    !requestBody.age ||
    !requestBody.email ||
    !requestBody.username ||
    !requestBody.password
  ) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      `SELECT * FROM users WHERE email = $1`,
      [requestBody.email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashPassword = await bcrypt.hash(requestBody.password, 12);

    requestBody.userId = uuidv4();

    const createUserQuery = await client.query(
      `
            INSERT INTO users (username, email, password, age, id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email, age
            `,
      [
        requestBody.username,
        requestBody.email,
        hashPassword,
        requestBody.age,
        requestBody.userId,
      ]
    );

    await client.query("COMMIT");

    const createdUser = createUserQuery.rows[0];

    if (createdUser) {
      return res.status(201).json({
        message: "User registered successfully",
        user: createdUser,
      });
    } else {
      return res.status(500).json({ message: "Server error" });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const validator = validationResult(req);
  if (!validator.isEmpty()) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const requestBody: LoginProps = req.body;
  if (!requestBody || !requestBody.password || !requestBody.username) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  try {
    const existingUserQuery = await pool.query(
      `
        SELECT * FROM users WHERE username = $1`,
      [requestBody.username]
    );

    const existingUser = existingUserQuery.rows[0];
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(
      requestBody.password,
      existingUser.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        password: existingUser.password,
        age: existingUser.age,
      },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.username,
        age: existingUser.age,
      },
    });
  } catch (error) {}
};
