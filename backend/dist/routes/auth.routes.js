"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = express_1.default.Router();
router.post('/register', (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.register), auth_controller_1.register);
router.post('/login', (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.login), auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getCurrentUser);
exports.default = router;
