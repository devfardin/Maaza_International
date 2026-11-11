// Creates the first super_admin. Run once:
//   SUPER_ADMIN_PHONE=01700000000 SUPER_ADMIN_EMAIL=admin@example.com \
//   SUPER_ADMIN_PASSWORD='a-strong-password' npm run seed:admin
import mongoose from 'mongoose';
import config from '../app/config';
import { UserModel } from '../app/modules/users/user.model';

const run = async () => {
  const phone = process.env.SUPER_ADMIN_PHONE;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!phone || !email || !password || password.length < 8) {
    throw new Error('Set SUPER_ADMIN_PHONE, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (min 8 chars)');
  }

  await mongoose.connect(config.database_url as string);

  if (await UserModel.exists({ role: 'super_admin' })) {
    console.log('A super_admin already exists — nothing to do.');
    return;
  }

  await UserModel.create({
    fullName: 'Super Admin',
    email,
    phone,
    passwordHash: password, // hashed by the model's pre-save hook
    referralCode: `SA${Date.now().toString().slice(-6)}`,
    role: 'super_admin',
    status: 'active',
    membershipLevel: 1,
  });
  console.log('super_admin created:', phone);
};

run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
