import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  clickable?: boolean;
  'data-id'?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  clickable = false,
  'data-id': dataId
}) => {
  const cardClasses = [
    'card',
    hoverable && 'card-hoverable',
    clickable && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-id={dataId}
    >
      {children}
    </div>
  );
};

export default Card;