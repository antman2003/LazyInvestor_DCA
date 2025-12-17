
export interface MarketData {
  Date_Str: string;
  Price: number;
}

export interface TurnHistory {
  step: number;
  gameYear: number;
  realDate: string;
  userTotal: number;
  benchTotal: number;
  price: number;
  userCash: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export type GameEndReason = 'completed' | 'surrendered';

export enum MarketIndex {
  SPY = 'SPY500',
  NASDAQ = 'NASDAQ'
}

export interface DialogueState {
  textParts: { text: string; className?: string }[];
}

export interface GameState {
  status: GameStatus;
  currentStep: number;
  startOffset: number;
  userCash: number;
  userShares: number;
  botShares: number;
  history: TurnHistory[];
  selectedData: MarketData[];
  gameEndReason: GameEndReason;
}
