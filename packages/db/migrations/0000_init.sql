CREATE TYPE "public"."auth_provider" AS ENUM('apple', 'google');--> statement-breakpoint
CREATE TYPE "public"."data_source" AS ENUM('SNCF_GTFS_RT', 'PRIM', 'NAVITIA', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."rarity" AS ENUM('common', 'rare', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."train_mode" AS ENUM('TER', 'INTERCITES', 'TGV', 'TRANSILIEN', 'RER');--> statement-breakpoint
CREATE TABLE "titles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"rarity" "rarity" NOT NULL,
	"rule" text NOT NULL,
	"season" text,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trip_id" text NOT NULL,
	"service_date" date NOT NULL,
	"mode" "train_mode" NOT NULL,
	"line_id" text NOT NULL,
	"departure_stop_id" text NOT NULL,
	"arrival_stop_id" text NOT NULL,
	"scheduled_arrival" timestamp with time zone NOT NULL,
	"actual_arrival" timestamp with time zone,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"source" "data_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_titles" (
	"user_id" uuid NOT NULL,
	"title_id" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trip_id" uuid,
	CONSTRAINT "user_titles_user_id_title_id_pk" PRIMARY KEY("user_id","title_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_subject" text NOT NULL,
	"pseudo" text NOT NULL,
	"avatar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_providerSubject_unique" UNIQUE("provider_subject"),
	CONSTRAINT "users_pseudo_unique" UNIQUE("pseudo")
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;