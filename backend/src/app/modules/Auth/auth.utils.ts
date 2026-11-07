import jwt, { SignOptions } from 'jsonwebtoken';

// create jwt token
export const createToken = ( JwtPayload: object, secret: string, expiresIn: string) => {
   return jwt.sign(JwtPayload, secret, { expiresIn } as SignOptions);
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
export const buildJwtPayload = (user: { _id: { toString(): string }; fullName: string; email: string; phone: string; role: string; status: string }) => ({
    userId: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
});