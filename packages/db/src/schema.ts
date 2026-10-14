import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const authProvider = pgEnum('auth_provider', ['apple', 'google']);
export const rarity = pgEnum('rarity', ['common', 'rare', 'legendary']);
export const trainMode = pgEnum('train_mode', ['TER', 'INTERCITES', 'TGV', 'TRANSILIEN', 'RER']);
export const dataSource = pgEnum('data_source', ['SNCF_GTFS_RT', 'PRIM', 'NAVITIA', 'MANUAL']);
export const gtfsFeed = pgEnum('gtfs_feed', ['SNCF', 'IDFM']);

// Données stockées : pseudo, identifiant Apple/Google, trajets. Rien d'autre.
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  provider: authProvider().notNull(),
  providerSubject: text().notNull().unique(),
  pseudo: text().notNull().unique(),
  avatar: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable('trips', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tripId: text().notNull(),
  serviceDate: date().notNull(),
  mode: trainMode().notNull(),
  lineId: text().notNull(),
  departureStopId: text().notNull(),
  arrivalStopId: text().notNull(),
  scheduledArrival: timestamp({ withTimezone: true }).notNull(),
  actualArrival: timestamp({ withTimezone: true }),
  delayMinutes: integer().notNull().default(0),
  cancelled: boolean().notNull().default(false),
  verified: boolean().notNull().default(false),
  source: dataSource().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Catalogue côté backend : ajout de titres sans mise à jour de l'appli.
export const titles = pgTable('titles', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
  rarity: rarity().notNull(),
  rule: text().notNull(),
  season: text(),
  publishedAt: timestamp({ withTimezone: true }),
});

export const userTitles = pgTable(
  'user_titles',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    titleId: text()
      .notNull()
      .references(() => titles.id),
    unlockedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    tripId: uuid().references(() => trips.id, { onDelete: 'set null' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.titleId] })],
);

// Horaires théoriques (GTFS) : données publiques, une source par flux (`feed`),
// remplacée en bloc à chaque import de ce flux.
// Pas de clés étrangères : l'import vide puis recharge un flux dans une transaction.
// Les trip_id et stop_id ne se chevauchent pas entre flux (`IDFM:…` d'un côté) ;
// les route_id et service_id, si : ils sont clés avec le flux.
export const gtfsStops = pgTable(
  'gtfs_stops',
  {
    id: text().primaryKey(),
    feed: gtfsFeed().notNull(),
    name: text().notNull(),
    lat: doublePrecision().notNull(),
    lon: doublePrecision().notNull(),
    parentId: text(),
    isStation: boolean().notNull(),
  },
  (t) => [index().on(t.parentId), index().on(t.feed)],
);

export const gtfsRoutes = pgTable(
  'gtfs_routes',
  {
    feed: gtfsFeed().notNull(),
    id: text().notNull(),
    shortName: text().notNull(),
    longName: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.feed, t.id] })],
);

export const gtfsTrips = pgTable(
  'gtfs_trips',
  {
    id: text().primaryKey(),
    feed: gtfsFeed().notNull(),
    routeId: text().notNull(),
    serviceId: text().notNull(),
    trainNumber: text(),
    headsign: text(),
    mode: trainMode().notNull(),
  },
  (t) => [index().on(t.feed, t.serviceId), index().on(t.trainNumber)],
);

// Heures en secondes depuis minuit du jour de service (peuvent dépasser 24 h).
export const gtfsStopTimes = pgTable(
  'gtfs_stop_times',
  {
    feed: gtfsFeed().notNull(),
    tripId: text().notNull(),
    stopSequence: integer().notNull(),
    stopId: text().notNull(),
    arrivalSeconds: integer().notNull(),
    departureSeconds: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tripId, t.stopSequence] }),
    index().on(t.stopId, t.departureSeconds),
    index().on(t.feed),
  ],
);

export const gtfsServiceDates = pgTable(
  'gtfs_service_dates',
  {
    feed: gtfsFeed().notNull(),
    serviceId: text().notNull(),
    date: date().notNull(),
  },
  (t) => [primaryKey({ columns: [t.feed, t.serviceId, t.date] }), index().on(t.date)],
);

export const gtfsImports = pgTable(
  'gtfs_imports',
  {
    id: uuid().primaryKey().defaultRandom(),
    feed: gtfsFeed().notNull(),
    source: text().notNull(),
    feedHash: text().notNull(),
    feedVersion: text(),
    stops: integer().notNull(),
    trips: integer().notNull(),
    stopTimes: integer().notNull(),
    importedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    checkedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.feed, t.checkedAt)],
);
