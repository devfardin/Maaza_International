import { z } from 'zod';
import { moneySchema } from '../../utils/money';

// Codes are stored upper-case: letters, numbers and dashes, 4 to 32 characters.
// An empty code means "generate one for me".
const codeText = z
    .string()
    .trim()
    .max(32, 'Code is too long')
    .transform((v) => v.toUpperCase())
    .refine((v) => v === '' || /^[A-Z0-9-]{4,32}$/.test(v), 'Code must be 4 to 32 letters, numbers or dashes');

// Calendar day as YYYY-MM-DD (Bangladesh time, like the rest of the app). Must be a real date.
const dayText = (message: string) =>
    z
        .string({ message })
        .trim()
        .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, message);

// Today in Bangladesh, as YYYY-MM-DD
const todayBD = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const createRedeemCodeValidation = z.object({
    body: z
        .object({
        code: codeText.optional().default(''),
        startDate: dayText('Start date is required'),
        endDate: dayText('End date is required'),
        amount: moneySchema('Bonus amount must be a number')
            .min(1, 'Bonus amount must be at least ৳1'),
        prizeCount: z
            .number({ message: 'Number of prizes must be a number' })
            .int('Number of prizes must be a whole number')
            .min(1, 'There must be at least 1 prize')
            .max(100000, 'Number of prizes is too large'),
        allowedVipLevels: z
            .array(z.number().int().min(1, 'VIP level must be 1 to 8').max(8, 'VIP level must be 1 to 8'))
            .min(1, 'Choose at least one VIP level')
            .max(8)
            .transform((levels) => [...new Set(levels)].sort((a, b) => a - b)),
    })
        .refine((b) => b.startDate <= b.endDate, { message: 'End date cannot be before the start date', path: ['endDate'] })
        .refine((b) => b.endDate >= todayBD(), { message: 'End date cannot be in the past', path: ['endDate'] }),
});

const setRedeemCodeStatusValidation = z.object({
    body: z.object({
        isActive: z.boolean({ message: 'Status must be on or off' }),
    }),
});

// Members type the code they were given; the server does the matching
const claimRedeemCodeValidation = z.object({
    body: z.object({
        code: z.string({ message: 'Enter a redeem code' }).trim().min(1, 'Enter a redeem code').max(64, 'Code is too long'),
    }),
});

export const RedeemCodeValidations = {
    createRedeemCodeValidation,
    setRedeemCodeStatusValidation,
    claimRedeemCodeValidation,
};
