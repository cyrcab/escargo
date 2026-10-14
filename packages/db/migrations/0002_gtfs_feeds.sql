CREATE TYPE "public"."gtfs_feed" AS ENUM('SNCF', 'IDFM');--> statement-breakpoint
-- Les données déjà importées viennent toutes du GTFS SNCF.
ALTER TABLE "gtfs_imports" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_routes" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_stop_times" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_stops" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_trips" ADD COLUMN "feed" "gtfs_feed" DEFAULT 'SNCF' NOT NULL;--> statement-breakpoint
ALTER TABLE "gtfs_imports" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_routes" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_stop_times" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_stops" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_trips" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_routes" DROP CONSTRAINT "gtfs_routes_pkey";--> statement-breakpoint
ALTER TABLE "gtfs_routes" ADD CONSTRAINT "gtfs_routes_feed_id_pk" PRIMARY KEY("feed","id");--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" DROP CONSTRAINT "gtfs_service_dates_service_id_date_pk";--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" ADD CONSTRAINT "gtfs_service_dates_feed_service_id_date_pk" PRIMARY KEY("feed","service_id","date");--> statement-breakpoint
DROP INDEX "gtfs_trips_service_id_index";--> statement-breakpoint
CREATE INDEX "gtfs_imports_feed_checked_at_index" ON "gtfs_imports" USING btree ("feed","checked_at");--> statement-breakpoint
CREATE INDEX "gtfs_stop_times_feed_index" ON "gtfs_stop_times" USING btree ("feed");--> statement-breakpoint
CREATE INDEX "gtfs_stops_feed_index" ON "gtfs_stops" USING btree ("feed");--> statement-breakpoint
CREATE INDEX "gtfs_trips_feed_service_id_index" ON "gtfs_trips" USING btree ("feed","service_id");
