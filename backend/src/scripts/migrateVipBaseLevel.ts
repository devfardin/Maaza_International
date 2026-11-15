// One-time migration: membershipLevel becomes the VIP level, and every member starts at VIP 1.
// Before: membershipLevel 1 = normal member, n + 1 = VIP n.  After: membershipLevel n = VIP n.
// So every member above 1 moves down one level; members at 1 stay at 1 (VIP 1).
// Run once:  npm run migrate:vip-base
// It records a marker in the "migrations" collection and refuses to run twice.
import mongoose from 'mongoose';
import config from '../app/config';
import { UserModel } from '../app/modules/users/user.model';
import { VipLevelModel } from '../app/modules/vipLevels/vipLevel.model';

const MIGRATION_NAME = 'vip-base-level-v1';

const run = async () => {
  await mongoose.connect(config.database_url as string);
  const db = mongoose.connection.db!;
  const migrations = db.collection('migrations');

  if (await migrations.findOne({ name: MIGRATION_NAME })) {
    console.log('Migration already applied — nothing to do.');
    return;
  }

  const users = await UserModel.updateMany({ membershipLevel: { $gte: 2 } }, { $inc: { membershipLevel: -1 } });
  console.log(`Members moved down one level: ${users.modifiedCount}`);

  // VIP 1 is the base level: no referrals or spend required
  await VipLevelModel.updateOne({ level: 1 }, { qualifiedReferrals: 0, minSpent: 0 });

  await migrations.insertOne({ name: MIGRATION_NAME, appliedAt: new Date() });
  console.log('Migration applied.');
};

run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
