"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.put('/profile', (0, validation_middleware_1.validate)(validation_middleware_1.userSchemas.updateProfile), user_controller_1.updateProfile);
router.get('/all', (0, auth_middleware_1.authorize)('admin'), user_controller_1.getAllUsers);
exports.default = router;
