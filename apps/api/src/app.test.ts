import { expect, it } from 'vitest';
import { buildApp } from './app';

it('GET /health répond ok', async () => {
  const response = await buildApp().inject({ method: 'GET', url: '/health' });
  expect(response.json()).toEqual({ status: 'ok' });
});
