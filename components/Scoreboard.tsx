import React from 'react';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  currentPlayerId: number;
  isGameActive: boolean;
  onPlayerNameChange: (id: number, name: string) => void;
  playerRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const playerColorClasses: Record<number, string> = {
  1: 'border-red-500',
  2: 'border-blue-500',
  3: 'border-green-500',
  4: 'border-yellow-500',
};


const Scoreboard: React.FC<ScoreboardProps> = ({ players, currentPlayerId, isGameActive, onPlayerNameChange, playerRefs }) => {
  return (
    <div className="w-full bg-slate-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-cyan-400">Punteggio</h2>
      <div className="space-y-3">
        {players.map((player, index) => {
          const isCurrent = player.id === currentPlayerId;
          const colorClass = playerColorClasses[player.id] || 'border-gray-500';

          return (
            <div
              key={player.id}
              // FIX: The ref callback function should not return a value. Wrapped the assignment in curly braces to prevent an implicit return.
              ref={el => { playerRefs.current[index] = el; }}
              className={`flex justify-between items-center p-3 rounded-lg transition-all duration-300 border-2 ${
                isCurrent && isGameActive ? `bg-slate-600 shadow-lg ${colorClass}` : 'bg-slate-700 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-opacity duration-300 ${isCurrent && isGameActive ? 'opacity-100' : 'opacity-0'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                 {isGameActive ? (
                   <span className={`text-xl font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                      {player.name}
                    </span>
                 ) : (
                   <input
                      type="text"
                      value={player.name}
                      onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
                      className="bg-slate-600 text-white text-xl font-semibold rounded-md p-1 w-32 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                 )}
              </div>
              <span className={`text-4xl font-bold ${isCurrent && isGameActive ? 'text-cyan-300' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Scoreboard;