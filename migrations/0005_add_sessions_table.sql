-- Create sessions table for database session storage
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) PRIMARY KEY,
  `expires` int(11) NOT NULL,
  `data` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sessions_expires (expires)
);
