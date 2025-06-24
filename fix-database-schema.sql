-- Fix Database Schema for nearby_facilities table
-- This script adds missing columns that are causing 500 errors

-- Use the correct database
USE defaultdb;

-- Show current table structure
DESCRIBE nearby_facilities;

-- Add missing columns if they don't exist
-- Note: MySQL will ignore ALTER TABLE if column already exists (with IF NOT EXISTS in newer versions)

-- Add distance_value column (numeric distance in meters)
ALTER TABLE nearby_facilities 
ADD COLUMN IF NOT EXISTS distance_value INT NULL 
AFTER distance;

-- Add latitude column (facility coordinates)
ALTER TABLE nearby_facilities 
ADD COLUMN IF NOT EXISTS latitude TEXT NULL 
AFTER facility_type;

-- Add longitude column (facility coordinates)
ALTER TABLE nearby_facilities 
ADD COLUMN IF NOT EXISTS longitude TEXT NULL 
AFTER latitude;

-- Add created_at timestamp column
ALTER TABLE nearby_facilities 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP 
AFTER longitude;

-- Add updated_at timestamp column
ALTER TABLE nearby_facilities 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER created_at;

-- Verify the final table structure
DESCRIBE nearby_facilities;

-- Show success message
SELECT 'Database schema migration completed successfully!' AS status; 