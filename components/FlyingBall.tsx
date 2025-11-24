import React, { useEffect, useState, useRef } from 'react';
import { BallColor } from '../types';

interface FlyingBallProps {
  color: BallColor;
  startRect: DOMRect;
  endRect: DOMRect;
  onAnimationEnd: () => void;
  ballSize: number;
}

const colorMap: Record<BallColor, string> = {
    [BallColor.Red]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fca5a5_10%,_#dc2626_80%)]',
    [BallColor.Green]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#86efac_10%,_#16a34a_80%)]',
    [BallColor.Blue]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#93c5fd_10%,_#2563eb_80%)]',
    [BallColor.Yellow]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fef08a_10%,_#eab308_80%)]',
    [BallColor.Purple]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#d8b4fe_10%,_#9333ea_80%)]',
    [BallColor.Orange]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fdba74_10%,_#ea580c_80%)]',
};

const FlyingBall: React.FC<FlyingBallProps> = ({ color, startRect, endRect, onAnimationEnd, ballSize }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: startRect.top,
    left: startRect.left,
    width: ballSize,
    height: ballSize,
    transition: 'all 0.8s cubic-bezier(0.5, 0, 1, 0.5)',
    zIndex: 100,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStyle(prevStyle => ({
        ...prevStyle,
        top: endRect.top + endRect.height / 2 - ballSize / 2,
        left: endRect.left + endRect.width / 2 - ballSize / 2,
        transform: 'scale(0.3)',
        opacity: 0.5,
      }));
    }, 10); // Start animation shortly after mounting

    const transitionEndId = setTimeout(onAnimationEnd, 800); // Corresponds to transition duration

    return () => {
        clearTimeout(timeoutId);
        clearTimeout(transitionEndId);
    };
  }, [startRect, endRect, onAnimationEnd, ballSize]);
  
  const ballColorClass = colorMap[color];

  return (
    <div
      style={style}
      className={`rounded-full shadow-lg ${ballColorClass}`}
    />
  );
};

export default FlyingBall;