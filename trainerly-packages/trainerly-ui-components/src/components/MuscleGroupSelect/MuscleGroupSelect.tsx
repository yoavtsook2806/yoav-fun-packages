import React, { useState, useRef, useEffect } from 'react';

/**
 * Muscle groups list for exercise categorization
 * Matches the server-side muscle groups from trainerly-server constants
 */
export const MUSCLE_GROUPS = [
  'חזה עליון',      // Upper chest
  'חזה תחתון',      // Lower chest
  'חזה אמצעי',      // Middle chest
  'גב עליון',       // Upper back
  'גב תחתון',       // Lower back
  'גב אמצעי',       // Middle back
  'גב רחב',         // Latissimus dorsi
  'ירך קדמי',       // Quadriceps
  'ירך אחורי',      // Hamstrings
  'ישבן',           // Glutes
  'שוק',            // Calves
  'כתף קדמית',      // Front deltoid
  'כתף צדדית',      // Side deltoid
  'כתף אחורית',     // Rear deltoid
  'טרפז',           // Trapezius
  'יד קדמית',       // Biceps
  'יד אחורית',      // Triceps
  'אמה',            // Forearms
  'בטן עליונה',     // Upper abs
  'בטן תחתונה',     // Lower abs
  'בטן צדדית',      // Side abs (obliques)
  'ליבה',           // Core
  'ירך פנימי',      // Inner thigh
  'ירך חיצוני',     // Outer thigh
  'גוף מלא'         // Full body
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

// Helper function to check if a string is a valid muscle group
export const isValidMuscleGroup = (value: string): value is MuscleGroup => {
  return MUSCLE_GROUPS.includes(value as MuscleGroup);
};

export interface MuscleGroupSelectProps {
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
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius-lg)',
          fontSize: '14px',
          backgroundColor: disabled ? 'var(--bg-disabled)' : 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
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
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            borderTop: 'none',
            borderRadius: '0 0 var(--border-radius-lg) var(--border-radius-lg)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: 'var(--shadow-md)'
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
                  backgroundColor: index === highlightedIndex ? 'var(--bg-hover)' : 'transparent',
                  borderBottom: index < filteredGroups.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                  fontSize: '14px',
                  textAlign: 'right',
                  color: 'var(--text-primary)'
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
                color: 'var(--text-muted)',
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
