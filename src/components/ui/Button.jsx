import { forwardRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:
    'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40',
  secondary: 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10',
  outline:
    'border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25 border border-red-500/20',
  accent:
    'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-400/20',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-8 py-3.5 text-base rounded-xl gap-2.5',
};

const glassVariant = (variant) => {
  if (variant === 'primary')
    return 'backdrop-blur-xl bg-gradient-to-r from-amber-500/90 to-orange-600/90 border border-white/20';
  if (variant === 'accent')
    return 'backdrop-blur-xl bg-gradient-to-r from-emerald-500/90 to-teal-600/90 border border-white/20';
  return '';
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon: Icon,
      fullWidth = false,
      children,
      className = '',
      animate3d = false,
      ripple = true,
      glow = true,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const [ripples, setRipples] = useState([]);

    const handleClick = useCallback(
      (e) => {
        if (isDisabled) return;

        if (ripple) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now();
          setRipples((prev) => [...prev, { id, x, y }]);
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== id));
          }, 600);
        }
      },
      [isDisabled, ripple]
    );

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.95 }}
        whileHover={
          isDisabled
            ? undefined
            : animate3d
              ? { scale: 1.05, boxShadow: '0 15px 40px rgba(245,158,11,0.3)' }
              : { scale: 1.03 }
        }
        disabled={isDisabled}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center font-semibold relative overflow-hidden
          transition-all duration-300 ease-out cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          select-none
          ${variantStyles[variant] || variantStyles.primary}
          ${sizeStyles[size] || sizeStyles.md}
          ${variant === 'primary' || variant === 'accent' ? glassVariant(variant) : ''}
          ${fullWidth ? 'w-full' : ''}
          ${animate3d ? 'perspective-600 preserve-3d' : ''}
          ${glow && !isDisabled ? 'animate-pulse-glow-3d' : ''}
          ${className}
        `}
        {...props}
      >
        {/* Ripple effect layer */}
        {ripple &&
          ripples.map((r) => (
            <span
              key={r.id}
              className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
              style={{
                left: r.x - 10,
                top: r.y - 10,
                width: 20,
                height: 20,
              }}
              aria-hidden="true"
            />
          ))}

        {/* Shimmer sweep overlay on hover */}
        {!isDisabled && (
          <span
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              transform: 'translateX(-100%)',
              animation: 'shimmer-sweep 2s linear infinite',
            }}
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <span className="relative z-10 inline-flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : Icon ? (
            <Icon className="w-4 h-4 shrink-0" />
          ) : null}
          {children && (
            <span className="relative">
              {children}
              {/* Text shimmer glow for primary buttons */}
              {glow && variant === 'primary' && !isDisabled && (
                <span
                  className="absolute inset-0 animate-pulse-glow"
                  style={{ filter: 'blur(8px)', opacity: 0.5 }}
                  aria-hidden="true"
                />
              )}
            </span>
          )}
        </span>

        {/* 3D edge light for primary */}
        {animate3d && !isDisabled && (
          <span
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
            aria-hidden="true"
          />
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
