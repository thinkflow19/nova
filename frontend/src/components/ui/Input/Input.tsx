'use client';

import React, { forwardRef, useState } from 'react';
import { InputProps } from '@/types';
import styles from './Input.module.css';

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputId = React.useId();
  const errorId = React.useId();
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const containerClasses = [
    styles.container,
    isFocused && styles.focused,
    error && styles.hasError,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    'neural-input',
    error && styles.inputError,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && (
            <span className={styles.required} aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        
        {isFocused && (
          <div className={styles.focusRing} aria-hidden="true" />
        )}
      </div>
      
      {error && (
        <div id={errorId} className={styles.error} role="alert">
          <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 