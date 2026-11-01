import { NextFunction, Request, Response } from "express";
import status from "http-status";

const notFound = (error: any, req: Request, res: Response, next: NextFunction) =>{

    return res.status(status.NOT_FOUND).json({
        success: false,
        // write a good message
        message: "API Not Found",
        error: '',
    })
};
export default notFound;