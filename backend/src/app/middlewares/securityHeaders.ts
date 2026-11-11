import { NextFunction, Request, Response } from 'express';

// Small subset of helmet's defaults (helmet itself could not be installed)
const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
};
export default securityHeaders;
