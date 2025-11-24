import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, Position, Player, Cell, BallColor } from './types';
import { initializeGrid, findMatches, isMovePossible } from './services/gameLogic';
import * as audio from './services/audio';
import GameBoard from './components/GameBoard';
import Scoreboard from './components/Scoreboard';
import GameControls from './components/GameControls';
import GameOverModal from './components/GameOverModal';
import FlyingBall from './components/FlyingBall';
import { GRID_SIZE, MIN_GROUP_SIZE } from './constants';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

interface FlyingBallData {
  id: string;
  color: BallColor;
  startRect: DOMRect;
  endRect: DOMRect;
}

const App: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(() => initializeGrid());
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [matchedPositions, setMatchedPositions] = useState<Position[]>([]);
  const [clearingPositions, setClearingPositions] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [flyingBalls, setFlyingBalls] = useState<FlyingBallData[]>([]);
  const [scorePopup, setScorePopup] = useState<{ score: number; position: Position } | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedBall, setDraggedBall] = useState<Position | null>(null);
  const [previewGrid, setPreviewGrid] = useState<Grid | null>(null);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const playerScoreRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Initialize players for name editing before game starts
    const initialPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      score: 0,
      name: `Giocatore ${i + 1}`,
    }));
    setPlayers(initialPlayers);
    playerScoreRefs.current = playerScoreRefs.current.slice(0, playerCount);
  }, [playerCount]);


  const startNewGame = useCallback(() => {
    audio.initAudio();
    audio.playStartSound();
    setGrid(initializeGrid());
    // Reset scores, keep names
    setPlayers(currentPlayers => currentPlayers.map(p => ({ ...p, score: 0 })));
    setCurrentPlayerId(1);
    setGameOver(false);
    setWinner(null);
    setIsGameActive(true);
    setIsAnimating(false);
    setMatchedPositions([]);
    setClearingPositions(new Set());
    setIsDragging(false);
    setDraggedBall(null);
    setPreviewGrid(null);
  }, []);

  const handleAbandonGame = () => {
    setIsGameActive(false);
    setGameOver(false);
    setWinner(null);
    // Re-initialize players with default names
    const initialPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      score: 0,
      name: `Giocatore ${i + 1}`,
    }));
    setPlayers(initialPlayers);
    setGrid(initializeGrid());
    setMatchedPositions([]);
    setClearingPositions(new Set());
    setIsDragging(false);
    setDraggedBall(null);
    setPreviewGrid(null);
    setCurrentPlayerId(1);
  };
  
  const handlePlayerNameChange = (id: number, name: string) => {
    if (isGameActive) return;
    setPlayers(players => players.map(p => p.id === id ? { ...p, name } : p));
  };
  
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audio.setMute(newMutedState);
  };


  useEffect(() => {
    if (!isGameActive || isAnimating || gameOver) return;

    const noMovesLeft = !isMovePossible(grid);
    const allBallsCleared = grid.every(row => row.every(cell => cell.color === null));
    
    const colorCounts: { [key in BallColor]?: number } = {};
    grid.flat().forEach(cell => {
      if (cell.color) {
        colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
      }
    });
    const noMatchesPossible = Object.values(colorCounts).every(count => count < MIN_GROUP_SIZE);


    if (noMovesLeft || allBallsCleared || noMatchesPossible) {
      setGameOver(true);
      setIsGameActive(false);
      setIsAnimating(true); // Prevent moves during end sequence

      const endSequence = async () => {
        let finalPlayersState = [...players];
        const remainingBallPositions: Position[] = [];
        if ((noMovesLeft || noMatchesPossible) && !allBallsCleared) {
          
          grid.flat().forEach((cell, index) => {
            if (cell.color !== null) {
              remainingBallPositions.push({
                row: Math.floor(index / GRID_SIZE),
                col: index % GRID_SIZE,
              });
            }
          });

          const remainingBallsCount = remainingBallPositions.length;
          if(remainingBallsCount > 0) {
            // Last player is the one *before* the current one
            const lastPlayerIndex = (currentPlayerId - 2 + players.length) % players.length;
            const lastPlayerId = players[lastPlayerIndex].id;
            
            // Score popup animation
            const avgRow = remainingBallPositions.reduce((sum, p) => sum + p.row, 0) / remainingBallsCount;
            const avgCol = remainingBallPositions.reduce((sum, p) => sum + p.col, 0) / remainingBallsCount;
            setScorePopup({ score: remainingBallsCount, position: { row: avgRow, col: avgCol } });
            setTimeout(() => setScorePopup(null), 1500);

            // Flying balls animation
            const endRect = playerScoreRefs.current[lastPlayerIndex]?.getBoundingClientRect();
            const gridRect = boardRef.current?.getBoundingClientRect();

            if (endRect && gridRect) {
              const newFlyingBalls: FlyingBallData[] = [];
              const clearingPosSet = new Set<string>();

              remainingBallPositions.forEach(pos => {
                const cellColor = grid[pos.row][pos.col].color;
                if (!cellColor) return;
                
                clearingPosSet.add(`${pos.row}-${pos.col}`);
                const cellElement = boardRef.current?.querySelectorAll('.aspect-square')[pos.row * GRID_SIZE + pos.col];
                const startRect = cellElement?.getBoundingClientRect();
                if (startRect) {
                  newFlyingBalls.push({
                    id: `${pos.row}-${pos.col}-${Date.now()}`,
                    color: cellColor, startRect, endRect
                  });
                }
              });

              setFlyingBalls(prev => [...prev, ...newFlyingBalls]);
              setClearingPositions(clearingPosSet);
            }
             
            finalPlayersState = finalPlayersState.map(p =>
              p.id === lastPlayerId ? { ...p, score: p.score + remainingBallsCount } : p
            );
            
            await delay(800);
            
            setGrid(currentGrid => {
                const newGrid = JSON.parse(JSON.stringify(currentGrid));
                remainingBallPositions.forEach(pos => { newGrid[pos.row][pos.col].color = null; });
                return newGrid;
            });
            setPlayers(finalPlayersState);
            setClearingPositions(new Set());
          }
        }
        
        audio.playGameOverSound();
        
        let maxScore = -1;
        let winningPlayers: Player[] = [];
        finalPlayersState.forEach(p => {
          if (p.score > maxScore) {
            maxScore = p.score;
            winningPlayers = [p];
          } else if (p.score === maxScore) {
            winningPlayers.push(p);
          }
        });

        if (winningPlayers.length === 1) {
          setWinner(winningPlayers[0]);
        } else {
          setWinner({ id: -1, score: maxScore, name: "Tie" });
        }
        setIsAnimating(false);
      };
      
      endSequence();
    }
  }, [grid, players, isGameActive, isAnimating, currentPlayerId, gameOver]);

  const calculatePreviewMove = useCallback((from: Position, isHorizontal: boolean, steps: number): { newGrid: Grid; moved: boolean } => {
    if (steps === 0) return { newGrid: grid, moved: false };

    const direction = steps > 0 ? 1 : -1;
    const numSteps = Math.abs(steps);

    let tempGrid = JSON.parse(JSON.stringify(grid));
    let movedOverall = false;
    let currentDraggedBallPos = { ...from };

    for (let i = 0; i < numSteps; i++) {
        let trainPositions: Position[] = [];
        let posToCheck = { ...currentDraggedBallPos };
        
        while (true) {
            const r = posToCheck.row;
            const c = posToCheck.col;

            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || !tempGrid[r][c].color) {
                break;
            }
            trainPositions.push({ row: r, col: c });
            
            if (isHorizontal) {
                posToCheck.col += direction;
            } else {
                posToCheck.row += direction;
            }
        }
        
        if (trainPositions.length === 0) break;

        const leadingEdgeR = isHorizontal ? from.row : trainPositions[trainPositions.length - 1].row + direction;
        const leadingEdgeC = isHorizontal ? trainPositions[trainPositions.length - 1].col + direction : from.col;

        if (
            leadingEdgeR < 0 || leadingEdgeR >= GRID_SIZE ||
            leadingEdgeC < 0 || leadingEdgeC >= GRID_SIZE ||
            tempGrid[leadingEdgeR][leadingEdgeC]?.color
        ) {
            break; 
        }
        
        movedOverall = true;
        
        const sortedTrain = direction > 0 
            ? trainPositions.sort((a, b) => isHorizontal ? b.col - a.col : b.row - a.row)
            : trainPositions.sort((a, b) => isHorizontal ? a.col - b.col : a.row - b.row);

        for (const pos of sortedTrain) {
            const ballToMove = tempGrid[pos.row][pos.col];
            tempGrid[pos.row][pos.col] = { color: null, id: `empty-${pos.row}-${pos.col}-${Math.random()}` };
            
            const newRow = pos.row + (isHorizontal ? 0 : direction);
            const newCol = pos.col + (isHorizontal ? direction : 0);
            tempGrid[newRow][newCol] = ballToMove;
        }

        if (isHorizontal) {
            currentDraggedBallPos.col += direction;
        } else {
            currentDraggedBallPos.row += direction;
        }
    }

    return { newGrid: tempGrid, moved: movedOverall };
  }, [grid]);


  // --- Unified Interaction Logic for Mouse and Touch ---
  const handleInteractionStart = (x: number, y: number, row: number, col: number) => {
    if (!isGameActive || gameOver || isAnimating || !grid[row][col].color) return;
    setIsDragging(true);
    setDragStartPos({ x, y });
    setDraggedBall({ row, col });
  };
  
  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    handleInteractionStart(e.clientX, e.clientY, row, col);
  };

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    if (e.touches.length > 0) {
        handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY, row, col);
    }
  };

  const handleInteractionMove = useCallback((x: number, y: number) => {
    if (!isDragging || !dragStartPos || !draggedBall) return;

    const dx = x - dragStartPos.x;
    const dy = y - dragStartPos.y;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      setPreviewGrid(null);
      return;
    }
    
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const cellSize = boardRef.current ? boardRef.current.clientWidth / GRID_SIZE : 40;
    const steps = isHorizontal ? Math.round(dx / cellSize) : Math.round(dy / cellSize);

    const { newGrid, moved } = calculatePreviewMove(draggedBall, isHorizontal, steps);
    if (moved) {
      setPreviewGrid(newGrid);
    } else {
      setPreviewGrid(null);
    }
  }, [isDragging, dragStartPos, draggedBall, calculatePreviewMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleInteractionMove(e.clientX, e.clientY);
  }, [isDragging, handleInteractionMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    // Prevent the browser from scrolling the page, which fixes vertical drag issues on touch devices.
    e.preventDefault();
    if (e.touches.length > 0) {
        handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [isDragging, handleInteractionMove]);
  
  const handleInteractionEnd = useCallback(async () => {
    if (!isDragging || !draggedBall) return;

    const finalGrid = previewGrid || grid;
    const wasMoveMade = !!previewGrid;

    setIsDragging(false);
    setDraggedBall(null);
    setDragStartPos(null);
    setPreviewGrid(null);

    if (!wasMoveMade) {
      return;
    }

    audio.playMoveSound();
    setIsAnimating(true);
    
    const movedPositions: Position[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c].id !== finalGrid[r][c].id && finalGrid[r][c].color) {
          movedPositions.push({ row: r, col: c });
        }
      }
    }

    setGrid(finalGrid);
    await delay(100);

    const matches = findMatches(finalGrid, movedPositions);

    if (matches.length > 0) {
      setMatchedPositions(matches);
      
      const score = matches.length;
      const avgRow = matches.reduce((sum, p) => sum + p.row, 0) / score;
      const avgCol = matches.reduce((sum, p) => sum + p.col, 0) / score;
      setScorePopup({ score, position: { row: avgRow, col: avgCol } });
      setTimeout(() => setScorePopup(null), 1500);
      
      await delay(500);

      const sortedMatches = matches.sort((a, b) => a.row - b.row || a.col - b.col);
      const endRect = playerScoreRefs.current[currentPlayerId - 1]?.getBoundingClientRect();
      const gridRect = boardRef.current?.getBoundingClientRect();

      if (endRect && gridRect) {
        for (const pos of sortedMatches) {
          const cellColor = finalGrid[pos.row][pos.col].color;
          if (!cellColor) continue;

          const cellElement = boardRef.current?.querySelectorAll('.aspect-square')[pos.row * GRID_SIZE + pos.col];
          const startRect = cellElement?.getBoundingClientRect();

          if (startRect) {
            const flyingBallData: FlyingBallData = {
              id: `${pos.row}-${pos.col}-${Date.now()}`,
              color: cellColor,
              startRect,
              endRect,
            };
            setFlyingBalls(prev => [...prev, flyingBallData]);
          }

          setClearingPositions(prev => new Set(prev).add(`${pos.row}-${pos.col}`));
          setPlayers(prevPlayers => prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, score: p.score + 1 } : p
          ));
          
          audio.playScoreSound();
          await delay(100);
        }
      }

      await delay(800);
      
      setGrid(currentGrid => {
          const newGrid = JSON.parse(JSON.stringify(currentGrid));
          matches.forEach(pos => {
            newGrid[pos.row][pos.col].color = null;
            newGrid[pos.row][pos.col].id = `${pos.row}-${pos.col}-cleared-${Date.now()}`;
          });
          return newGrid;
      });
      
      setMatchedPositions([]);
      setClearingPositions(new Set());
    }

    setCurrentPlayerId(prevId => (prevId % players.length) + 1);
    setIsAnimating(false);
  }, [isDragging, draggedBall, previewGrid, grid, players, currentPlayerId]);

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      // Touch events
      // By setting passive: false, we can call event.preventDefault() inside the listener.
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
      window.addEventListener('touchcancel', handleInteractionEnd); // Handle interruptions
    }
    return () => {
      // Mouse events
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      // Touch events
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
      window.removeEventListener('touchcancel', handleInteractionEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleInteractionEnd]);


  return (
    <div 
      className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 gap-6"
    >
      <header className="relative w-full max-w-6xl text-center flex justify-center items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-cyan-400">
          gioco delle palline
        </h1>
        <button 
          onClick={toggleMute} 
          className="absolute top-1/2 right-0 -translate-y-1/2 bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l-4-4m0 4l4-4" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </header>

      <main className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full max-w-6xl">
        <div className="w-full lg:w-auto" ref={boardRef}>
          <GameBoard
            grid={previewGrid || grid}
            selectedBall={draggedBall}
            onCellMouseDown={handleMouseDown}
            onCellTouchStart={handleTouchStart}
            isAnimating={isAnimating || gameOver}
            matchedPositions={matchedPositions}
            clearingPositions={clearingPositions}
            isGameActive={isGameActive}
            scorePopup={scorePopup}
          />
        </div>
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          <GameControls
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            onNewGame={startNewGame}
            isGameActive={isGameActive}
            onAbandonGame={handleAbandonGame}
          />
          {players.length > 0 && (
            <Scoreboard 
              players={players} 
              currentPlayerId={currentPlayerId} 
              isGameActive={isGameActive}
              onPlayerNameChange={handlePlayerNameChange}
              playerRefs={playerScoreRefs}
            />
          )}
          {!isGameActive && !gameOver && players.length === 0 && (
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Benvenuto!</h2>
              <p className="text-slate-300">Seleziona il numero di giocatori e premi 'Inizia Nuova Partita' per cominciare.</p>
            </div>
          )}
        </div>
      </main>

      {flyingBalls.map(ball => (
        <FlyingBall
          key={ball.id}
          color={ball.color}
          startRect={ball.startRect}
          endRect={ball.endRect}
          ballSize={ball.startRect.width}
          onAnimationEnd={() => setFlyingBalls(prev => prev.filter(b => b.id !== ball.id))}
        />
      ))}

      {gameOver && winner && (
        <GameOverModal winner={winner} players={players} onNewGame={startNewGame} />
      )}
    </div>
  );
};

export default App;