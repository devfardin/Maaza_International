import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import config from '../../config';
import { sendEmail } from '../../utils/sendEmail';
import { escapeHtml } from '../../utils/escapeHtml';
import { moneyIncrement, moneyText, roundMoney } from '../../utils/money';
import { UserModel } from '../users/user.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { ReferralServices } from '../referrals/referral.services';
import { MembershipServices } from '../users/membership.services';
import { VipLevelModel, ensureVipLevelDefaults } from '../vipLevels/vipLevel.model';
import { SalaryClaimModel, SalaryCycleModel } from './salary.model';
import { getSalaryWindow, TSalaryWindow } from './salary.time';
import { SALARY_CLAIM_END_HOUR, SALARY_CLAIM_START_HOUR } from '../../config/constants';

const CLAIM_HOURS_TEXT = `${formatHour(SALARY_CLAIM_START_HOUR)} – ${formatHour(SALARY_CLAIM_END_HOUR)}`;

function formatHour(hour: number) {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

// Eligible = the member's current VIP level has a weekly salary above 0 (set in the VIP ladder)
const getLadder = async () => {
    await ensureVipLevelDefaults();
    return VipLevelModel.find().sort({ level: 1 }).lean();
};

const getClaimForWeek = (userId: string, weekKey: string) =>
    SalaryClaimModel.findOne({ userId, weekKey }).lean();

// Everything the salary page needs for one member
const getStatus = async (userId: string) => {
    const user = await UserModel.findById(userId).select('membershipLevel referralCode').lean();
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found');

    const window: TSalaryWindow = getSalaryWindow();
    const ladder = await getLadder();
    const vipLevel = user.membershipLevel;
    const row = ladder.find((l) => l.level === vipLevel);
    const weeklySalary = row?.weeklySalary ?? 0;
    const eligible = weeklySalary > 0;

    const [claim, lastClaim, lastWindowClaim] = await Promise.all([
        getClaimForWeek(userId, window.weekKey),
        SalaryClaimModel.findOne({ userId }).sort({ claimedAt: -1 }).lean(),
        getClaimForWeek(userId, window.lastWeekKey),
    ]);

    // Not eligible → show the next VIP level that pays a salary and what it takes to reach it
    let referral = null;
    if (!eligible) {
        const nextPaying = ladder.find((l) => l.level > vipLevel && l.weeklySalary > 0) ?? null;
        const [validReferrals, totalSpent] = await Promise.all([
            ReferralServices.countValidReferrals(userId),
            MembershipServices.getTotalSpent(userId),
        ]);
        referral = {
            referralCode: user.referralCode,
            validReferrals,
            totalSpent,
            target: nextPaying
                ? {
                    vipLevel: nextPaying.level,
                    weeklySalary: nextPaying.weeklySalary,
                    qualifiedReferrals: nextPaying.qualifiedReferrals,
                    referralsLeft: Math.max(0, nextPaying.qualifiedReferrals - validReferrals),
                    minSpent: nextPaying.minSpent,
                    spentLeft: roundMoney(Math.max(0, nextPaying.minSpent - totalSpent)),
                }
                : null,
        };
    }

    return {
        window: {
            state: window.state,
            weekKey: window.weekKey,
            opensAt: window.opensAt,
            closesAt: window.closesAt,
            claimHours: CLAIM_HOURS_TEXT,
        },
        vipLevel,
        weeklySalary,
        eligible,
        claimedThisWeek: !!claim,
        claimedAmount: claim?.amount ?? 0,
        claimedAt: claim?.claimedAt ?? null,
        canClaim: eligible && window.state === 'open' && !claim,
        // Shown only to members who have claimed before, so brand-new members are not told about
        // windows that were before they were eligible. True = last window closed without a claim.
        missedLastWindow: eligible && !!lastClaim && !lastWindowClaim,
        lastWindow: { weekKey: window.lastWeekKey, closedAt: window.lastClosedAt },
        lastClaim: lastClaim ? { weekKey: lastClaim.weekKey, amount: lastClaim.amount, claimedAt: lastClaim.claimedAt } : null,
        schedule: ladder
            .filter((l) => l.weeklySalary > 0)
            .map((l) => ({ vipLevel: l.level, weeklySalary: l.weeklySalary, qualifiedReferrals: l.qualifiedReferrals, minSpent: l.minSpent })),
        referral,
    };
};

// Claim this week's salary. Credits the balance wallet, once per week, inside the window only.
const claimSalary = async (userId: string) => {
    const window = getSalaryWindow();
    if (window.state !== 'open') {
        throw new AppError(
            status.FORBIDDEN,
            `Salary can only be claimed on Monday between ${CLAIM_HOURS_TEXT} (Bangladesh time). The next window opens ${window.opensAt.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} (Bangladesh time).`
        );
    }

    const user = await UserModel.findById(userId).select('membershipLevel status isDeleted role').lean();
    if (!user || user.isDeleted || user.status !== 'active' || user.role !== 'user') {
        throw new AppError(status.FORBIDDEN, 'Your account is not eligible for salary');
    }

    const ladder = await getLadder();
    const row = ladder.find((l) => l.level === user.membershipLevel);
    const amount = roundMoney(row?.weeklySalary ?? 0);
    if (amount <= 0) {
        throw new AppError(status.FORBIDDEN, 'Your VIP level does not include a weekly salary');
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // unique (userId, weekKey) index: one claim per week, even under double clicks
        let claim;
        try {
            [claim] = await SalaryClaimModel.create(
                [{ userId, weekKey: window.weekKey, vipLevel: user.membershipLevel, amount, claimedAt: new Date() }],
                { session }
            );
        } catch (err) {
            if ((err as { code?: number })?.code === 11000) {
                throw new AppError(status.BAD_REQUEST, 'You have already claimed this week\'s salary');
            }
            throw err;
        }

        const wallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: 'balance', isActive: true },
            moneyIncrement('balance', amount),
            { new: true, session }
        );
        if (!wallet) throw new AppError(status.NOT_FOUND, 'Balance wallet not found');

        await TransactionServices.recordTransaction({
            userId: new Types.ObjectId(userId),
            type: 'salary',
            flow: 'credit',
            amount,
            walletAffected: 'balance',
            balanceAfter: wallet.balance,
            note: `Weekly salary (VIP ${user.membershipLevel}, week of ${window.weekKey})`,
            referenceId: claim._id as Types.ObjectId,
            session,
        });

        await session.commitTransaction();
        return { amount, vipLevel: user.membershipLevel, weekKey: window.weekKey, balanceAfter: wallet.balance };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

// Sends the "your salary is ready" email to every eligible member. Runs once per week
// (guarded by SalaryCycleModel) when the claim window opens. Returns how many were emailed.
const notifyEligibleMembers = async (weekKey: string): Promise<number> => {
    try {
        await SalaryCycleModel.create({ weekKey, startedAt: new Date() });
    } catch (err) {
        if ((err as { code?: number })?.code === 11000) return 0; // already sent this week
        throw err;
    }

    const ladder = await getLadder();
    const payingLevels = ladder.filter((l) => l.weeklySalary > 0);
    if (!payingLevels.length) return 0;

    const members = await UserModel.find({
        role: 'user',
        isDeleted: false,
        status: 'active',
        membershipLevel: { $in: payingLevels.map((l) => l.level) },
    })
        .select('fullName email membershipLevel')
        .lean();

    const claimUrl = `${config.frontend_url}/dashboard/salary`;
    let sent = 0;

    // small batches so a big member list does not open hundreds of SMTP connections at once
    const BATCH = 5;
    for (let i = 0; i < members.length; i += BATCH) {
        const batch = members.slice(i, i + BATCH);
        const results = await Promise.allSettled(
            batch.map((m) => {
                const level = payingLevels.find((l) => l.level === m.membershipLevel);
                const amount = level?.weeklySalary ?? 0;
                return sendEmail({
                    to: m.email,
                    subject: `Your weekly salary of ${moneyText(amount, 0)} is ready to claim`,
                    heading: 'Your weekly salary is ready',
                    subheading: `VIP ${m.membershipLevel} · ${moneyText(amount, 0)}`,
                    body: `
                        <p>Hi ${escapeHtml(m.fullName)},</p>
                        <p>Your VIP ${m.membershipLevel} weekly salary of <strong>${moneyText(amount, 0)}</strong> can be claimed today,
                        Monday, between <strong>${CLAIM_HOURS_TEXT}</strong> (Bangladesh time).</p>
                        <p>Open your dashboard and claim it before the window closes. If you do not claim it in this window,
                        this week's salary is not paid and you will need to wait for next Monday's salary.</p>`,
                    button: { label: 'Claim my salary', url: claimUrl },
                });
            })
        );
        sent += results.filter((r) => r.status === 'fulfilled').length;
        results.forEach((r) => {
            if (r.status === 'rejected') console.error('Salary email failed', r.reason);
        });
    }
    return sent;
};

export const SalaryServices = { getStatus, claimSalary, notifyEligibleMembers };
