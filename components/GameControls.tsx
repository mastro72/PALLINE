import React from 'react';

interface GameControlsProps {
  playerCount: number;
  setPlayerCount: (count: number) => void;
  onNewGame: () => void;
  isGameActive: boolean;
  onAbandonGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ playerCount, setPlayerCount, onNewGame, isGameActive, onAbandonGame }) => {
  return (
    <div className="w-full bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="playerCount" className="font-semibold text-lg">Giocatori:</label>
        <select
          id="playerCount"
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          disabled={isGameActive}
          className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewGame}
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          {isGameActive ? 'Riavvia' : 'Inizia Nuova Partita'}
        </button>
        {isGameActive && (
            <button
                onClick={onAbandonGame}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
                Abbandona
            </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;