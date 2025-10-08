import { Request, Response } from "express";
import { query, validationResult } from "express-validator";
import pool from "../config/db.config";

interface requestParam {
  username?: string;
  email?: string;
  age?: string;
}
export const getUsers = async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    await pool.query("BEGIN");
    const existingUser = await pool.query(
      `
    SELECT username, email, age FROM users WHERE id = $1
    `,
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const getUsersQuery = await pool.query(`
        SELECT id, username, email, age FROM users`);

    if (getUsersQuery.rows.length === 0) {
      return res.status(404).json({ message: "No users available" });
    } else {
      return res.status(200).json({
        message: "Users fetched successfully",
        users: getUsersQuery.rows.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          age: user.age,
        })),
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error " });
  }
};

export const getUserByUniqueQuery = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Invalid request", errors: errors.array() });
  }

  try {
    const { filterType, value } = req.params;

    const allowedFilters = ["email", "username", "age"];

    if (!allowedFilters.includes(filterType)) {
      return res.status(400).json({
        message: "Invalid filter. Use one of: email, username, or age.",
      });
    }
    //   if (!id && (requestBody.age || requestBody.email || requestBody.username)) {
    //     return res
    //       .status(400)
    //       .json({ message: "Invalid request", errors: errors.array() });
    //   }

    const existingUserQuery = await pool.query(
      `
    SELECT id, username, email, age FROM users WHERE id = $1
    `,
      [id]
    );

    if (existingUserQuery.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await pool.query(
      `SELECT id, username, email, age FROM users WHERE ${filterType} = $1`,
      [value]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user: result.rows.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
      })),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Invalid request", errors: errors.array() });
  }

  const requestBody: requestParam = req.body;

  if (!id) {
    return res.status(400).json({ message: "Invalid request" });
  }

  if (!Object.keys(requestBody).length) {
    return res.status(400).json({ message: "No fields provided to update" });
  }

  try {
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const duplicateConditions: string[] = [];
    const duplicateValues: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(requestBody)) {
      if (["username", "email"].includes(key)) {
        duplicateConditions.push(`${key} = $${idx++}`);
        duplicateValues.push(value);
      }
    }

    if (duplicateConditions.length > 0) {
      const duplicateQuery = `
        SELECT id, username, email 
        FROM users
        WHERE (${duplicateConditions.join(" OR ")})
        AND id != $${idx}
      `;
      duplicateValues.push(id);

      const duplicates = await pool.query(duplicateQuery, duplicateValues);

      if (duplicates.rows.length > 0) {
        const duplicateFields = duplicates.rows
          .map((u) => {
            const conflicts: string[] = [];
            if (requestBody.username && u.username === requestBody.username)
              conflicts.push("username");
            if (requestBody.email && u.email === requestBody.email)
              conflicts.push("email");
            return conflicts.join(" & ");
          })
          .filter(Boolean)
          .join(", ");

        return res.status(400).json({
          message: `${
            duplicateFields.charAt(0).toUpperCase() + duplicateFields.slice(1)
          } already in use`,
        });
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(requestBody)) {
      fields.push(`${key} = $${index++}`);
      values.push(value);
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, username, email, age
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const { userId } = req.params;
  if (!id && !userId) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const existingUserQuery = await pool.query(
      `
    SELECT id, username, email, age FROM users WHERE id = $1
    `,
      [id]
    );
    if (existingUserQuery.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const deleteUserQuery = await pool.query(
      `
    DELETE FROM users WHERE id = $1 RETURNING *
    `,
      [userId]
    );
    return res.status(200).json({
      message: "User deleted successfully",
      user: deleteUserQuery.rows[0],
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
