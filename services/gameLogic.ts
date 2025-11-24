import { Grid, Cell, BallColor, Position } from '../types';
import { GRID_SIZE, COLORS, MIN_GROUP_SIZE } from '../constants';

export const initializeGrid = (): Grid => {
    const totalCells = GRID_SIZE * GRID_SIZE;
    const centerIndex = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2);

    // Create a flat list of all balls needed
    let ballPool: BallColor[] = [];
    const ballsPerColor = Math.floor((totalCells - 1) / COLORS.length);
    const extraBalls = (totalCells - 1) % COLORS.length;
    COLORS.forEach((color, index) => {
        const count = ballsPerColor + (index < extraBalls ? 1 : 0);
        for (let i = 0; i < count; i++) {
            ballPool.push(color);
        }
    });

    // Shuffle the pool
    for (let i = ballPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ballPool[i], ballPool[j]] = [ballPool[j], ballPool[i]];
    }

    // Place balls randomly into the grid
    let grid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (r * GRID_SIZE + c === centerIndex) {
                 grid[r][c] = { color: null, id: `${r}-${c}-center` };
                 continue;
            }
            const color = ballPool.pop();
            grid[r][c] = { color: color || null, id: `${r}-${c}-${color}` };
        }
    }

    // Fix-up phase: keep swapping until no adjacent colors are the same
    let attempts = 0;
    while (attempts < 5000) { // Safety break to prevent infinite loops
        const violations: Position[] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const color = grid[r][c]?.color;
                if (!color) continue;
                // Check right neighbor
                if (c < GRID_SIZE - 1 && grid[r][c + 1]?.color === color) {
                    violations.push({ row: r, col: c });
                }
                // Check bottom neighbor
                if (r < GRID_SIZE - 1 && grid[r + 1][c]?.color === color) {
                    violations.push({ row: r, col: c });
                }
            }
        }

        if (violations.length === 0) {
            break; // Board is valid
        }

        // Pick a random violation and swap it with a random, different-colored, non-violating cell
        const pos1 = violations[Math.floor(Math.random() * violations.length)];
        const r2 = Math.floor(Math.random() * GRID_SIZE);
        const c2 = Math.floor(Math.random() * GRID_SIZE);
        
        // Ensure we're not swapping with the center, itself, or a same-colored ball
        if ((grid[r2][c2]?.color === null) ||
            (pos1.row === r2 && pos1.col === c2) ||
            grid[pos1.row][pos1.col].color === grid[r2][c2].color) 
        {
            attempts++;
            continue;
        }
        
        // Swap
        const temp = grid[pos1.row][pos1.col];
        grid[pos1.row][pos1.col] = grid[r2][c2];
        grid[r2][c2] = temp;

        attempts++;
    }
    
    // Final pass to ensure unique IDs
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            grid[r][c].id = `${r}-${c}-${grid[r][c].color}-${Math.random()}`;
        }
    }

    return grid;
};


export const findMatches = (grid: Grid, movedPositions: Position[]): Position[] => {
  const matches: Position[] = [];
  const checked: Set<string> = new Set();

  for (const pos of movedPositions) {
      const key = `${pos.row},${pos.col}`;
      if (checked.has(key)) continue;

      const cell = grid[pos.row]?.[pos.col];
      if (!cell?.color) continue;

      const currentGroup: Position[] = [];
      const queue: Position[] = [{ row: pos.row, col: pos.col }];
      const groupVisited: Set<string> = new Set([key]);
      
      while (queue.length > 0) {
          const { row, col } = queue.shift()!;
          currentGroup.push({ row, col });
          checked.add(`${row},${col}`); 

          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of directions) {
              const newRow = row + dr;
              const newCol = col + dc;
              const newKey = `${newRow},${newCol}`;

              if (
                  newRow >= 0 && newRow < GRID_SIZE &&
                  newCol >= 0 && newCol < GRID_SIZE &&
                  !groupVisited.has(newKey) &&
                  grid[newRow][newCol].color === cell.color
              ) {
                  groupVisited.add(newKey);
                  queue.push({ row: newRow, col: newCol });
              }
          }
      }

      if (currentGroup.length >= MIN_GROUP_SIZE) {
          matches.push(...currentGroup);
      }
  }
  
  // Return unique positions
  const uniqueMatches = new Map<string, Position>();
  matches.forEach(p => uniqueMatches.set(`${p.row},${p.col}`, p));
  return Array.from(uniqueMatches.values());
};

export const isMovePossible = (grid: Grid): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            // A move is possible only if there's a ball next to an empty space.
            // We iterate through empty cells and check their neighbors.
            if (grid[r][c].color === null) {
                const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (const [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    // Check if neighbor is within bounds and has a ball
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc].color) {
                        return true; // Found a ball that can be pushed into this empty cell.
                    }
                }
            }
        }
    }
    // If no empty cell has a ball next to it, no moves are possible.
    return false;
};