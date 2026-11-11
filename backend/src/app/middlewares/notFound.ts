import { Request, Response } from 'express';
import status from 'http-status';

// Must be registered AFTER all routes and BEFORE the global error handler
const notFound = (req: Request, res: Response) => {
    res.status(status.NOT_FOUND).json({
        success: false,
        message: `API not found: ${req.method} ${req.originalUrl}`,
        errorSources: [],
    });
};
export default notFound;
