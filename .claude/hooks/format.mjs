// PostToolUse Edit|Write : formate le fichier modifié avec Biome.
import { execFileSync } from 'node:child_process';

const input = JSON.parse(await new Response(process.stdin).text());
const file = input.tool_input?.file_path;
if (file && /\.(ts|tsx|js|mjs|json)$/.test(file)) {
  try {
    execFileSync('pnpm', ['exec', 'biome', 'check', '--write', '--no-errors-on-unmatched', file], {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: 'ignore',
    });
  } catch {
    // Erreurs de lint restantes : signalées par le typecheck / la CI, pas bloquantes ici.
  }
}
