import React from 'react';
import { Player } from '../types';

interface GameOverModalProps {
  winner: Player | null;
  players: Player[];
  onNewGame: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ winner, players, onNewGame }) => {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 text-center max-w-sm w-full mx-4">
        <h2 className="text-4xl font-extrabold text-cyan-400 mb-4">Partita Finita!</h2>
        {winner.id !== -1 ? (
            <p className="text-xl mb-2">{winner.name} vince!</p>
        ) : (
            <p className="text-xl mb-2">Pareggio!</p>
        )}
        <div className="my-6">
            <h3 className="text-lg font-bold mb-3 text-slate-300">Punteggi Finali:</h3>
            <div className="space-y-2">
            {players.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-slate-700 p-2 rounded-md">
                    <span className="font-semibold">{p.name}:</span>
                    <span className="font-bold text-cyan-400 text-xl">{p.score}</span>
                </div>
            ))}
            </div>
        </div>

        <button
          onClick={onNewGame}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 text-lg"
        >
          Gioca Ancora
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;