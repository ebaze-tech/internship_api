import { Request, Response } from "express";
interface ReqResProps {
    req: Request;
    res: Response;
}
export declare const register: ({ req, res }: ReqResProps) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
