import * as XLSX from "xlsx";
import { parse as csvParse } from "csv-parse/sync";
import { APIError } from "./errorHandler";

export class FileParser {
  async parse(buffer: Buffer, fileType: string): Promise<any[]> {
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
          throw new APIError(400, `Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, "Failed to parse file");
    }
  }

  private parseJSON(buffer: Buffer): any[] {
    try {
      const content = buffer.toString("utf-8");
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new APIError(400, "JSON file must contain an array of records");
      }

      return data;
    } catch (error) {
      throw new APIError(400, "Invalid JSON format");
    }
  }

  private parseCSV(buffer: Buffer): any[] {
    try {
      const content = buffer.toString("utf-8");
      const records = csvParse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records;
    } catch (error) {
      throw new APIError(400, "Invalid CSV format");
    }
  }

  private parseExcel(buffer: Buffer): any[] {
    try {
      const workbook = XLSX.read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      throw new APIError(400, "Invalid Excel format");
    }
  }

  validateSchema(data: any[], requiredFields: string[]): void {
    if (!Array.isArray(data)) {
      throw new APIError(400, "Data must be an array of records");
    }

    if (data.length === 0) {
      throw new APIError(400, "File contains no records");
    }

    const missingFields = data.reduce((errors: string[], record, index) => {
      const recordErrors = requiredFields.filter((field) => !record[field]);
      if (recordErrors.length > 0) {
        errors.push(
          `Record ${index + 1} is missing required fields: ${recordErrors.join(
            ", "
          )}`
        );
      }
      return errors;
    }, []);

    if (missingFields.length > 0) {
      throw new APIError(400, `Validation errors: ${missingFields.join("; ")}`);
    }
  }

  cleanData(data: any[]): any[] {
    return data.map((record) => {
      const cleanRecord: Record<string, any> = {};

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

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}
