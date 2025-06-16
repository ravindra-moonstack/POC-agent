export declare class FileParser {
    parse(buffer: Buffer, fileType: string): Promise<any[]>;
    private parseJSON;
    private parseCSV;
    private parseExcel;
    validateSchema(data: any[], requiredFields: string[]): void;
    cleanData(data: any[]): any[];
    private toCamelCase;
}
