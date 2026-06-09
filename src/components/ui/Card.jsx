import { motion } from 'framer-motion';

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = ({
  hover = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      whileHover={
        hover
          ? { y: -4, scale: 1.01 }
          : undefined
      }
      className={`
        relative overflow-hidden
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl
        transition-all duration-300
        ${
          hover
            ? 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/30'
            : ''
        }
        ${paddingStyles[padding] || paddingStyles.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
