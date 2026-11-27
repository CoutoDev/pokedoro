ALTER TABLE `pomodoro_cycles` ADD `outcome` text DEFAULT 'COMPLETED' NOT NULL;--> statement-breakpoint
ALTER TABLE `pomodoro_cycles` ADD `elapsed_seconds` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `pomodoro_cycles` SET `elapsed_seconds` = CASE `phase` WHEN 'FOCUS' THEN `focus_duration` WHEN 'SHORT_BREAK' THEN `short_break_duration` ELSE `long_break_duration` END;
