import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  dir?: 'ltr' | 'rtl';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoComplete,
  size = 'medium',
  variant = 'default',
  leftIcon,
  rightIcon,
  fullWidth = false,
  dir = 'rtl'
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'input-container',
    `input-${size}`,
    `input-${variant}`,
    fullWidth && 'input-full-width',
    disabled && 'input-disabled',
    error && 'input-error',
    leftIcon && 'input-has-left-icon',
    rightIcon && 'input-has-right-icon',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} dir={dir}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {leftIcon && (
          <div className="input-icon input-icon-left">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className="input-field"
          dir={dir}
        />
        
        {rightIcon && (
          <div className="input-icon input-icon-right">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <div className="input-error-message" dir={dir}>
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
