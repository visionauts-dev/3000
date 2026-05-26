import { create } from "zustand";
import {
  GameMatch,
  GameState,
  Player,
  Round,
  Card,
} from "../types";

export interface CardGroupDef {
  id: string;
  label: string;
  cardIds: string[];
  color: string;
}

const GROUP_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];
const GROUP_LABELS = ["Meld A", "Meld B", "Meld C", "Meld D", "Meld E"];

interface GameStore {
  gameId: string | null;
  match: GameMatch | null;
  currentState: GameState | null;
  currentRound: Round | null;
  currentPlayer: Player | null;
  playerId: string | null;
  playerTeamId: string | null;
  playerHand: Card[];
  selectedCards: Card[];
  cardGroups: CardGroupDef[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  setGameId: (id: string | null) => void;
  setMatch: (match: GameMatch) => void;
  setCurrentState: (state: GameState) => void;
  setCurrentRound: (round: Round) => void;
  setCurrentPlayer: (player: Player) => void;
  setPlayerId: (id: string) => void;
  setPlayerHand: (cards: Card[]) => void;
  toggleCardSelection: (card: Card) => void;
  clearSelection: () => void;
  createGroup: (cards: Card[]) => void;
  dissolveGroup: (groupId: string) => void;
  clearGroups: () => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateGameState: (match: GameMatch, state: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameId: null,
  match: null,
  currentState: null,
  currentRound: null,
  currentPlayer: null,
  playerId: null,
  playerTeamId: null,
  playerHand: [],
  selectedCards: [],
  cardGroups: [],
  isConnected: false,
  isLoading: false,
  error: null,

  setGameId: (id) => set({ gameId: id }),

  setMatch: (match) =>
    set({
      match,
      playerTeamId:
        match.players.find((p) => p.id === get().playerId)?.teamId ?? null,
    }),

  setCurrentState: (state) => set({ currentState: state }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerHand: (cards) => set({ playerHand: cards }),

  toggleCardSelection: (card) =>
    set((state) => ({
      selectedCards: state.selectedCards.some((c) => c.id === card.id)
        ? state.selectedCards.filter((c) => c.id !== card.id)
        : [...state.selectedCards, card],
    })),

  clearSelection: () => set({ selectedCards: [] }),

  createGroup: (cards) =>
    set((state) => {
      const existing = state.cardGroups;
      if (existing.length >= GROUP_COLORS.length) return state;
      // Remove these cards from any existing groups
      const cardIds = cards.map((c) => c.id);
      const cleaned = existing.map((g) => ({
        ...g,
        cardIds: g.cardIds.filter((id) => !cardIds.includes(id)),
      })).filter((g) => g.cardIds.length > 0);

      const idx = cleaned.length;
      const newGroup: CardGroupDef = {
        id: `group-${Date.now()}`,
        label: GROUP_LABELS[idx] ?? `Meld ${idx + 1}`,
        cardIds,
        color: GROUP_COLORS[idx] ?? GROUP_COLORS[0],
      };
      return { cardGroups: [...cleaned, newGroup], selectedCards: [] };
    }),

  dissolveGroup: (groupId) =>
    set((state) => ({
      cardGroups: state.cardGroups.filter((g) => g.id !== groupId),
    })),

  clearGroups: () => set({ cardGroups: [] }),

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateGameState: (match, state) => {
    const playerId = get().playerId;
    const player = match.players.find((p) => p.id === playerId);
    const newHand = player?.hand ?? [];
    // Remove dissolved groups (cards that left the hand)
    const handIds = new Set(newHand.map((c) => c.id));
    const validGroups = get().cardGroups
      .map((g) => ({ ...g, cardIds: g.cardIds.filter((id) => handIds.has(id)) }))
      .filter((g) => g.cardIds.length > 0);

    set({
      match,
      currentState: state,
      currentRound: match.currentRound,
      currentPlayer: match.currentRound?.currentPlayer ?? null,
      playerTeamId: player?.teamId ?? null,
      playerHand: newHand,
      cardGroups: validGroups,
      selectedCards: [],
    });
  },
}));
