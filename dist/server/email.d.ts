import type { Inquiry, Property } from '../shared/schema';
export declare const sendInquiryNotification: (inquiry: Inquiry, property?: Property) => Promise<void>;
export declare const testEmailConfiguration: () => Promise<{
    success: boolean;
    message: string;
}>;
export declare const sendTestEmail: () => Promise<{
    success: boolean;
    message: string;
}>;
export declare const sendUserConfirmationEmail: (inquiry: Inquiry, property?: Property) => Promise<void>;
