import React from 'react';
import './Card.css';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  clickable?: boolean;
  'data-id'?: string;
  // New unified card props
  variant?: 'default' | 'simple';
  title?: string;
  label?: string;
  labelColor?: 'purple' | 'blue' | 'green' | 'orange';
  onEdit?: () => void;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  clickable = false,
  'data-id': dataId,
  variant = 'default',
  title,
  label,
  labelColor = 'purple',
  onEdit,
  isCollapsible = false,
  isExpanded = false,
  onToggleExpand
}) => {
  const cardClasses = [
    'card',
    hoverable && 'card-hoverable',
    clickable && 'card-clickable',
    variant === 'simple' && 'card-simple',
    isCollapsible && 'card-collapsible',
    isExpanded && 'card-expanded',
    className
  ].filter(Boolean).join(' ');

  if (variant === 'simple' && title) {
    return (
      <div
        className={cardClasses}
        onClick={onClick}
        data-id={dataId}
      >
        <div className="card-simple-content">
          <div className="card-main-info">
            <h3 className="card-title-large">{title}</h3>
            {label && (
              <div className={`card-label card-label-${labelColor}`}>
                {label}
              </div>
            )}
          </div>
          
          {onEdit && (
            <button
              className="card-edit-btn"
              title="ערוך"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              ✏️
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-id={dataId}
    >
      {isCollapsible && (
        <div
          className="card-header clickable"
          onClick={onToggleExpand}
        >
          <div className="card-controls">
            <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
          </div>
          <div className="card-info">
            <h3 className="card-title">{title}</h3>
          </div>
        </div>
      )}
      
      {(!isCollapsible || isExpanded) && (
        <div className="card-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Card;