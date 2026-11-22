import { NextFunction, RequestHandler, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler =
    (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
        (req, res, next) => {
            fn(req, res, next).catch(next);
        };