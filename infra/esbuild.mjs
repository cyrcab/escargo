// Bundle de prod d'une app (api, worker) : node apps/<app> $ node ../../infra/esbuild.mjs <entrées…>
// Les paquets @escargo/* sont en TypeScript source : ils entrent dans le bundle.
// Les dépendances npm restent dans node_modules (installées sans les devDependencies).
import { build } from 'esbuild';

const entryPoints = process.argv.slice(2);
if (entryPoints.length === 0) throw new Error('Usage : node infra/esbuild.mjs <entrées…>');

await build({
  entryPoints,
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  logLevel: 'info',
  plugins: [
    {
      name: 'external-npm',
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, ({ path }) =>
          path.startsWith('@escargo/') ? undefined : { path, external: true },
        );
      },
    },
  ],
});
