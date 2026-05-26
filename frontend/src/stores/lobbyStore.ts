import { create } from "zustand";
import { LobbyRoom, MatchType } from "../types";

interface LobbyStore {
  lobby: LobbyRoom | null;
  playerId: string | null;
  username: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  setLobby: (lobby: LobbyRoom | null) => void;
  setPlayerId: (id: string) => void;
  setUsername: (name: string) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobby: null,
  playerId: null,
  username: null,
  isConnected: false,
  isLoading: false,
  error: null,

  setLobby: (lobby) => set({ lobby }),
  setPlayerId: (id) => set({ playerId: id }),
  setUsername: (name) => set({ username: name }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      lobby: null,
      isLoading: false,
      error: null,
    }),
}));

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem("game3000_playerId");
  if (!id) {
    id = "player-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("game3000_playerId", id);
  }
  return id;
}

export function getMatchTypeLabel(type: MatchType): string {
  return type === MatchType.TWO_VS_TWO ? "2v2 (4 players)" : "3v3 (6 players)";
}
