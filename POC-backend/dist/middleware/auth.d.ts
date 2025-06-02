import { Request, Response, NextFunction } from "express";
interface AuthRequest extends Request {
    user?: any;
}
export declare const authenticateJWT: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
