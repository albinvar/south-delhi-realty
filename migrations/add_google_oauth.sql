-- Add Google OAuth fields to users table
ALTER TABLE users 
ADD COLUMN google_id TEXT,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Make password nullable since Google users won't have passwords
ALTER TABLE users MODIFY COLUMN password TEXT NULL;

-- Add index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email); 