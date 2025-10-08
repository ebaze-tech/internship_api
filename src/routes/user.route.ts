import { Router } from "express";
import {
  deleteUser,
  getUserByUniqueQuery,
  getUsers,
  updateUser,
} from "../controllers/user.config";
import { authenticateUser } from "../middlewares/auth.middleware";

export const router = Router();

router.get("/all", authenticateUser, getUsers);
router.get("/:filterType/:value", authenticateUser, getUserByUniqueQuery);
router.put("/update/:id", authenticateUser, updateUser);
router.delete("/delete/:userId", authenticateUser, deleteUser);
