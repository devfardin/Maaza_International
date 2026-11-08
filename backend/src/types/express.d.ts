import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        userId: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        status: string;
      };
    }
  }
}
