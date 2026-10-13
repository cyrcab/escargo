CREATE TABLE "gtfs_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"feed_hash" text NOT NULL,
	"feed_version" text,
	"stops" integer NOT NULL,
	"trips" integer NOT NULL,
	"stop_times" integer NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gtfs_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"short_name" text NOT NULL,
	"long_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gtfs_service_dates" (
	"service_id" text NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "gtfs_service_dates_service_id_date_pk" PRIMARY KEY("service_id","date")
);
--> statement-breakpoint
CREATE TABLE "gtfs_stop_times" (
	"trip_id" text NOT NULL,
	"stop_sequence" integer NOT NULL,
	"stop_id" text NOT NULL,
	"arrival_seconds" integer NOT NULL,
	"departure_seconds" integer NOT NULL,
	CONSTRAINT "gtfs_stop_times_trip_id_stop_sequence_pk" PRIMARY KEY("trip_id","stop_sequence")
);
--> statement-breakpoint
CREATE TABLE "gtfs_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"parent_id" text,
	"is_station" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gtfs_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"service_id" text NOT NULL,
	"train_number" text,
	"headsign" text,
	"mode" "train_mode" NOT NULL
);
--> statement-breakpoint
CREATE INDEX "gtfs_service_dates_date_index" ON "gtfs_service_dates" USING btree ("date");--> statement-breakpoint
CREATE INDEX "gtfs_stop_times_stop_id_departure_seconds_index" ON "gtfs_stop_times" USING btree ("stop_id","departure_seconds");--> statement-breakpoint
CREATE INDEX "gtfs_stops_parent_id_index" ON "gtfs_stops" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "gtfs_trips_service_id_index" ON "gtfs_trips" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "gtfs_trips_train_number_index" ON "gtfs_trips" USING btree ("train_number");