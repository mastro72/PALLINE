import React from 'react';
import { Cell } from '../types';
import { BallColor } from '../types';

interface CellProps {
  cell: Cell;
  isSelected: boolean;
  isPossibleMove: boolean;
  isMatched: boolean;
  isClearing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

const colorMap: Record<BallColor, string> = {
    [BallColor.Red]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fca5a5_10%,_#dc2626_80%)]',
    [BallColor.Green]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#86efac_10%,_#16a34a_80%)]',
    [BallColor.Blue]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#93c5fd_10%,_#2563eb_80%)]',
    [BallColor.Yellow]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fef08a_10%,_#eab308_80%)]',
    [BallColor.Purple]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#d8b4fe_10%,_#9333ea_80%)]',
    [BallColor.Orange]: 'bg-[radial-gradient(circle_at_33%_33%,white_0,_#fdba74_10%,_#ea580c_80%)]',
};

const CellComponent: React.FC<CellProps> = ({ cell, isSelected, isPossibleMove, isMatched, isClearing, onMouseDown, onTouchStart }) => {
  const baseClasses = 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out select-none';
  
  let cellContent;

  if (cell.color) {
    const ballColorClass = colorMap[cell.color];
    let animationClasses = 'transform hover:scale-110';
    if (isClearing) {
        // Fade out instead of scaling to 0, to let the flying ball animation take over
        animationClasses = 'transform opacity-0';
    } else if (isMatched) {
        animationClasses = 'animate-pulse ring-4 ring-yellow-400';
    }

    cellContent = (
      <div 
        className={`${baseClasses} ${ballColorClass} ${animationClasses} cursor-grab active:cursor-grabbing shadow-inner shadow-lg`}
      >
        {isSelected && !isMatched && <div className="w-4 h-4 md:w-5 md:h-5 bg-white/50 rounded-full animate-pulse"></div>}
      </div>
    );
  } else {
    cellContent = (
      <div 
        className={`${baseClasses} bg-slate-700/50`}
      >
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center aspect-square" onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
        {cellContent}
    </div>
  );
};

export default CellComponent;