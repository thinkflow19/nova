'use client';

import React from 'react';

// Define props interface, extending standard input attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add any custom props if needed in the future
}

// ForwardRef allows parent components to get a ref to the underlying input element
const Input = React.forwardRef<HTMLInputElement, InputProps>((
  { className, type, ...props }, 
  ref
) => {
  return (
    <input
      type={type}
      // Combine base styles with any additional classes passed via props
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 
                 disabled:opacity-50 disabled:cursor-not-allowed 
                 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input }; 