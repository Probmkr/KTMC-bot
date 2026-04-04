CREATE TABLE "guild_moderation_settings" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"notice_role_id" text NOT NULL,
	"warning_role_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_warnings" (
	"user_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_warnings_user_id_guild_id_pk" PRIMARY KEY("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE "warning_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"moderator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
