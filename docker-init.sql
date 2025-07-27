-- South Delhi Real Estate - Database Initialization Script
-- This script runs automatically when the MySQL container starts

USE southdel_main;

-- Create the properties table
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    property_type ENUM('apartment', 'villa', 'plot', 'commercial') NOT NULL,
    bedrooms INT,
    bathrooms INT,
    area_sqft INT,
    amenities JSON,
    images JSON,
    status ENUM('active', 'sold', 'inactive') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    distance_value INT DEFAULT 0,
    distance_text VARCHAR(255) DEFAULT '',
    distance_duration VARCHAR(255) DEFAULT ''
);

-- Create the admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create the inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    status ENUM('new', 'contacted', 'qualified', 'closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- Create the sessions table for database session storage
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    KEY expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample properties
INSERT INTO properties (title, description, price, location, property_type, bedrooms, bathrooms, area_sqft, amenities, images, featured, latitude, longitude, address, distance_value, distance_text, distance_duration) VALUES 
('Luxury Villa in Greater Kailash', 'Beautiful 4BHK villa with modern amenities and prime location', 50000000, 'Greater Kailash I, New Delhi', 'villa', 4, 4, 3500, '["Swimming Pool", "Garden", "Parking", "Security"]', '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"]', true, 28.5494, 77.2437, 'M Block, Greater Kailash I, New Delhi, Delhi 110048', 5, '5 km', '15 mins'),

('Modern Apartment in Saket', 'Spacious 3BHK apartment with all modern facilities', 25000000, 'Saket, New Delhi', 'apartment', 3, 2, 1800, '["Gym", "Lift", "Parking", "Power Backup"]', '["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800"]', false, 28.5245, 77.2066, 'Saket, New Delhi, Delhi 110017', 8, '8 km', '25 mins'),

('Commercial Plot in Lajpat Nagar', 'Prime commercial plot perfect for business ventures', 75000000, 'Lajpat Nagar, New Delhi', 'commercial', 0, 0, 2000, '["Corner Plot", "Main Road Facing", "High Footfall Area"]', '["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800"]', true, 28.5706, 77.2431, 'Lajpat Nagar IV, New Delhi, Delhi 110024', 3, '3 km', '10 mins');

-- Create default super admin (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admins (email, password_hash, role, full_name, is_active) VALUES 
('admin@southdelhirealty.com', '$2b$10$rOvHJQxQYb0CQvQlXwQqK.Lq.O5Zm9Zx8GZxMqZQi9UJ8VZW5Rj8W', 'super_admin', 'South Delhi Realty Admin', true);

-- Create indexes for better performance
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at);

COMMIT;
