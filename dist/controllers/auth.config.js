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
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_config_1 = require("../config/db.config");
const express_validator_1 = require("express-validator");
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid request body" });
    }
    const requestBody = req.body;
    if (!requestBody ||
        !requestBody.age ||
        !requestBody.email ||
        !requestBody.username ||
        !requestBody.password) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const client = yield db_config_1.pool.connect();
    try {
        yield client.query("BEGIN");
        const existingUser = yield client.query(`SELECT * FROM users WHERE email = $1`, [requestBody.email]);
        if (existingUser.rows.length > 0) {
            yield client.query("ROLLBACK");
            return res.status(400).json({ message: "Email already in use" });
        }
        const hashPassword = yield bcryptjs_1.default.hash(requestBody.password, 12);
        requestBody.userId = (0, uuid_1.v4)();
        const createUserQuery = yield client.query(`
            INSERT INTO users (username, email, password, age, id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email, age
            `, [
            requestBody.username,
            requestBody.email,
            hashPassword,
            requestBody.age,
            requestBody.userId,
        ]);
        yield client.query("COMMIT");
        const createdUser = createUserQuery.rows[0];
        if (createdUser) {
            return res.status(201).json({
                message: "User registered successfully",
                user: createdUser,
            });
        }
        else {
            return res.status(500).json({ message: "Server error" });
        }
    }
    catch (error) {
        yield client.query("ROLLBACK");
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
    finally {
        client.release();
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validator = (0, express_validator_1.validationResult)(req);
    if (!validator.isEmpty()) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const requestBody = req.body;
    if (!requestBody || !requestBody.password || !requestBody.username) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    try {
        const existingUserQuery = yield db_config_1.pool.query(`
        SELECT * FROM users WHERE username = $1`, [requestBody.username]);
        const existingUser = existingUserQuery.rows[0];
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(requestBody.password, existingUser.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            password: existingUser.password,
            age: existingUser.age,
        }, JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) { }
});
exports.login = login;
//# sourceMappingURL=auth.config.js.map