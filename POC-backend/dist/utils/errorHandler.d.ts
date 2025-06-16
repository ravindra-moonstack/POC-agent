import { Request, Response, NextFunction } from "express";
export declare class APIError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
