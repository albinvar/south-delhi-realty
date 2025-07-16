import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
// Replace bcrypt with crypto for a pure JavaScript solution
import * as crypto from 'crypto';
import { storage } from './storage';

// Rate limiting removed - no maximum authentication attempts

// Define a simple user interface for authentication
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const router = express.Router();

// JavaScript implementation of password hashing using crypto
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Use PBKDF2 for hashing (more widely available than bcrypt)
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      // Format: iterations:salt:hash
      resolve(`10000:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Extract parts from stored hash
      const [iterations, salt, storedHash] = hashedPassword.split(':');
      const iterCount = parseInt(iterations);
      
      // Hash the input password with the same salt and iterations
      crypto.pbkdf2(plainPassword, salt, iterCount, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        // Compare the computed hash with the stored hash
        resolve(derivedKey.toString('hex') === storedHash);
      });
    } catch (err) {
      // If the stored hash isn't in the expected format, comparison fails
      resolve(false);
    }
  });
}

// Set up local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username: string, password: string, done: any) => {
      try {
        // Find user by username
        const user = await storage.findUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        // Verify password using the custom comparePassword function instead of bcrypt
        const isValid = await comparePassword(password, user.password || '');
        if (!isValid) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        // Return user without password
        const userWithoutPassword: AuthUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };

        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Verify required Google OAuth environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please add these variables to your .env file');
} else {
  console.log('✅ Google OAuth environment variables verified');
}

// Set up Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('📱 Processing Google OAuth callback for email:', profile.emails?.[0]?.value);
        
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('❌ No email provided in Google profile');
          return done(null, false, { message: 'No email provided in Google profile' });
        }

        // Check if user already exists with this Google ID
        let user = await storage.findUserByGoogleId(profile.id);
        
        if (user) {
          console.log('✅ Existing Google user found:', user.email);
          // Verify user has appropriate role
          if (!['superadmin', 'admin', 'staff'].includes(user.role)) {
            console.error('❌ User does not have required role:', user.role);
            return done(null, false, { message: 'Access denied. Only admin users can sign in.' });
          }
          
          const userWithoutPassword: AuthUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          };
          return done(null, userWithoutPassword);
        }

        // Check if user exists with this email
        const emailUser = await storage.findUserByEmail(email);
        if (emailUser) {
          // Verify user has appropriate role
          if (!['superadmin', 'admin', 'staff'].includes(emailUser.role)) {
            console.error('❌ User exists but does not have required role:', emailUser.role);
            return done(null, false, { message: 'Access denied. Only admin users can sign in.' });
          }
          
          console.log('🔄 Linking Google account to existing email user:', emailUser.email);
          await storage.linkGoogleAccount(emailUser.id, profile.id);
          const userWithoutPassword: AuthUser = {
            id: emailUser.id,
            username: emailUser.username,
            email: emailUser.email,
            role: emailUser.role
          };
          return done(null, userWithoutPassword);
        }

        // User does not exist - deny access instead of creating new user
        console.error('❌ User does not exist in database:', email);
        return done(null, false, { message: 'Access denied. User not found in system. Please contact an administrator.' });
        
      } catch (error) {
        console.error('❌ Error in Google OAuth callback:', error);
        return done(error);
      }
    }
  )
);

// Passport session setup with enhanced logging
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  console.log('🔄 Serializing user:', { id: user.id, username: user.username, role: user.role });
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
  try {
    console.log('🔄 Deserializing user with ID:', id);
    const user = await storage.findUserById(id);
    if (user) {
      const userWithoutPassword: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      console.log('✅ User deserialized successfully:', { id: user.id, username: user.username, role: user.role });
      return done(null, userWithoutPassword);
    } else {
      console.warn('⚠️  User not found during deserialization for ID:', id);
      return done(null, null);
    }
  } catch (error) {
    console.error('❌ Error during user deserialization:', error);
    return done(error);
  }
});

// Check if user is authenticated and has super admin role
function ensureSuperAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Not authorized. Only super admins can create new users." });
  }
  
  next();
}

// Login route with enhanced error handling
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('🚨 Authentication error:', err);
      
      // Check if it's a database connection issue
      if (err.code === 'ETIMEDOUT' || err.message.includes('ETIMEDOUT')) {
        console.error('❌ Database connection timeout during login');
        return res.status(500).json({ 
          message: 'Database connection timeout. Please try again in a few moments.',
          error: 'DATABASE_TIMEOUT'
        });
      }
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
        console.error('❌ Database connection refused during login');
        return res.status(500).json({ 
          message: 'Database connection error. Please try again later.',
          error: 'DATABASE_CONNECTION_ERROR'
        });
      }
      
      // Generic database error
      if (err.message.includes('Failed query') || err.name === 'DrizzleQueryError') {
        console.error('❌ Database query error during login');
        return res.status(500).json({ 
          message: 'Database error. Please try again later.',
          error: 'DATABASE_ERROR'
        });
      }
      
      // Generic error
      return res.status(500).json({ 
        message: 'An unexpected error occurred. Please try again.',
        error: 'AUTHENTICATION_ERROR'
      });
    }
    
    if (!user) {
      console.warn('⚠️  Login failed - invalid credentials:', info);
      return res.status(401).json(info);
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('🚨 Session creation error:', err);
        return res.status(500).json({ 
          message: 'Failed to create session. Please try again.',
          error: 'SESSION_ERROR'
        });
      }
      
      // Manually save the session to ensure it's persisted
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('🚨 Session save error:', saveErr);
          return res.status(500).json({ 
            message: 'Failed to save session. Please try again.',
            error: 'SESSION_SAVE_ERROR'
          });
        }
        
        console.log('✅ Login successful for user:', user.username);
        console.log('✅ Session saved successfully:', {
          sessionID: req.sessionID,
          passport: (req.session as any).passport,
          cookie: req.session.cookie
        });
        
        return res.json(user);
      });
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check if user is authenticated with enhanced debugging
router.get('/status', (req, res) => {
  console.log('🔍 Auth status check:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? { id: (req.user as any).id, username: (req.user as any).username, role: (req.user as any).role } : null,
    sessionID: req.sessionID,
    session: req.session ? 'exists' : 'missing',
    passport: (req.session as any)?.passport
  });
  
  if (req.isAuthenticated()) {
    console.log('✅ User authenticated via status endpoint');
    res.json(req.user);
  } else {
    console.log('❌ User not authenticated via status endpoint');
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Google OAuth routes without rate limiting
router.get('/google', (req, res, next) => {
  console.log('📱 Starting Google OAuth flow');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('🔄 Google OAuth callback received', {
    query: req.query,
    code: req.query.code ? 'present' : 'missing'
  });

  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true,
    session: true
  }, (err, user, info) => {
    if (err) {
      console.error('❌ Google OAuth error:', err);
      
      // Handle specific database connection errors
      if (err.code === 'ETIMEDOUT' || err.message.includes('ETIMEDOUT')) {
        console.error('❌ Database connection timeout during Google OAuth');
        return res.redirect('/auth?error=database_timeout');
      }
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
        console.error('❌ Database connection refused during Google OAuth');
        return res.redirect('/auth?error=database_connection_error');
      }
      
      // Handle OAuth-specific errors
      if (err.name === 'InternalOAuthError' && err.oauthError?.code === 'ETIMEDOUT') {
        console.error('❌ OAuth provider timeout');
        return res.redirect('/auth?error=oauth_timeout');
      }
      
      return res.redirect('/auth?error=system_error');
    }

    if (!user) {
      console.error('❌ Google OAuth failed:', info);
      // Handle specific error messages
      if (info && info.message) {
        if (info.message.includes('not found in system')) {
          return res.redirect('/auth?error=user_not_found');
        } else if (info.message.includes('Only admin users')) {
          return res.redirect('/auth?error=insufficient_role');
        }
      }
      return res.redirect('/auth?error=auth_failed');
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('❌ Login error:', loginErr);
        
        // Handle session creation errors
        if (loginErr.code === 'ETIMEDOUT' || loginErr.message.includes('ETIMEDOUT')) {
          return res.redirect('/auth?error=session_timeout');
        }
        
        return res.redirect('/auth?error=session_error');
      }

      console.log('✅ Google OAuth successful for user:', user.email);
      res.redirect('/admin');
    });
  })(req, res, next);
});

// Debug endpoint to check session state
router.get('/debug-session', (req, res) => {
  const sessionInfo = {
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    sessionData: req.session,
    passport: (req.session as any)?.passport,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    sessionStoreType: typeof (req.session as any).store
  };
  
  console.log('🔍 Session Debug Info:', sessionInfo);
  
  res.json({
    message: 'Session debug information',
    data: sessionInfo
  });
});

export default router;
