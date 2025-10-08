import fs from "fs";
import path from "path";
import pool from "../config/db.config";

export const runSqlFile = async (filename: string) => {
  try {
    const filePath = path.join(__dirname, `../sql/${filename}`);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Running SQL file: ${filename}...`);
    await pool.query(sql);
    console.log(`Successfully executed ${filename}`);
  } catch (error) {
    console.error(`Error executing ${filename}:`, error);
  }
};
