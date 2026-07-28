CREATE TABLE `pokemon_catches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`species_id` integer NOT NULL,
	`caught_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cycle_id`) REFERENCES `pomodoro_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pokemon_catches_user_id_idx` ON `pokemon_catches` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pokemon_catches_cycle_id_idx` ON `pokemon_catches` (`cycle_id`);