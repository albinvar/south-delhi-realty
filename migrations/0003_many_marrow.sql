ALTER TABLE `properties` RENAME COLUMN `portion` TO `property_portion`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;