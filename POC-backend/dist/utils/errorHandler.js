"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.APIError = void 0;
const zod_1 = require("zod");
const winston_1 = __importDefault(require("winston"));
// Custom error class for API errors
class APIError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "APIError";
    }
}
exports.APIError = APIError;
const logger = winston_1.default.createLogger({
    level: "error",
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: "error.log", level: "error" }),
    ],
});
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    if (err instanceof APIError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                code: err.code,
            },
        });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: {
                message: "Validation error",
                details: err.errors,
            },
        });
    }
    // Default error
    return res.status(500).json({
        error: {
            message: "Internal server error",
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map