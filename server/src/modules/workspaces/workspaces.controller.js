import { workspacesService } from './workspaces.service.js';
import { successResponse } from '../../utils/response.js';

export const workspacesController = {
  getWorkspaces: async (req, res, next) => {
    try {
      const workspaces = await workspacesService.getUserWorkspaces(req.user.id, req.scopedSupabase);
      return successResponse(res, workspaces, 200);
    } catch (err) {
      next(err);
    }
  },

  createWorkspace: async (req, res, next) => {
    try {
      const { name, slug, description } = req.body;
      const newWorkspace = await workspacesService.createWorkspace(
        name,
        slug,
        description,
        req.user,
        req.scopedSupabase
      );
      return successResponse(res, newWorkspace, 201, 'Workspace created successfully');
    } catch (err) {
      next(err);
    }
  },

  getWorkspaceById: async (req, res, next) => {
    try {
      const workspace = await workspacesService.getWorkspaceById(
        req.params.workspaceId,
        req.user.id,
        req.scopedSupabase
      );
      return successResponse(res, workspace, 200);
    } catch (err) {
      next(err);
    }
  },

  getWorkspaceMembers: async (req, res, next) => {
    try {
      const members = await workspacesService.getWorkspaceMembers(
        req.params.workspaceId,
        req.scopedSupabase
      );
      return successResponse(res, members, 200);
    } catch (err) {
      next(err);
    }
  },

  updateWorkspace: async (req, res, next) => {
    try {
      const updated = await workspacesService.updateWorkspace(
        req.params.workspaceId,
        req.body,
        req.workspaceMembership.role,
        req.scopedSupabase
      );
      return successResponse(res, updated, 200, 'Workspace updated successfully');
    } catch (err) {
      next(err);
    }
  },
};
