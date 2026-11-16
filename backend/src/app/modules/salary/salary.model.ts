import { model, Schema, Types } from 'mongoose';

// One salary payment per member per week (claimed inside the Monday window)
export type TSalaryClaim = {
    userId: Types.ObjectId;
    weekKey: string;       // Monday 'YYYY-MM-DD' (Bangladesh time)
    vipLevel: number;      // VIP level the salary was paid for
    amount: number;        // BDT credited to the balance wallet
    claimedAt: Date;
};

const salaryClaimSchema = new Schema<TSalaryClaim>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        weekKey: { type: String, required: true },
        vipLevel: { type: Number, required: true, min: 1 },
        amount: { type: Number, required: true, min: 0.01 },
        claimedAt: { type: Date, required: true },
    },
    { timestamps: false }
);

salaryClaimSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export const SalaryClaimModel = model<TSalaryClaim>('SalaryClaim', salaryClaimSchema);

// One record per week for the "claim window is open" email run. The unique weekKey makes
// the run happen once, even if the server restarts or several instances are running.
export type TSalaryCycle = {
    weekKey: string;
    startedAt: Date;
};

const salaryCycleSchema = new Schema<TSalaryCycle>(
    {
        weekKey: { type: String, required: true, unique: true },
        startedAt: { type: Date, required: true },
    },
    { timestamps: false }
);

export const SalaryCycleModel = model<TSalaryCycle>('SalaryCycle', salaryCycleSchema);
