import React, { useEffect, useRef } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  maxHeight = 200,
  className = '',
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value, maxHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      className={`resize-none overflow-y-auto ${className}`}
      {...props}
    />
  );
};

export default AutoResizeTextarea; 