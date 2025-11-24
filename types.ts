export enum BallColor {
  Red = 'Red',
  Green = 'Green',
  Blue = 'Blue',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange',
}

export type Cell = {
  color: BallColor | null;
  id: string;
};

export type Grid = Cell[][];

export type Position = {
  row: number;
  col: number;
};

export type Player = {
  id: number;
  score: number;
  name: string;
};