interface AuthUser {
    id: number;
    username: string;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface User extends AuthUser {
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
export default router;
