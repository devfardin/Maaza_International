export type TPaymentAccountType = "Merchant" | "Personal" | "Agent";

export type TPaymentMethods = {
    name: string;
    code: string;
    image: string;            // Cloudinary URL
    description: string;      // rich text (HTML) from the admin editor
    accountNumber: string;
    accountType: TPaymentAccountType;
    instructions: string;     // rich text (HTML) from the admin editor
    isActive: boolean;
}
