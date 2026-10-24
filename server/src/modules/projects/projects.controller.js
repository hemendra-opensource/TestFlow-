import * as projectsService from './projects.service.js';
import { successResponse } from '../../utils/response.js';

export const listProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { status, search } = req.query;

    const projects = await projectsService.listProjects(
      req.scopedSupabase,
      workspaceId,
      { status, search }
    );

    return successResponse(res, projects, 200, 'Projects retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const project = await projectsService.createProject(
      req.scopedSupabase,
      workspaceId,
      req.user.id,
      req.body
    );

    return successResponse(res, project, 201, 'Project created successfully');
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await projectsService.getProjectById(req.scopedSupabase, projectId);

    return successResponse(res, project, 200, 'Project retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const updated = await projectsService.updateProject(
      req.scopedSupabase,
      projectId,
      req.body
    );

    return successResponse(res, updated, 200, 'Project updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await projectsService.deleteProject(req.scopedSupabase, projectId);

    return successResponse(res, result, 200, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};
