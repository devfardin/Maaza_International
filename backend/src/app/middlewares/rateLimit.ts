import { NextFunction, Request, Response } from 'express';
import status from 'http-status';

// Minimal in-memory fixed-window rate limiter (per IP + route).
// For multi-instance deployments swap this for a Redis-backed limiter.
export const rateLimit = (opts: { windowMs: number; max: number; message?: string }) => {
    const hits = new Map<string, { count: number; resetAt: number }>();

    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }, opts.windowMs).unref();

    return (req: Request, res: Response, next: NextFunction) => {
        const key = `${req.ip}:${req.baseUrl}${req.path}`;
        const now = Date.now();
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + opts.windowMs });
            return next();
        }
        entry.count += 1;
        if (entry.count > opts.max) {
            res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(status.TOO_MANY_REQUESTS).json({
                success: false,
                message: opts.message ?? 'Too many requests, please try again later.',
                errorSources: [],
            });
        }
        next();
    };
};
