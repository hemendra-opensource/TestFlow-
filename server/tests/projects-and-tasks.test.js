import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestApp,
  VALID_TOKENS,
  TEST_USERS,
  WORKSPACE_IDS,
  PROJECT_IDS,
  TASK_IDS,
} from './helpers/testSetup.js';

describe('Phase 3: Projects, Tasks, Kanban & Real-time Integration', () => {
  let app;
  let env;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    env = setup.env;
  });

  describe('Projects API (/api/v1/workspaces/:workspaceId/projects & /api/v1/projects/:projectId)', () => {
    it('should reject unauthenticated request to list workspace projects', async () => {
      const res = await request(app).get(
        `/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`
      );
      expect(res.status).toBe(401);
    });

    it('should return 404 when user does not belong to the workspace (isolation)', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`)
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`); // Bob is not in Alice workspace

      expect(res.status).toBe(404);
    });

    it('should allow member (Carol) to list projects and see computed task progress', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const alpha = res.body.data.find((p) => p.id === PROJECT_IDS.aliceProject);
      expect(alpha).toBeTruthy();
      expect(alpha.name).toBe('Alpha Project');
      expect(alpha.total_tasks).toBe(1);
      expect(alpha.completed_tasks).toBe(0);
      expect(alpha.progress).toBe(0);
    });

    it('should prevent member-role user (Carol) from creating a project (admin+ only)', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`)
        .send({
          name: 'Unauthorized Project',
        });

      expect(res.status).toBe(403);
    });

    it('should reject project creation when start_date is after due_date', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          name: 'Invalid Date Project',
          start_date: '2026-12-31',
          due_date: '2026-01-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Validation error');
    });

    it('should allow owner (Alice) to create a new project with valid dates', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${WORKSPACE_IDS.alice}/projects`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          name: 'Beta Project',
          description: 'Next gen platform',
          status: 'active',
          start_date: '2026-06-01',
          due_date: '2026-12-31',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Beta Project');
      expect(res.body.data.workspace_id).toBe(WORKSPACE_IDS.alice);
      expect(res.body.data.total_tasks).toBe(0);
    });

    it('should allow owner to update project details and archive it', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${PROJECT_IDS.aliceProject}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          status: 'archived',
          description: 'Updated alpha description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
      expect(res.body.data.archived_at).toBeTruthy();
    });

    it('should allow owner to delete a project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${PROJECT_IDS.aliceProject}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Tasks API & Kanban Operations (/api/v1/projects/:projectId/tasks & /api/v1/tasks/:taskId)', () => {
    it('should allow workspace member (Carol) to list tasks in a project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${PROJECT_IDS.aliceProject}/tasks`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Setup Infrastructure');
      expect(res.body.data[0].assignee).toBeTruthy();
      expect(res.body.data[0].assignee.id).toBe(TEST_USERS.carol.id);
    });

    it('should reject task creation with empty title', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${PROJECT_IDS.aliceProject}/tasks`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          title: '   ',
        });

      expect(res.status).toBe(400);
    });

    it('should reject task assignment to a user who is NOT in the workspace', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${PROJECT_IDS.aliceProject}/tasks`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          title: 'Cross-tenant task',
          assignee_id: TEST_USERS.bob.id, // Bob is not a member of Alice workspace!
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('assignee must belong to the workspace');
    });

    it('should allow workspace member to create a task assigned to valid member (Carol)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${PROJECT_IDS.aliceProject}/tasks`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`)
        .send({
          title: 'Implement Authentication Tests',
          description: 'Write complete vitest suite',
          status: 'todo',
          priority: 'high',
          assignee_id: TEST_USERS.carol.id,
          due_date: '2026-07-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Implement Authentication Tests');
      expect(res.body.data.assignee.id).toBe(TEST_USERS.carol.id);
    });

    it('should update task status and position (Kanban drag-and-drop)', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${TASK_IDS.aliceTask}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.carol}`)
        .send({
          status: 'in_progress',
          position: 2500,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.position).toBe(2500);
    });

    it('should update project progress when task is marked done', async () => {
      // Mark task as done
      const taskRes = await request(app)
        .patch(`/api/v1/tasks/${TASK_IDS.aliceTask}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`)
        .send({
          status: 'done',
        });

      expect(taskRes.status).toBe(200);
      expect(taskRes.body.data.status).toBe('done');

      // Check project progress
      const projRes = await request(app)
        .get(`/api/v1/projects/${PROJECT_IDS.aliceProject}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(projRes.status).toBe(200);
      expect(projRes.body.data.completed_tasks).toBe(1);
      expect(projRes.body.data.progress).toBe(100);
    });

    it('should allow owner to delete a task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${TASK_IDS.aliceTask}`)
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Dashboard Analytics Integration (/api/v1/dashboard/stats)', () => {
    it('should return aggregated metrics for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${VALID_TOKENS.alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active_projects_count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total_tasks_count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.recent_projects)).toBe(true);
    });

    it('should isolate dashboard data so Bob sees 0 projects for his empty workspace', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${VALID_TOKENS.bob}`);

      expect(res.status).toBe(200);
      expect(res.body.data.active_projects_count).toBe(0);
      expect(res.body.data.total_tasks_count).toBe(0);
      expect(res.body.data.recent_projects.length).toBe(0);
    });
  });
});
