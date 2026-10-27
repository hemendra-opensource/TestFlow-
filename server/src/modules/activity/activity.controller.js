import { listWorkspaceActivity } from './activity.service.js';
import { successResponse } from '../../utils/response.js';

export const getWorkspaceActivity = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { limit, offset } = req.query;

    const activity = await listWorkspaceActivity(req.scopedSupabase, workspaceId, {
      limit,
      offset,
    });

    return successResponse(res, activity, 200, 'Workspace activity retrieved successfully');
  } catch (err) {
    next(err);
  }
};
