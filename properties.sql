-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 15, 2025 at 03:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `southdelhirealestate`
--

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(10) NOT NULL,
  `category` varchar(20) NOT NULL,
  `property_type` varchar(30) NOT NULL,
  `sub_type` varchar(10) DEFAULT NULL,
  `property_portion` varchar(10) DEFAULT NULL,
  `area` int(11) NOT NULL,
  `area_unit` varchar(10) NOT NULL,
  `furnished_status` varchar(20) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `balconies` int(11) DEFAULT NULL,
  `facing` varchar(20) DEFAULT NULL,
  `parking` varchar(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `price_negotiable` tinyint(1) DEFAULT 0,
  `brokerage` varchar(255) DEFAULT NULL,
  `contact_details` text NOT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `title`, `slug`, `description`, `status`, `category`, `property_type`, `sub_type`, `property_portion`, `area`, `area_unit`, `furnished_status`, `bedrooms`, `bathrooms`, `balconies`, `facing`, `parking`, `age`, `price`, `price_negotiable`, `brokerage`, `contact_details`, `latitude`, `longitude`, `is_active`, `created_at`, `updated_at`) VALUES
(14, 'avsfdvd', 'avsfdvd', 'bfedrbref gregverfgverge gre gergergergegrergergrgreg', 'sale', 'residential', 'apartment', '2bhk', NULL, 123, 'sq-ft', 'furnished', 2, 2, 2, 'south', NULL, 2, 2147483647, 1, NULL, '', '28.535407368783215', '77.21019744873048', 1, '2025-06-11 12:31:49', '2025-06-11 12:31:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_properties_is_active` (`is_active`),
  ADD KEY `idx_properties_status` (`status`),
  ADD KEY `idx_properties_category` (`category`),
  ADD KEY `idx_properties_property_type` (`property_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
