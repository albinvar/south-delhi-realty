import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { db } from './db';
import { mysqlTable, varchar, text, timestamp, int } from 'drizzle-orm/mysql-core';

// Create sessions table schema
export const sessions = mysqlTable("sessions", {
  sessionId: varchar("session_id", { length: 128 }).primaryKey(),
  expires: int("expires").notNull(),
  data: text("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Database session store implementation
class DatabaseSessionStore extends session.Store {
  async get(sessionId: string, callback: (err?: any, session?: session.SessionData | null) => void) {
    try {
      const result = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
      
      if (result.length === 0) {
        return callback(null, null);
      }

      const sessionData = result[0];
      const now = Math.floor(Date.now() / 1000);

      // Check if session has expired
      if (sessionData.expires && sessionData.expires < now) {
        await this.destroy(sessionId, () => {});
        return callback(null, null);
      }

      const data = sessionData.data ? JSON.parse(sessionData.data) : {};
      callback(null, data);
    } catch (error) {
      console.error('Session get error:', error);
      callback(error);
    }
  }

  async set(sessionId: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const expires = sessionData.cookie?.expires 
        ? Math.floor(sessionData.cookie.expires.getTime() / 1000)
        : Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours default

      const data = JSON.stringify(sessionData);

      // Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL
      await db.execute(sql`
        INSERT INTO sessions (session_id, expires, data, created_at, updated_at) 
        VALUES (${sessionId}, ${expires}, ${data}, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        expires = VALUES(expires), 
        data = VALUES(data), 
        updated_at = NOW()
      `);

      callback?.();
    } catch (error) {
      console.error('Session set error:', error);
      callback?.(error);
    }
  }

  async destroy(sessionId: string, callback?: (err?: any) => void) {
    try {
      await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
      callback?.();
    } catch (error) {
      console.error('Session destroy error:', error);
      callback?.(error);
    }
  }

  async clear(callback?: (err?: any) => void) {
    try {
      await db.delete(sessions);
      callback?.();
    } catch (error) {
      console.error('Session clear error:', error);
      callback?.(error);
    }
  }

  async length(callback: (err: any, length?: number) => void) {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(sessions);
      callback(null, result[0]?.count || 0);
    } catch (error) {
      console.error('Session length error:', error);
      callback(error);
    }
  }

  async all(callback: (err: any, obj?: session.SessionData[] | { [sid: string]: session.SessionData } | null) => void) {
    try {
      const result = await db.select().from(sessions);
      const sessionsData: { [sid: string]: session.SessionData } = {};
      
      for (const row of result) {
        if (row.data) {
          try {
            sessionsData[row.sessionId] = JSON.parse(row.data);
          } catch (parseError) {
            console.error(`Failed to parse session data for ${row.sessionId}:`, parseError);
          }
        }
      }
      
      callback(null, sessionsData);
    } catch (error) {
      console.error('Session all error:', error);
      callback(error);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const result = await db.delete(sessions).where(lt(sessions.expires, now));
      console.log(`Cleaned up expired sessions`);
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

// Import required functions
import { eq, lt, sql } from 'drizzle-orm';

export { DatabaseSessionStore };
