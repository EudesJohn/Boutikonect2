import { Star } from 'lucide-react';

const variantStyles = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  default: 'bg-white/10 text-gray-300 border-white/20',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

const Badge = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.sm}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

const PromotedBadge = ({ size = 'sm', className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        bg-gradient-to-r from-amber-500/20 to-orange-600/20
        text-amber-400 border border-amber-500/30
        shadow-[0_0_12px_rgba(245,158,11,0.3)]
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${className}
      `}
    >
      <Star className="w-3 h-3 fill-amber-400" />
      Vedette
    </span>
  );
};

export { PromotedBadge };
export default Badge;
