'use client';

import React from 'react';
import type { Project } from '@/types';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
}) => {
  if (projects.length === 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Noch keine Projekte vorhanden
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => onSelectProject(project.id)}
          className={`
            w-full text-left p-4 rounded-lg transition-all
            ${
              selectedProjectId === project.id
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }
          `}
        >
          <h3 className="font-semibold mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-xs opacity-80 line-clamp-1 mt-1">
              {project.description}
            </p>
          )}
          <div className="text-xs opacity-70 mt-2">
            {project.hourly_rate.toFixed(2)} €/h
          </div>
        </button>
      ))}
    </div>
  );
};

