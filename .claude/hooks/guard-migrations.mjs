// PreToolUse Edit|Write : les migrations sont générées par drizzle-kit, jamais écrites à la main.
const input = JSON.parse(await new Response(process.stdin).text());
const file = input.tool_input?.file_path ?? '';
if (file.includes('packages/db/migrations/')) {
  console.error(
    'Migrations générées uniquement : modifie packages/db/src/schema.ts puis lance `pnpm --filter @escargo/db db:generate --name <nom>`.',
  );
  process.exit(2);
}
