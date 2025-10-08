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
exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const db_config_1 = require("../config/db.config");
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const register = (_a) => __awaiter(void 0, [_a], void 0, function* ({ req, res }) {
    const requestBody = req.body;
    if (!requestBody || !requestBody.age || !requestBody.email || !requestBody.username || !requestBody.password) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const client = yield db_config_1.pool.connect();
    try {
        const existingUser = yield client.query(`SELECT * FROM users WHERE email = $1`, [requestBody.email]);
        if (existingUser.rows.length > 0) {
            yield client.query("ROLLBACK");
            return res.status(400).json({ message: "Email already in yse" });
            const hashPassword = yield bcryptjs_1.default.hash(requestBody.password, 12);
            requestBody.userId = (0, uuid_1.v4)();
            const createUserQuery = yield client.query(`INSERT INTO users (username, email, password, id) VALUES ($1, $2, $3, $4) RETURNING id, username, email`, [requestBody.username, requestBody.email, hashPassword, requestBody.userId]);
            yield client.query("COMMIT");
            if (createUserQuery.rows[0]) {
                return res.status(201).json({
                    message: "User registered successfully",
                    user: { createUserQuery }
                });
            }
            else {
                return res.status(500).json({ message: "Server error" });
            }
        }
    }
    catch (error) {
    }
});
exports.register = register;
//# sourceMappingURL=auth.config.js.map