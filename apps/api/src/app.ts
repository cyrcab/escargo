import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({
    logger: {
      // Méthode et chemin seulement : ni IP, ni query string, ni en-têtes (jetons).
      serializers: {
        req: (req) => ({ method: req.method, path: req.url.split('?')[0] }),
      },
    },
  });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
