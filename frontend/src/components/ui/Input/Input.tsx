import { InputProps } from '@/types';

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  className = '',
}: InputProps) => {
  const baseClasses = `
    w-full px-4 py-3 rounded-xl border transition-all duration-200
    bg-white dark:bg-neural-900 
    text-neural-900 dark:text-neural-100
    placeholder-neural-400 dark:placeholder-neural-500
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const stateClasses = error
    ? `
        border-accent-error focus:border-accent-error 
        focus:ring-accent-error/50
      `
    : `
        border-neural-200 dark:border-neural-700
        focus:border-accent-primary focus:ring-accent-primary/50
        hover:border-neural-300 dark:hover:border-neural-600
      `;

  const combinedClasses = `
    ${baseClasses}
    ${stateClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neural-700 dark:text-neural-300">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={combinedClasses}
      />
      {error && (
        <p className="text-sm text-accent-error">{error}</p>
      )}
    </div>
  );
};

export default Input; 