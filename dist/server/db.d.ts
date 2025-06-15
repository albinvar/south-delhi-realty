import * as mysql from "mysql2/promise";
import * as schema from "../shared/schema";
export declare const db: import("drizzle-orm/mysql2").MySql2Database<typeof schema> & {
    $client: mysql.Pool;
};
export declare function initializeDB(): Promise<void>;
