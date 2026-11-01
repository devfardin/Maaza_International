export type TCategoryStatus = "active" | "inactive";

export type TCategory = {
    // Basic information
    name: string;
    description?: string;

    // Category image
    image?: string;

    // Display settings
    isFeatured: boolean;
    sortOrder: number;

    // Status
    status: TCategoryStatus;
    isDeleted: boolean;

    // Statistics
    productCount: number;
};
