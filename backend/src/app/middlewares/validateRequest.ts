import { ZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';

const validationRequest = (schema: ZodObject) => {
  return catchAsync(async (req, res, next) => {
    const parsed = (await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    })) as { body?: unknown };

    // Replace the body with the parsed output so unknown keys are stripped
    // and defaults are applied (prevents mass-assignment of fields such as `role`).
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    next();
  });
};
export default validationRequest;
