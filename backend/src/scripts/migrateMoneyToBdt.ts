// One-time migration: every stored money amount changes from poisha to BDT (divide by 100).
// Before: 12000 (= 120.00 BDT).  After: 120.
// Task rewards were already stored in BDT and are not touched.
// Run once:  npm run migrate:money-bdt
// It records a marker in the "migrations" collection and refuses to run twice.
import mongoose from 'mongoose';
import config from '../app/config';
import { WalletModel } from '../app/modules/wallets/wallet.model';
import { TransactionModel } from '../app/modules/transactions/transaction.model';
import { DepositRequestModel } from '../app/modules/depositRequests/depositRequests.model';
import { WithdrawalModel } from '../app/modules/withdrawals/withdrawal.model';
import { ProductModel } from '../app/modules/products/product.model';
import { ProductPurchaseModel } from '../app/modules/productPurchages/productPurchases.model';
import { DailyClaimModel } from '../app/modules/productPurchages/dailyClaim.model';
import { DailyCheckinModel } from '../app/modules/dailyCheckins/dailyCheckin.model';
import { VipLevelModel } from '../app/modules/vipLevels/vipLevel.model';
import { NotificationModel } from '../app/modules/notifications/notification.model';

const MIGRATION_NAME = 'money-bdt-v1';

// divide a top-level or dotted field by 100 (null stays null)
const divide = (field: string) => ({ [field]: { $divide: [`$${field}`, 100] } });

const run = async () => {
  await mongoose.connect(config.database_url as string);
  const migrations = mongoose.connection.db!.collection('migrations');

  if (await migrations.findOne({ name: MIGRATION_NAME })) {
    console.log('Migration already applied — nothing to do.');
    return;
  }

  const jobs: [string, any, string[]][] = [
    ['wallets', WalletModel, ['balance']],
    ['transactions', TransactionModel, ['amount', 'balanceAfter']],
    ['depositrequests', DepositRequestModel, ['amount']],
    ['withdrawals', WithdrawalModel, ['amount', 'fee', 'netAmount']],
    ['products', ProductModel, ['price', 'rewardPlan.dailyIncome', 'rewardPlan.totalEstimatedRevenue', 'bonuses.invitationBonus', 'bonuses.upgradeBonus']],
    ['productpurchases', ProductPurchaseModel, ['purchasePrice', 'dailyIncome', 'totalRevenue', 'receivedAmount']],
    ['dailyclaims', DailyClaimModel, ['incomeAmount']],
    ['dailycheckins', DailyCheckinModel, ['amount']],
    ['viplevels', VipLevelModel, ['minSpent', 'dailyCheckinBonus']],
    ['notifications', NotificationModel, ['amount']],
  ];

  for (const [name, model, fields] of jobs) {
    const set = Object.assign({}, ...fields.map(divide));
    const result = await model.collection.updateMany({}, [{ $set: set }]);
    console.log(`${name}: ${result.modifiedCount} document(s) converted`);
  }

  // referral commission snapshots on purchases: an array of { commissionAmount }
  const purchases = await ProductPurchaseModel.collection.updateMany({ 'referralCommissions.0': { $exists: true } }, [
    {
      $set: {
        referralCommissions: {
          $map: {
            input: '$referralCommissions',
            as: 'r',
            in: { $mergeObjects: ['$$r', { commissionAmount: { $divide: ['$$r.commissionAmount', 100] } }] },
          },
        },
      },
    },
  ]);
  console.log(`referral commission snapshots: ${purchases.modifiedCount} purchase(s) converted`);

  await migrations.insertOne({ name: MIGRATION_NAME, appliedAt: new Date() });
  console.log('Migration applied.');
};

run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
