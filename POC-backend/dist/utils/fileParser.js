"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParser = void 0;
const XLSX = __importStar(require("xlsx"));
const sync_1 = require("csv-parse/sync");
const errorHandler_1 = require("./errorHandler");
class FileParser {
    async parse(buffer, fileType) {
        try {
            switch (fileType.toLowerCase()) {
                case "application/json":
                    return this.parseJSON(buffer);
                case "text/csv":
                    return this.parseCSV(buffer);
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                case "application/vnd.ms-excel":
                    return this.parseExcel(buffer);
                default:
                    throw new errorHandler_1.APIError(400, `Unsupported file type: ${fileType}`);
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.APIError) {
                throw error;
            }
            throw new errorHandler_1.APIError(500, "Failed to parse file");
        }
    }
    parseJSON(buffer) {
        try {
            const content = buffer.toString("utf-8");
            const data = JSON.parse(content);
            if (!Array.isArray(data)) {
                throw new errorHandler_1.APIError(400, "JSON file must contain an array of records");
            }
            return data;
        }
        catch (error) {
            throw new errorHandler_1.APIError(400, "Invalid JSON format");
        }
    }
    parseCSV(buffer) {
        try {
            const content = buffer.toString("utf-8");
            const records = (0, sync_1.parse)(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
            return records;
        }
        catch (error) {
            throw new errorHandler_1.APIError(400, "Invalid CSV format");
        }
    }
    parseExcel(buffer) {
        try {
            const workbook = XLSX.read(buffer);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        }
        catch (error) {
            throw new errorHandler_1.APIError(400, "Invalid Excel format");
        }
    }
    validateSchema(data, requiredFields) {
        if (!Array.isArray(data)) {
            throw new errorHandler_1.APIError(400, "Data must be an array of records");
        }
        if (data.length === 0) {
            throw new errorHandler_1.APIError(400, "File contains no records");
        }
        const missingFields = data.reduce((errors, record, index) => {
            const recordErrors = requiredFields.filter((field) => !record[field]);
            if (recordErrors.length > 0) {
                errors.push(`Record ${index + 1} is missing required fields: ${recordErrors.join(", ")}`);
            }
            return errors;
        }, []);
        if (missingFields.length > 0) {
            throw new errorHandler_1.APIError(400, `Validation errors: ${missingFields.join("; ")}`);
        }
    }
    cleanData(data) {
        return data.map((record) => {
            const cleanRecord = {};
            for (const [key, value] of Object.entries(record)) {
                // Clean key: trim and convert to camelCase
                const cleanKey = this.toCamelCase(key.trim());
                // Clean value: trim strings, convert empty strings to null
                let cleanValue = value;
                if (typeof value === "string") {
                    cleanValue = value.trim();
                    if (cleanValue === "") {
                        cleanValue = null;
                    }
                }
                cleanRecord[cleanKey] = cleanValue;
            }
            return cleanRecord;
        });
    }
    toCamelCase(str) {
        return str
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    }
}
exports.FileParser = FileParser;
//# sourceMappingURL=fileParser.js.map