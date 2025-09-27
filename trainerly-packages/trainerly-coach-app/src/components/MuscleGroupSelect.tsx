import React, { useState, useRef, useEffect } from 'react';
import { MUSCLE_GROUPS, MuscleGroup } from '../constants/muscleGroups';

interface MuscleGroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean; // For backward compatibility, but discouraged
}

const MuscleGroupSelect: React.FC<MuscleGroupSelectProps> = ({
  value,
  onChange,
  required = false,
  placeholder = "בחר קבוצת שרירים...",
  id,
  className = "",
  disabled = false,
  allowCustom = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter muscle groups based on search term
  const filteredGroups = MUSCLE_GROUPS.filter(group =>
    group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredGroups.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredGroups.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredGroups[highlightedIndex]) {
          handleSelect(filteredGroups[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (group: string) => {
    onChange(group);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (allowCustom) {
      onChange(newValue);
    }
    
    if (!isOpen) {
      setIsOpen(true);
    }
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const displayValue = isOpen ? searchTerm : value;

  return (
    <div 
      ref={containerRef} 
      className={`muscle-group-select ${className}`}
      style={{ position: 'relative' }}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        dir="rtl"
        className="muscle-group-input"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
      
      {isOpen && !disabled && (
        <div 
          className="muscle-group-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group, index) => (
              <div
                key={group}
                className={`muscle-group-option ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelect(group)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: index === highlightedIndex ? '#f3f4f6' : 'transparent',
                  borderBottom: index < filteredGroups.length - 1 ? '1px solid #f3f4f6' : 'none',
                  fontSize: '14px',
                  textAlign: 'right'
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {group}
              </div>
            ))
          ) : (
            <div 
              style={{
                padding: '8px 12px',
                color: '#6b7280',
                fontSize: '14px',
                textAlign: 'right'
              }}
            >
              {allowCustom ? 'לא נמצאו תוצאות - יכול להזין ערך חדש' : 'לא נמצאו תוצאות מתאימות'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MuscleGroupSelect;
