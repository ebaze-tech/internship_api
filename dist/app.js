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
exports.startServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_config_1 = require("./config/db.config");
const auth_route_1 = require("./routes/auth.route");
exports.app = (0, express_1.default)();
const PORT = process.env.PORT;
const allowedOrigins = process.env.CLIENT_URL;
exports.app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
exports.app.use(express_1.default.json());
exports.app.use("/auth", auth_route_1.router);
exports.app.get("/", (req, res) => {
    res.send("Server is running");
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_config_1.pool.connect();
        console.log("Connected to DB");
        exports.app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        process.exit(1);
    }
});
exports.startServer = startServer;
(0, exports.startServer)();
//# sourceMappingURL=app.js.map