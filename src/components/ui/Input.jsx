import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full px-4 py-2.5 rounded-xl
              bg-white/5 backdrop-blur-sm
              border
              text-white placeholder-gray-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-white/10'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

const Select = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      options = [],
      className = '',
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    const selectId =
      id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 z-10">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-4 py-2.5 rounded-xl appearance-none cursor-pointer
              bg-white/5 backdrop-blur-sm
              border
              text-white
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-white/10'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-gray-800 text-gray-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={value} value={value} className="bg-gray-800">
                  {label}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Input;
