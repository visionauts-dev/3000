// Game 3000 - Shared Types

// ============ ENUMS ============
export enum Suit {
  SPADES = "SPADES",
  HEARTS = "HEARTS",
  DIAMONDS = "DIAMONDS",
  CLUBS = "CLUBS",
}

export enum Rank {
  ACE = "ACE",
  KING = "KING",
  QUEEN = "QUEEN",
  JACK = "JACK",
  TEN = "TEN",
  NINE = "NINE",
  EIGHT = "EIGHT",
  SEVEN = "SEVEN",
  SIX = "SIX",
  FIVE = "FIVE",
  FOUR = "FOUR",
  THREE = "THREE",
  TWO = "TWO",
}

export enum GameState {
  LOBBY = "LOBBY",
  TEAM_SELECTION = "TEAM_SELECTION",
  SEATING = "SEATING",
  DEALING = "DEALING",
  ROUND_START = "ROUND_START",
  PLAYER_TURN = "PLAYER_TURN",
  DRAW_PHASE = "DRAW_PHASE",
  MELD_PHASE = "MELD_PHASE",
  DISCARD_PHASE = "DISCARD_PHASE",
  ROUND_END = "ROUND_END",
  MATCH_END = "MATCH_END",
}

export enum MatchType {
  TWO_VS_TWO = "2v2",
  THREE_VS_THREE = "3v3",
}

export enum DrawChoice {
  DRAW_FROM_DECK = "DRAW_FROM_DECK",
  TAKE_DISCARD_PILE = "TAKE_DISCARD_PILE",
}

// ============ TYPES ============
export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  isJoker?: boolean; // For printed jokers
  isPermanentJoker?: boolean; // For 2s that act as jokers
}

export interface Player {
  id: string;
  username: string;
  teamId: string;
  hand: Card[];
  reserveHand: Card[];
  score: number;
  finished: boolean;
  isConnected: boolean;
  seatPosition?: number;
  isDealer?: boolean;
  hasFirstTurn?: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  melds: Meld[];
  totalScore: number;
  hasStarted: boolean;
}

export interface Meld {
  id: string;
  teamId: string;
  cards: Card[];
  type: "SEQUENCE" | "SET";
  isValid: boolean;
  isPureSequence: boolean;
  jokerCount: number;
  joinedCards?: Card[]; // For tracking extensions
}

export interface Sequence extends Meld {
  type: "SEQUENCE";
  isPureSequence: boolean; // true if no joker
}

export interface Set extends Meld {
  type: "SET";
}

export interface DiscardPile {
  cards: Card[];
}

export interface DrawPile {
  cards: Card[];
}

export interface Round {
  id: string;
  roundNumber: number;
  startTime: Date;
  endTime?: Date;
  teams: Team[];
  currentPlayer: Player;
  currentTurnNumber: number;
  discardPile: DiscardPile;
  drawPile: DrawPile;
  finished: boolean;
  finishingPlayer?: Player;
}

export interface GameMatch {
  id: string;
  type: MatchType;
  state: GameState;
  teams: Team[];
  players: Player[];
  rounds: Round[];
  currentRound: Round;
  winningTeam?: Team;
  matchStartTime: Date;
  matchEndTime?: Date;
  finished: boolean;
}

export interface TurnAction {
  playerId: string;
  type: "DRAW" | "MELD" | "DISCARD" | "FINISH";
  data?: any;
  timestamp: Date;
}

export interface ScoreEntry {
  roundNumber: number;
  teamId: string;
  baseScore: number;
  bonuses: ScoreBonus[];
  penalties: ScorePenalty[];
  totalScore: number;
}

export interface ScoreBonus {
  type: "FIRST_HAND" | "RESERVE_HAND" | "LONG_MELD_JOKER" | "LONG_MELD_PURE" | "TEAM_FINISH";
  points: number;
}

export interface ScorePenalty {
  playerId: string;
  remainingCards: Card[];
  penaltyPoints: number;
}

// ============ WEBSOCKET MESSAGES ============
export interface GameMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface PlayerJoinedMessage extends GameMessage {
  type: "PLAYER_JOINED";
  payload: Player;
}

export interface GameStateUpdateMessage extends GameMessage {
  type: "GAME_STATE_UPDATE";
  payload: {
    state: GameState;
    match: GameMatch;
  };
}

export interface TurnStartedMessage extends GameMessage {
  type: "TURN_STARTED";
  payload: {
    player: Player;
    round: Round;
  };
}

export interface MeldPlacedMessage extends GameMessage {
  type: "MELD_PLACED";
  payload: {
    meld: Meld;
    teamId: string;
    playerId: string;
  };
}

export interface RoundEndedMessage extends GameMessage {
  type: "ROUND_ENDED";
  payload: {
    round: Round;
    scores: ScoreEntry[];
  };
}

export interface MatchEndedMessage extends GameMessage {
  type: "MATCH_ENDED";
  payload: {
    match: GameMatch;
    winner: Team;
  };
}
