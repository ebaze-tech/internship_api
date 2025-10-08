"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_config_1 = require("../controllers/user.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.router = (0, express_1.Router)();
exports.router.get("/all", auth_middleware_1.authenticateUser, user_config_1.getUsers);
exports.router.put("/update/:id", auth_middleware_1.authenticateUser, user_config_1.updateUser);
// routere
//# sourceMappingURL=user.route.js.map