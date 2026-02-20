
import React, { useEffect, useState } from 'react';

interface AnimatedDropdownProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  // Deprecated props kept for compatibility but unused in new logic
  animationEnter?: string;
  animationExit?: string;
}

const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({ 
  isOpen, 
  children, 
  className = "", 
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      setIsRendered(true);
      // Double RAF to ensure DOM is painted with initial state (opacity-0) before animating
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      setIsAnimating(false);
      // Wait for transition to finish (200ms matching duration)
      timeout = setTimeout(() => setIsRendered(false), 200);
    }
    
    return () => clearTimeout(timeout);
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div 
      className={`${className} transform transition-all duration-200 ease-out origin-top ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}
    >
      {children}
    </div>
  );
};

export default AnimatedDropdown;
