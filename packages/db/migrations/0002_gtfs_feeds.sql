CREATE TYPE "public"."gtfs_feed" AS ENUM('SNCF', 'IDFM');--> statement-breakpoint
DROP INDEX "gtfs_trips_service_id_index";--> statement-breakpoint
ALTER TABLE "gtfs_imports" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_routes" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_stop_times" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_stops" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_trips" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
CREATE INDEX "gtfs_imports_feed_checked_at_index" ON "gtfs_imports" USING btree ("feed","checked_at");--> statement-breakpoint
CREATE INDEX "gtfs_stop_times_feed_index" ON "gtfs_stop_times" USING btree ("feed");--> statement-breakpoint
CREATE INDEX "gtfs_stops_feed_index" ON "gtfs_stops" USING btree ("feed");--> statement-breakpoint
CREATE INDEX "gtfs_trips_feed_service_id_index" ON "gtfs_trips" USING btree ("feed","service_id");