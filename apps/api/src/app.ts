import Fastify from 'fastify';

interface PositionBody {
  userId: string;
  lat: number;
  lon: number;
  scheduledArrival: string;
  actualArrival: string;
}

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' }));

  // Reçoit la position du téléphone pour détecter la gare côté serveur.
  app.post<{ Body: PositionBody }>('/trips/position', async (request) => {
    const { userId, lat, lon, scheduledArrival, actualArrival } = request.body;
    request.log.info({ userId, lat, lon }, 'position reçue');
    const delay = Math.round(
      (new Date(actualArrival).getTime() - new Date(scheduledArrival).getTime()) / 60_000,
    );
    return { counted: delay > 5 ? delay : 0 };
  });

  app.get('/leaderboard', async () => [
    { pseudo: 'escargot31', minutes: 412, from: 'Aubiet', to: 'Colomiers' },
  ]);

  return app;
}
