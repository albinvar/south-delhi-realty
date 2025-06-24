-- Add missing distance_value column to nearby_facilities table
-- This column should store numeric distance values in meters for calculations

ALTER TABLE `nearby_facilities` ADD COLUMN `distance_value` int; 