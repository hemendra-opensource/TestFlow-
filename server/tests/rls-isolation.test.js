import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestApp, VALID_TOKENS, TEST_USERS } from './helpers/testSetup.js';

describe('RLS & Multi-Tenant Data Isolation', () => {
  let app;
  let env;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    env = setup.env;
  });

  it('should isolate workspaces between different users', async () => {
    // Alice has 1 workspace initially
    const aliceRes = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

    expect(aliceRes.status).toBe(200);
    expect(aliceRes.body.data.length).toBe(1);
    expect(aliceRes.body.data[0].slug).toBe('alice-workspace');

    // Bob has 0 workspaces initially
    const bobResBefore = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

    expect(bobResBefore.status).toBe(200);
    expect(bobResBefore.body.data.length).toBe(0);

    // Bob creates his own workspace
    const createRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${VALID_TOKENS.bob}`)
      .send({
        name: 'Bob Secret Project',
        slug: 'bob-secret-project',
      });

    expect(createRes.status).toBe(201);

    // Now Alice still only sees her own workspace, NOT Bob's workspace
    const aliceResAfter = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

    expect(aliceResAfter.status).toBe(200);
    expect(aliceResAfter.body.data.length).toBe(1);
    expect(aliceResAfter.body.data.some((ws) => ws.slug === 'bob-secret-project')).toBe(false);

    // Bob only sees his own workspace, NOT Alice's workspace
    const bobResAfter = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

    expect(bobResAfter.status).toBe(200);
    expect(bobResAfter.body.data.length).toBe(1);
    expect(bobResAfter.body.data[0].slug).toBe('bob-secret-project');
    expect(bobResAfter.body.data.some((ws) => ws.slug === 'alice-workspace')).toBe(false);
  });

  it('should isolate profile access to authenticated user identity', async () => {
    // Alice gets Alice's profile
    const aliceProfile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

    expect(aliceProfile.status).toBe(200);
    expect(aliceProfile.body.data.id).toBe(TEST_USERS.alice.id);
    expect(aliceProfile.body.data.full_name).toBe('Alice Cooper');

    // Bob gets Bob's profile
    const bobProfile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

    expect(bobProfile.status).toBe(200);
    expect(bobProfile.body.data.id).toBe(TEST_USERS.bob.id);
    expect(bobProfile.body.data.full_name).toBe('Bob Marley');
  });
});
