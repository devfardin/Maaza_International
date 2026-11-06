
import { ZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';
const validationRequest = (schema: ZodObject) => {
  return catchAsync(async (req, res, next) => {
    // validation
    await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });

    next();
  });
};
export default validationRequest;