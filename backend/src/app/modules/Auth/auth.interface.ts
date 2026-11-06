export type TLoginUser = {
    phone: string;
    password: string;
}
export interface TJwtPayload {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'blocked';
}