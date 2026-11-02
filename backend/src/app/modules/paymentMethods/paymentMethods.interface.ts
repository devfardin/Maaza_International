export type TPaymentMethods = {
    name: string;
    code: string;
    accountNumber: string;
    accountType: "Merchant" | "Personal" | "Agent";
    instructions: string;
    isActive: boolean;
}
