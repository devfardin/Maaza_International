import { moneySchema } from '../../utils/money';
import { z } from 'zod';

const vipLevelItem = z.object({
    level: z.number().int().min(1).max(8),
    qualifiedReferrals: z.number({ message: 'Qualified referrals must be a number' }).int('Must be a whole number').nonnegative('Cannot be negative'),
    minSpent: moneySchema('Minimum spent must be a number').nonnegative('Cannot be negative'),
    dailyCheckinBonus: moneySchema('Daily bonus must be a number').nonnegative('Cannot be negative'),
    weeklySalary: moneySchema('Weekly salary must be a number').nonnegative('Cannot be negative'),
});

const updateVipLevelsValidation = z.object({
    body: z.object({
        levels: z.array(vipLevelItem).length(8, 'Exactly 8 VIP levels are required'),
    }),
});

export const VipLevelValidations = { updateVipLevelsValidation };
