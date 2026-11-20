import { PhotoCraftProject } from '../types';

const STORAGE_KEY = 'photocraft_saved_projects_v1';
const ACTIVE_PROJECT_KEY = 'photocraft_active_project_v1';

export class ProjectService {
  /**
   * Get all saved projects from localStorage
   */
  static getProjects(): PhotoCraftProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load projects from storage:', e);
      return [];
    }
  }

  /**
   * Get a single project by ID
   */
  static getProject(id: string): PhotoCraftProject | null {
    return this.getProjects().find((p) => p.id === id) || null;
  }

  /**
   * Save or update a project in localStorage
   */
  static saveProject(project: PhotoCraftProject): boolean {
    try {
      const projects = this.getProjects();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        projects[existingIdx] = updatedProject;
      } else {
        projects.unshift(updatedProject);
      }

      // Keep up to 25 projects in browser storage
      const trimmed = projects.slice(0, 25);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(updatedProject));
      return true;
    } catch (e) {
      console.error('Failed to save project (storage quota exceeded?):', e);
      return false;
    }
  }

  /**
   * Delete a project by ID
   */
  static deleteProject(id: string): void {
    try {
      const projects = this.getProjects().filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Get the last active project
   */
  static getLastActiveProject(): PhotoCraftProject | null {
    try {
      const data = localStorage.getItem(ACTIVE_PROJECT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Export project as downloadable .photocraft JSON file
   */
  static exportProjectFile(project: PhotoCraftProject): void {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.photocraft`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import project from a .photocraft or .json file
   */
  static importProjectFile(file: File): Promise<PhotoCraftProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as PhotoCraftProject;
          if (!parsed.elements || !parsed.width || !parsed.height) {
            throw new Error('Invalid project file format.');
          }
          parsed.id = 'proj_' + Math.random().toString(36).substring(2, 9);
          parsed.updatedAt = new Date().toISOString();
          this.saveProject(parsed);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Failed to parse project file: ' + err));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }
}

export const CANVAS_PRESETS = [
  { id: 'ig_square', name: 'Instagram Post (1:1)', category: 'social' as const, width: 1080, height: 1080, iconName: 'instagram' },
  { id: 'ig_story', name: 'Instagram Story (9:16)', category: 'social' as const, width: 1080, height: 1920, iconName: 'smartphone' },
  { id: 'yt_thumb', name: 'YouTube Thumbnail', category: 'social' as const, width: 1280, height: 720, iconName: 'youtube' },
  { id: 'fb_post', name: 'Facebook Post', category: 'social' as const, width: 1200, height: 630, iconName: 'facebook' },
  { id: 'x_header', name: 'Twitter / X Header', category: 'social' as const, width: 1500, height: 500, iconName: 'twitter' },
  { id: 'poster_a4', name: 'A4 Editorial Poster', category: 'print' as const, width: 1240, height: 1754, iconName: 'file-text' },
  { id: 'banner_web', name: 'Web Leaderboard', category: 'digital' as const, width: 1200, height: 400, iconName: 'layout' },
];

export function saveProjectToStorage(project: PhotoCraftProject): boolean {
  return ProjectService.saveProject(project);
}

export function getProjectFromStorage(id: string): PhotoCraftProject | null {
  return ProjectService.getProject(id);
}

export function listSavedProjects(): PhotoCraftProject[] {
  return ProjectService.getProjects();
}

export function exportProjectFile(project: PhotoCraftProject): void {
  ProjectService.exportProjectFile(project);
}

export function importProjectFile(file: File): Promise<PhotoCraftProject> {
  return ProjectService.importProjectFile(file);
}

