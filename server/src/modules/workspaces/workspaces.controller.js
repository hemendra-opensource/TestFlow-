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
      const { name, slug } = req.body;
      const newWorkspace = await workspacesService.createWorkspace(
        name,
        slug,
        req.user,
        req.scopedSupabase
      );
      return successResponse(res, newWorkspace, 201, 'Workspace created successfully');
    } catch (err) {
      next(err);
    }
  },
};
