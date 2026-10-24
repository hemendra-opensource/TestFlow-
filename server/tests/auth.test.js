import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestApp, VALID_TOKENS, TEST_USERS } from './helpers/testSetup.js';

describe('Authentication & Profile Endpoints', () => {
  let app;
  let env;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    env = setup.env;
  });

  describe('GET /api/v1/auth/me', () => {
    it('should reject request when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/missing or malformed/i);
    });

    it('should reject request when token is malformed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic 123456');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with an invalid or expired access token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer expired-or-fraudulent-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid or expired/i);
    });

    it('should return safe authenticated profile when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(TEST_USERS.alice.id);
      expect(res.body.data.email).toBe(TEST_USERS.alice.email);
      expect(res.body.data.full_name).toBe('Alice Cooper');
      expect(res.body.data.avatar_url).toBe('https://example.com/alice.png');
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('secret');
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    it('should successfully update full_name and avatar_url for authenticated user', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          full_name: 'Alice C. Updated',
          avatar_url: 'https://example.com/alice-new.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.full_name).toBe('Alice C. Updated');
      expect(res.body.data.avatar_url).toBe('https://example.com/alice-new.png');
    });

    it('should reject profile update with invalid URL format', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          avatar_url: 'not-a-valid-url',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/validation error/i);
    });

    it('should reject profile update containing unauthorized fields (strict mode)', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          full_name: 'Alice Cooper',
          role: 'admin',
          is_admin: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });
});
