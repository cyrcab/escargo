// Stop : typecheck des paquets modifiés avant de rendre la main. Bloque (exit 2) si erreur.
import { execSync } from 'node:child_process';

const input = JSON.parse(await new Response(process.stdin).text());
if (input.stop_hook_active) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR;
const changed = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
if (!/\.(ts|tsx)$/m.test(changed)) process.exit(0);

try {
  execSync('pnpm turbo run typecheck --affected --output-logs=errors-only', {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, CI: 'true' },
  });
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    .split('\n')
    .filter((l) => /error/i.test(l));
  console.error(
    `Typecheck en échec, corrige avant de terminer :\n${output.slice(0, 30).join('\n')}`,
  );
  process.exit(2);
}
