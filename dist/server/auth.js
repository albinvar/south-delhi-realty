"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_local_1 = require("passport-local");
const crypto = __importStar(require("crypto"));
const storage_1 = require("./storage");
const router = express_1.default.Router();
async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`10000:${salt}:${derivedKey.toString('hex')}`);
        });
    });
}
async function comparePassword(plainPassword, hashedPassword) {
    return new Promise((resolve, reject) => {
        try {
            const [iterations, salt, storedHash] = hashedPassword.split(':');
            const iterCount = parseInt(iterations);
            crypto.pbkdf2(plainPassword, salt, iterCount, 64, 'sha512', (err, derivedKey) => {
                if (err)
                    reject(err);
                resolve(derivedKey.toString('hex') === storedHash);
            });
        }
        catch (err) {
            resolve(false);
        }
    });
}
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'username',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const user = await storage_1.storage.findUserByUsername(username);
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        const isValid = await comparePassword(password, user.password || '');
        if (!isValid) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        return done(null, userWithoutPassword);
    }
    catch (error) {
        return done(error);
    }
}));
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('Please add these variables to your .env file');
}
else {
    console.log('✅ Google OAuth environment variables verified');
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('📱 Processing Google OAuth callback for email:', profile.emails?.[0]?.value);
        const email = profile.emails?.[0]?.value;
        if (!email) {
            console.error('❌ No email provided in Google profile');
            return done(null, false, { message: 'No email provided in Google profile' });
        }
        let user = await storage_1.storage.findUserByGoogleId(profile.id);
        if (user) {
            console.log('✅ Existing Google user found:', user.email);
            if (!['superadmin', 'admin', 'staff'].includes(user.role)) {
                console.error('❌ User does not have required role:', user.role);
                return done(null, false, { message: 'Access denied. Only admin users can sign in.' });
            }
            const userWithoutPassword = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };
            return done(null, userWithoutPassword);
        }
        const emailUser = await storage_1.storage.findUserByEmail(email);
        if (emailUser) {
            if (!['superadmin', 'admin', 'staff'].includes(emailUser.role)) {
                console.error('❌ User exists but does not have required role:', emailUser.role);
                return done(null, false, { message: 'Access denied. Only admin users can sign in.' });
            }
            console.log('🔄 Linking Google account to existing email user:', emailUser.email);
            await storage_1.storage.linkGoogleAccount(emailUser.id, profile.id);
            const userWithoutPassword = {
                id: emailUser.id,
                username: emailUser.username,
                email: emailUser.email,
                role: emailUser.role
            };
            return done(null, userWithoutPassword);
        }
        console.error('❌ User does not exist in database:', email);
        return done(null, false, { message: 'Access denied. User not found in system. Please contact an administrator.' });
    }
    catch (error) {
        console.error('❌ Error in Google OAuth callback:', error);
        return done(error);
    }
}));
passport_1.default.serializeUser((user, done) => {
    console.log('🔄 Serializing user:', { id: user.id, username: user.username, role: user.role });
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        console.log('🔄 Deserializing user with ID:', id);
        const user = await storage_1.storage.findUserById(id);
        if (user) {
            const userWithoutPassword = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };
            console.log('✅ User deserialized successfully:', { id: user.id, username: user.username, role: user.role });
            return done(null, userWithoutPassword);
        }
        else {
            console.warn('⚠️  User not found during deserialization for ID:', id);
            return done(null, null);
        }
    }
    catch (error) {
        console.error('❌ Error during user deserialization:', error);
        return done(error);
    }
});
function ensureSuperAdmin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Not authorized. Only super admins can create new users." });
    }
    next();
}
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('🚨 Authentication error:', err);
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
            if (err.message.includes('Failed query') || err.name === 'DrizzleQueryError') {
                console.error('❌ Database query error during login');
                return res.status(500).json({
                    message: 'Database error. Please try again later.',
                    error: 'DATABASE_ERROR'
                });
            }
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
            console.log('✅ Login successful for user:', user.username);
            return res.json(user);
        });
    })(req, res, next);
});
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({ message: 'Logged out successfully' });
    });
});
router.get('/status', (req, res) => {
    console.log('🔍 Auth status check:', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
        sessionID: req.sessionID,
        session: req.session ? 'exists' : 'missing',
        passport: req.session?.passport
    });
    if (req.isAuthenticated()) {
        console.log('✅ User authenticated via status endpoint');
        res.json(req.user);
    }
    else {
        console.log('❌ User not authenticated via status endpoint');
        res.status(401).json({ message: 'Not authenticated' });
    }
});
router.get('/google', (req, res, next) => {
    console.log('📱 Starting Google OAuth flow');
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
    console.log('🔄 Google OAuth callback received', {
        query: req.query,
        code: req.query.code ? 'present' : 'missing'
    });
    passport_1.default.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: true,
        session: true
    }, (err, user, info) => {
        if (err) {
            console.error('❌ Google OAuth error:', err);
            if (err.code === 'ETIMEDOUT' || err.message.includes('ETIMEDOUT')) {
                console.error('❌ Database connection timeout during Google OAuth');
                return res.redirect('/auth?error=database_timeout');
            }
            if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
                console.error('❌ Database connection refused during Google OAuth');
                return res.redirect('/auth?error=database_connection_error');
            }
            if (err.name === 'InternalOAuthError' && err.oauthError?.code === 'ETIMEDOUT') {
                console.error('❌ OAuth provider timeout');
                return res.redirect('/auth?error=oauth_timeout');
            }
            return res.redirect('/auth?error=system_error');
        }
        if (!user) {
            console.error('❌ Google OAuth failed:', info);
            if (info && info.message) {
                if (info.message.includes('not found in system')) {
                    return res.redirect('/auth?error=user_not_found');
                }
                else if (info.message.includes('Only admin users')) {
                    return res.redirect('/auth?error=insufficient_role');
                }
            }
            return res.redirect('/auth?error=auth_failed');
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('❌ Login error:', loginErr);
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
exports.default = router;
