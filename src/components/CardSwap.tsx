import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface CardSwapProps {
  children: ReactNode;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  autoPlay?: boolean;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  className?: string;
}

interface CardProps {
  key?: string;
  children: ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`card-swap-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export default function CardSwap({
  children,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  autoPlay = true,
  activeIndex,
  onActiveChange,
  className = '',
}: CardSwapProps) {
  const cards = useMemo(() => Children.toArray(children), [children]);
  const [internalActive, setInternalActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const currentActive = activeIndex ?? internalActive;

  const setActive = (index: number) => {
    if (activeIndex === undefined) {
      setInternalActive(index);
    }
    onActiveChange?.(index);
  };

  useEffect(() => {
    if (!autoPlay || cards.length <= 1 || (pauseOnHover && isHovered)) return;

    const timer = window.setInterval(() => {
      const nextIndex = (currentActive + 1) % cards.length;
      setActive(nextIndex);
    }, delay);

    return () => window.clearInterval(timer);
  }, [autoPlay, cards.length, currentActive, delay, isHovered, pauseOnHover]);

  return (
    <div
      className={`card-swap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cards.map((child, index) => {
        const stackPosition = (index - currentActive + cards.length) % cards.length;
        const isFront = stackPosition === 0;
        const depth = Math.min(stackPosition, cards.length - 1);

        const style: CSSProperties = {
          transform: `translate3d(${depth * cardDistance}px, ${depth * verticalDistance}px, ${-depth * 90}px) rotate(${depth * 3}deg) scale(${1 - depth * 0.045})`,
          zIndex: cards.length - depth,
          opacity: Math.max(1 - depth * 0.08, 0.72),
          pointerEvents: 'auto',
        };

        if (!isValidElement<CardProps>(child)) return child;

        return cloneElement(child, {
          key: index,
          style,
          onMouseEnter: () => setActive(index),
          onClick: () => setActive(index),
          className: `${child.props.className ?? ''} ${isFront ? 'is-front' : ''}`,
        });
      })}
    </div>
  );
}
