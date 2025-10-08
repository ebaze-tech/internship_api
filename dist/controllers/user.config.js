"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUsers = void 0;
const express_validator_1 = require("express-validator");
const db_config_1 = __importDefault(require("../config/db.config"));
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!id) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    try {
        yield db_config_1.default.query("BEGIN");
        const existingUser = yield db_config_1.default.query(`
    SELECT username, email, age FROM users WHERE id = $1
    `, [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const getUsersQuery = yield db_config_1.default.query(`
        SELECT id, username, email, age FROM users`);
        if (getUsersQuery.rows.length === 0) {
            return res.status(404).json({ message: "No users available" });
        }
        else {
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error " });
    }
});
exports.getUsers = getUsers;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const requestBody = req.body;
    if (!id) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!Object.keys(requestBody).length) {
        return res.status(400).json({ message: "No fields provided to update" });
    }
    try {
        const existingUser = yield db_config_1.default.query(`SELECT id FROM users WHERE id = $1`, [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const duplicateConditions = [];
        const duplicateValues = [];
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
            const duplicates = yield db_config_1.default.query(duplicateQuery, duplicateValues);
            if (duplicates.rows.length > 0) {
                const duplicateFields = duplicates.rows
                    .map((u) => {
                    const conflicts = [];
                    if (requestBody.username && u.username === requestBody.username)
                        conflicts.push("username");
                    if (requestBody.email && u.email === requestBody.email)
                        conflicts.push("email");
                    return conflicts.join(" & ");
                })
                    .filter(Boolean)
                    .join(", ");
                return res.status(400).json({
                    message: `${duplicateFields.charAt(0).toUpperCase() + duplicateFields.slice(1)} already in use`,
                });
            }
        }
        const fields = [];
        const values = [];
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
        const result = yield db_config_1.default.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            message: "User updated successfully",
            user: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateUser = updateUser;
//# sourceMappingURL=user.config.js.map