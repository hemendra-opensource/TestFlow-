import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestApp, VALID_TOKENS, TEST_USERS } from './helpers/testSetup.js';

describe('Workspaces Endpoints & Authorization', () => {
  let app;
  let env;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    env = setup.env;
  });

  describe('GET /api/v1/workspaces', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/workspaces');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return only workspaces the authenticated user belongs to', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('alice-workspace');
      expect(res.body.data[0].role).toBe('owner');
    });

    it('should return empty list for user with no workspace memberships', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('POST /api/v1/workspaces', () => {
    it('should reject unauthenticated workspace creation', async () => {
      const res = await request(app).post('/api/v1/workspaces').send({
        name: 'Design Team',
        slug: 'design-team',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid workspace payloads (short name, invalid slug format)', async () => {
      // Name too short
      let res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'A', slug: 'valid-slug' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Slug with capital letters or special characters
      res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'Valid Name', slug: 'Invalid_Slug!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Missing slug
      res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'Valid Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent unauthorized role escalation and reject extra fields', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`)
        .send({
          name: 'Bob Team',
          slug: 'bob-team',
          role: 'admin',
          created_by: TEST_USERS.alice.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    it('should atomically create workspace and owner membership on valid request', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`)
        .send({
          name: 'Bob Innovation Lab',
          slug: 'bob-innovation-lab',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Bob Innovation Lab');
      expect(res.body.data.slug).toBe('bob-innovation-lab');
      expect(res.body.data.created_by).toBe(TEST_USERS.bob.id);
      expect(res.body.data.role).toBe('owner');

      // Verify that Bob can now retrieve this workspace in his workspace list
      const listRes = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].slug).toBe('bob-innovation-lab');
    });

    it('should return 409 Conflict when workspace slug already exists', async () => {
      // Alice tries to create a workspace with already existing slug 'alice-workspace'
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          name: 'Duplicate Workspace',
          slug: 'alice-workspace',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });
  });
});
