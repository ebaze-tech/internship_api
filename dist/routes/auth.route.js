"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_config_1 = require("../controllers/auth.config");
exports.router = (0, express_1.Router)();
exports.router.post("/register", auth_config_1.register);
//# sourceMappingURL=auth.route.js.map