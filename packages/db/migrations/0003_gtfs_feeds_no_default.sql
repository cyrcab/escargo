ALTER TABLE "gtfs_imports" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_routes" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_service_dates" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_stop_times" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_stops" ALTER COLUMN "feed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gtfs_trips" ALTER COLUMN "feed" DROP DEFAULT;