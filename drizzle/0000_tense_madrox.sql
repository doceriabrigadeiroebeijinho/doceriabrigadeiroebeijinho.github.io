CREATE TABLE `customer_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`order_code` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`cpf` text NOT NULL,
	`birth_date` text,
	`event_date` text NOT NULL,
	`event_time` text NOT NULL,
	`service` text NOT NULL,
	`address` text,
	`items_json` text NOT NULL,
	`total_cents` integer NOT NULL,
	`payment_method` text NOT NULL,
	`plan_payment_mode` text,
	`plan_terms_accepted` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'site' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_orders_order_code_unique` ON `customer_orders` (`order_code`);