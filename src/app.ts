import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.config";
import { router as authRoutes } from "./routes/auth.route";
import { router as userRoutes } from "./routes/user.route";
import { runSqlFile } from "./utils/sqlRunner";
export const app = express();

const PORT = process.env.PORT;
const allowedOrigins = process.env.CLIENT_URL;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

export const startServer = async () => {
  try {
    await pool.connect();

    // await runSqlFile("drop_tables.sql");

    await runSqlFile("schema.sql");

    console.log("Connected to DB");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error);
    // process.exit(1)
  }
};

startServer();
