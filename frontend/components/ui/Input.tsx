'use client';

import React from 'react';

// Define props interface, extending standard input attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
}

// ForwardRef allows parent components to get a ref to the underlying input element
const Input = React.forwardRef<HTMLInputElement, InputProps>((
  { 
    className, 
    type = 'text', 
    leftIcon, 
    rightIcon, 
    error,
    label,
    id,
    ...props 
  }, 
  ref
) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          className={`
            w-full rounded-md shadow-sm 
            ${leftIcon ? 'pl-10' : 'pl-3'} 
            ${rightIcon ? 'pr-10' : 'pr-3'} 
            py-2 border 
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'} 
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            transition duration-200
            ${className}
          `}
          ref={ref}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input }; 