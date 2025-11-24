import React from 'react';
import { Grid, Position } from '../types';
import CellComponent from './Cell';
import { GRID_SIZE } from '../constants';

interface GameBoardProps {
  grid: Grid;
  selectedBall: Position | null;
  onCellMouseDown: (e: React.MouseEvent, row: number, col: number) => void;
  onCellTouchStart: (e: React.TouchEvent, row: number, col: number) => void;
  isAnimating: boolean;
  matchedPositions: Position[];
  clearingPositions: Set<string>;
  isGameActive: boolean;
  scorePopup: { score: number; position: Position } | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  grid, 
  selectedBall, 
  onCellMouseDown,
  onCellTouchStart,
  isAnimating,
  matchedPositions,
  clearingPositions,
  isGameActive,
  scorePopup
}) => {
  return (
    <div 
      className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 p-4 rounded-xl shadow-2xl border-2 border-cyan-300/50"
    >
      <div 
        className={`relative bg-slate-800 p-2 md:p-4 rounded-lg shadow-inner transition-opacity duration-300 ${!isGameActive ? 'opacity-50 cursor-not-allowed' : ''} ${isAnimating ? 'pointer-events-none' : ''}`}
      >
        <div className={`grid grid-cols-11 gap-1`}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selectedBall?.row === rowIndex && selectedBall?.col === colIndex;
              const isMatched = matchedPositions.some(p => p.row === rowIndex && p.col === colIndex);
              const isClearing = clearingPositions.has(`${rowIndex}-${colIndex}`);
              
              return (
                <CellComponent
                  key={cell.id}
                  cell={cell}
                  isSelected={isSelected}
                  isPossibleMove={false} // No longer used in drag mode
                  isMatched={isMatched}
                  isClearing={isClearing}
                  onMouseDown={(e) => onCellMouseDown(e, rowIndex, colIndex)}
                  onTouchStart={(e) => onCellTouchStart(e, rowIndex, colIndex)}
                />
              );
            })
          )}
        </div>
        {scorePopup && (
          <div
            className="absolute text-5xl font-extrabold text-yellow-300 score-popup pointer-events-none"
            style={{
              top: `${(scorePopup.position.row + 0.5) / GRID_SIZE * 100}%`,
              left: `${(scorePopup.position.col + 0.5) / GRID_SIZE * 100}%`,
            }}
          >
            +{scorePopup.score}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;