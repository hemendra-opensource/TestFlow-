import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestApp, VALID_TOKENS, TEST_USERS, WORKSPACE_IDS } from './helpers/testSetup.js';

describe('Phase 2: Workspace Detail, Members & Authorization', () => {
  let app;
  let env;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    env = setup.env;

    // Seed Bob's workspace and membership for Phase 2 cross-workspace isolation tests
    env.db.workspaces.push({
      id: WORKSPACE_IDS.bob,
      name: "Bob's Workspace",
      slug: 'bob-workspace',
      description: null,
      created_by: TEST_USERS.bob.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    env.db.workspace_members.push({
      id: 'bbbbbb00-0000-4000-b000-000000000001',
      workspace_id: WORKSPACE_IDS.bob,
      user_id: TEST_USERS.bob.id,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/v1/workspaces/:workspaceId
  // ──────────────────────────────────────────────
  describe('GET /api/v1/workspaces/:workspaceId', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for malformed workspace ID (not UUID format)', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces/not-a-uuid-!!!')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if user is not a member of the workspace (cross-workspace isolation)', async () => {
      // Bob is NOT a member of Alice's workspace
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return workspace details for an authenticated owner', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(WORKSPACE_IDS.alice);
      expect(res.body.data.slug).toBe('alice-workspace');
      expect(res.body.data.name).toBe("Alice's Workspace");
      expect(res.body.data.role).toBe('owner');
    });

    it('should return workspace details for a member-role user (Carol)', async () => {
      // Carol is a member of Alice's workspace
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('member');
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/v1/workspaces/:workspaceId/members
  // ──────────────────────────────────────────────
  describe('GET /api/v1/workspaces/:workspaceId/members', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/members`);
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-member trying to list members (cross-workspace isolation)', async () => {
      // Bob is NOT a member of Alice's workspace
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/members`)
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return member list for the workspace owner', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/members`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const aliceMember = res.body.data.find((m) => m.user_id === TEST_USERS.alice.id);
      expect(aliceMember).toBeDefined();
      expect(aliceMember.role).toBe('owner');
    });

    it('should include all members visible to Carol (member-role user)', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/members`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`);

      expect(res.status).toBe(200);
      // Alice (owner) + Carol (member) = 2 members in seed data
      expect(res.body.data.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/v1/workspaces/:workspaceId
  // ──────────────────────────────────────────────
  describe('PATCH /api/v1/workspaces/:workspaceId', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it('should return 404 if non-member tries to update workspace (cross-workspace isolation)', async () => {
      // Bob is not a member of Alice's workspace
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`)
        .send({ name: 'Hijacked Name' });
      expect(res.status).toBe(404);
    });

    it('should return 403 if member-role user tries to update workspace', async () => {
      // Carol is a plain member (role level below admin)
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`)
        .send({ name: 'Carol Tried This' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for empty update payload', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid update payload (extra forbidden fields)', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'Valid', role: 'admin' });
      expect(res.status).toBe(400);
    });

    it('should successfully update workspace name and description as owner', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'Updated Workspace Name', description: 'New description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Workspace Name');
      expect(res.body.data.description).toBe('New description');
    });

    it('should reject slug change from non-owner (admin) — service-level enforcement', async () => {
      // Promote Carol to admin for this test
      const carolMembership = env.db.workspace_members.find(
        (m) => m.workspace_id === WORKSPACE_IDS.alice && m.user_id === TEST_USERS.carol.id
      );
      if (carolMembership) carolMembership.role = 'admin';

      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`)
        .send({ slug: 'new-slug-attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow slug change by the owner', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ slug: 'alice-workspace-v2' });

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('alice-workspace-v2');
    });

    it('should return 409 on duplicate slug conflict', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.alice}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ slug: 'bob-workspace' }); // Bob's slug — conflict

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Cross-workspace data isolation (Phase 2 req 12)
  // ──────────────────────────────────────────────
  describe('Cross-workspace data isolation', () => {
    it('Bob cannot see members of Alice workspace', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/members`)
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);
      expect(res.status).toBe(404);
    });

    it('Alice cannot modify Bob workspace settings', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${WORKSPACE_IDS.bob}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({ name: 'Alice Hijack' });
      expect(res.status).toBe(404);
    });

    it('Carol cannot access Bob workspace (she is not a member)', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.bob}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`);
      expect(res.status).toBe(404);
    });
  });
});
