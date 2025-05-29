import React, { useState } from 'react';
import { Project } from '@/types';
import { Card } from '@/components/ui';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onDuplicate?: (project: Project) => void;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProjectIcon = () => {
    if (project.icon) return project.icon;
    
    // Default icons based on project type or name
    const name = project.name.toLowerCase();
    if (name.includes('chat') || name.includes('conversation')) return '💬';
    if (name.includes('doc') || name.includes('document')) return '📄';
    if (name.includes('code') || name.includes('dev')) return '💻';
    if (name.includes('data') || name.includes('analysis')) return '📊';
    if (name.includes('ai') || name.includes('bot')) return '🤖';
    return '🚀';
  };

  const getProjectColor = () => {
    if (project.color) return project.color;
    
    // Generate color based on project ID for consistency
    const colors = [
      'var(--accent-electric)',
      'var(--accent-purple)',
      'var(--accent-plasma)',
      'var(--accent-gold)',
      'var(--accent-crimson)',
      'var(--accent-sapphire)'
    ];
    
    const hash = project.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleCardClick = () => {
    if (!showActions) {
      onClick?.(project);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete?.(project.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(project);
  };

  return (
    <Card
      variant="glass"
      hover
      glow
      onClick={handleCardClick}
      className={`${styles.projectCard} ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Project header */}
      <div className={styles.header}>
        <div 
          className={styles.iconContainer}
          style={{ background: getProjectColor() }}
        >
          <span className={styles.icon}>{getProjectIcon()}</span>
        </div>
        
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>{project.name}</h3>
          <div className={styles.metadata}>
            <span className={styles.date}>
              {formatDate(project.updated_at)}
            </span>
            {project.is_public && (
              <span className={styles.publicBadge}>Public</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={handleEdit}
              title="Edit project"
            >
              ✏️
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDuplicate}
              title="Duplicate project"
            >
              📋
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDelete}
              title="Delete project"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Project description */}
      {project.description && (
        <div className={styles.description}>
          <p>{project.description}</p>
        </div>
      )}

      {/* Project tags */}
      {project.tags && project.tags.length > 0 && (
        <div className={styles.tags}>
          {project.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className={styles.tagMore}>
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Project stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Memory</span>
          <span className={styles.statValue}>
            {project.memory_type || 'Standard'}
          </span>
        </div>
        
        {project.ai_config?.model && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Model</span>
            <span className={styles.statValue}>
              {project.ai_config.model}
            </span>
          </div>
        )}
      </div>

      {/* Neural glow effect */}
      {isHovered && (
        <div 
          className={styles.neuralGlow}
          style={{ 
            background: `radial-gradient(circle, ${getProjectColor()}20 0%, transparent 70%)` 
          }}
        />
      )}
    </Card>
  );
};

export default ProjectCard; 