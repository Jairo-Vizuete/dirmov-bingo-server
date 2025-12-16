export type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

export type BingoGameState = 'waiting' | 'playing' | 'finished';

export interface BingoNumber {
  letter: BingoLetter;
  value: number;
  drawnAt: Date;
}

export interface BingoCard {
  id: string;
  numbers: (number | null)[][];
  marked: boolean[][];
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  secret: string;
  card: BingoCard;
}

export interface Room {
  id: string;
  hostId: string | null;
  hostName: string | null;
  hostSecret: string | null;
  players: Player[];
  drawnNumbers: BingoNumber[];
  state: BingoGameState;
  selectedLetter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicPlayerView {
  id: string;
  name: string;
}

export interface PublicRoomState {
  id: string;
  hostName: string | null;
  players: PublicPlayerView[];
  state: BingoGameState;
  drawnNumbers: BingoNumber[];
  selectedLetter: string | null;
  winnerId?: string;
}


