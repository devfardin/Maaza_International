export type TRewardType = "cash" | "points";

export type TTask = {
    title: string;
    description: string;
    image: string;
    rewardAmount: number;
    rewardType: TRewardType;
    instructions: string;
    specialNote?: string;
    isDeleted: boolean;
    startsAt: Date;
    endsAt: Date;
};
