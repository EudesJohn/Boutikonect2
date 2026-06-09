import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * TiltCard — A wrapper that adds a 3D perspective tilt effect on mouse hover.
 *
 * Props:
 *   children      - Content to wrap
 *   className     - Additional CSS classes
 *   tiltDegree    - Maximum tilt angle in degrees (default: 8)
 *   glare         - Enable glare effect (default: true)
 *   scale         - Scale on hover (default: 1.02)
 *   perspective   - CSS perspective value (default: 800)
 *   speed         - Transition speed in ms (default: 300)
 *   disabled      - Disable tilt effect
 *   onClick       - Click handler
 *   onKeyDown     - Keyboard handler
 *   role          - ARIA role
 *   tabIndex      - Tab index
 *   ariaLabel     - aria-label
 */
export default function TiltCard({
  children,
  className = '',
  tiltDegree = 8,
  glare = true,
  scale = 1.02,
  perspective = 800,
  speed = 300,
  disabled = false,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ariaLabel,
}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e) => {
      if (disabled || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = (e.clientX - centerX) / (rect.width / 2);
      const mouseY = (e.clientY - centerY) / (rect.height / 2);

      const rotateX = -mouseY * tiltDegree;
      const rotateY = mouseX * tiltDegree;

      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: `transform ${speed * 0.3}ms ease-out`,
      });

      if (glare) {
        const glareX = (mouseX + 1) / 2 * 100;
        const glareY = (mouseY + 1) / 2 * 100;
        setGlareStyle({
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
          opacity: 1,
        });
      }
    },
    [disabled, tiltDegree, scale, perspective, speed, glare]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovering(true);
    setStyle((prev) => ({
      ...prev,
      transition: `transform ${speed}ms ease-out`,
    }));
  }, [disabled, speed]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovering(false);
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: `transform ${speed}ms ease-out`,
    });
    setGlareStyle({ opacity: 0, transition: 'opacity 300ms ease-out' });
  }, [disabled, perspective, speed]);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isHovering ? undefined : 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Main content wrapper with tilt transform */}
      <div
        className="relative w-full h-full"
        style={style}
      >
        {children}
      </div>

      {/* Glare overlay */}
      {glare && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            ...glareStyle,
            opacity: glareStyle.opacity ?? 0,
            mixBlendMode: 'overlay',
          }}
          aria-hidden="true"
        />
      )}

      {/* Shine edge highlight on hover */}
      {isHovering && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.05)',
          }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}
