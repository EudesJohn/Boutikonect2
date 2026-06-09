const NotificationBadge = ({ count, className = '' }) => {
  if (count == null || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`
        absolute -top-2 -right-2
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-[10px] font-bold leading-none
        bg-gradient-to-r from-amber-500 to-orange-600
        text-white rounded-full
        shadow-[0_0_8px_rgba(245,158,11,0.5)]
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
