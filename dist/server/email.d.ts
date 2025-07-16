import type { Inquiry, Property } from '../shared/schema';
interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
}
export declare const getEmailConfig: () => EmailConfig;
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
export {};
