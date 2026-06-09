import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating — Displays a star rating with support for full, half, and empty stars.
 *
 * Props:
 *   rating      : number — The current rating value (0 to maxRating)
 *   maxRating   : number — Maximum rating value (default: 5)
 *   size        : 'sm' | 'md' | 'lg' — Icon size preset (default: 'md')
 *   interactive : boolean — Enable click/hover to set rating (default: false)
 *   onRate      : function(rating) — Callback when a star is clicked in interactive mode
 *   className   : string — Additional CSS classes for the container
 */
export default function StarRating({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  className = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Guard against invalid rating
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  const safeMaxRating =
    typeof maxRating === 'number' && maxRating > 0 && !isNaN(maxRating) ? maxRating : 5;

  // Determine displayed value: hover preview overrides actual rating in interactive mode
  const displayRating = interactive && hoveredIndex !== null ? hoveredIndex : safeRating;

  // Size mapping
  const sizeMap = {
    sm: { icon: 14, container: 'gap-0.5' },
    md: { icon: 20, container: 'gap-1' },
    lg: { icon: 28, container: 'gap-1' },
  };

  const { icon: iconSize, container: gapClass } = sizeMap[size] || sizeMap.md;

  const handleClick = (starIndex) => {
    if (!interactive) return;

    // Toggle off if clicking the same full star, otherwise set the value
    let newRating;
    if (safeRating === starIndex && Number.isInteger(starIndex)) {
      newRating = starIndex - 0.5; // half star
    } else {
      newRating = starIndex;
    }
    if (onRate) {
      onRate(newRating);
    }
  };

  const handleMouseEnter = (starIndex) => {
    if (!interactive) return;
    setHoveredIndex(starIndex);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredIndex(null);
  };

  const handleKeyDown = (e, starIndex) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(starIndex);
    }
  };

  // Generate star data with type: 'full' | 'half' | 'empty'
  const stars = Array.from({ length: safeMaxRating }, (_, index) => {
    const starPosition = index + 1;
    const filled = Math.min(Math.max(displayRating, 0), safeMaxRating);
    const isFull = starPosition <= filled;
    const isHalf = !isFull && starPosition - 0.5 <= filled;

    return {
      position: starPosition,
      type: isFull ? 'full' : isHalf ? 'half' : 'empty',
    };
  });

  // If there are no valid stars, render nothing
  if (stars.length === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center ${gapClass} ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Note : ${safeRating} sur ${safeMaxRating}`}
      aria-roledescription={interactive ? 'Sélection de note par étoiles' : undefined}
    >
      {stars.map(({ position, type }) => {
        // For interactive mode, use clickable button semantics
        const isInteractive = interactive;

        return (
          <span
            key={position}
            role={isInteractive ? 'radio' : undefined}
            aria-checked={isInteractive ? type === 'full' || type === 'half' : undefined}
            aria-label={isInteractive ? `${position} étoile${position > 1 ? 's' : ''}` : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={() => handleClick(position)}
            onMouseEnter={() => handleMouseEnter(position)}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(e) => handleKeyDown(e, position)}
            className={`${
              isInteractive ? 'cursor-pointer transition-transform duration-150 hover:scale-125' : ''
            } ${type !== 'empty' ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            {type === 'half' ? (
              <span className="relative inline-block">
                {/* Empty star background */}
                <Star size={iconSize} className="text-gray-300" fill="currentColor" />
                {/* Half-filled overlay: clip to left half */}
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  <Star size={iconSize} className="text-yellow-400" fill="currentColor" />
                </span>
              </span>
            ) : (
              <Star
                size={iconSize}
                className={type === 'full' ? 'text-yellow-400' : 'text-gray-300'}
                fill="currentColor"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
