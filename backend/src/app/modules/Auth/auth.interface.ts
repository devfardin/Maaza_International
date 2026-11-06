export type TLoginUser = {
    phone: string;
    password: string;
}
export interface TJwtPayload {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super-admin';
  isActive: boolean;
}