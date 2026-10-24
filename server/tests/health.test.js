import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health Check Endpoint', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('teamflow-api');
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('GET /api/v1/unknown-route should return 404 with error payload', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Route not found/);
  });
});
