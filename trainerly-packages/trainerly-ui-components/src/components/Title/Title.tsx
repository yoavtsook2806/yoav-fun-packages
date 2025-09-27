import React from 'react';
import './Title.css';

export interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  icon?: string;
}

export const Title: React.FC<TitleProps> = ({ 
  children, 
  level = 3, 
  className = '', 
  icon 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={`title title-${level} ${className}`}>
      {icon && <span className="title-icon">{icon}</span>}
      {children}
    </Tag>
  );
};
