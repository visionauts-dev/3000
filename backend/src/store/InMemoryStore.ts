import { MatchType } from "../types";
import { GameEngine } from "../game/engine/GameEngine";
import { v4 as uuidv4 } from "uuid";

export interface LobbyPlayer {
  id: string;
  username: string;
  socketId: string;
  isReady: boolean;
}

export interface LobbyRoom {
  id: string;
  code: string;
  hostId: string;
  hostSocketId: string;
  matchType: MatchType;
  players: LobbyPlayer[];
  state: "WAITING" | "STARTING" | "STARTED";
  createdAt: Date;
  gameId?: string;
}

export interface PlayerSession {
  id: string;
  username: string;
  socketId: string;
  gameId?: string;
  lobbyCode?: string;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class InMemoryStore {
  private games = new Map<string, GameEngine>();
  private lobbies = new Map<string, LobbyRoom>();
  private players = new Map<string, PlayerSession>();
  private socketToPlayer = new Map<string, string>();

  // ---- Game methods ----

  addGame(gameId: string, engine: GameEngine): void {
    this.games.set(gameId, engine);
  }

  getGame(gameId: string): GameEngine | undefined {
    return this.games.get(gameId);
  }

  removeGame(gameId: string): void {
    this.games.delete(gameId);
  }

  // ---- Lobby methods ----

  createLobby(
    hostId: string,
    hostSocketId: string,
    hostUsername: string,
    matchType: MatchType
  ): LobbyRoom {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.lobbies.has(code));

    const lobby: LobbyRoom = {
      id: uuidv4(),
      code,
      hostId,
      hostSocketId,
      matchType,
      players: [{ id: hostId, username: hostUsername, socketId: hostSocketId, isReady: false }],
      state: "WAITING",
      createdAt: new Date(),
    };

    this.lobbies.set(code, lobby);
    return lobby;
  }

  getLobby(code: string): LobbyRoom | undefined {
    return this.lobbies.get(code);
  }

  removeLobby(code: string): void {
    this.lobbies.delete(code);
  }

  joinLobby(code: string, player: LobbyPlayer): LobbyRoom | null {
    const lobby = this.lobbies.get(code);
    if (!lobby || lobby.state !== "WAITING") return null;

    const maxPlayers = lobby.matchType === MatchType.TWO_VS_TWO ? 4 : 6;
    if (lobby.players.length >= maxPlayers) return null;

    const existing = lobby.players.find((p) => p.id === player.id);
    if (existing) {
      existing.socketId = player.socketId;
    } else {
      lobby.players.push(player);
    }

    return lobby;
  }

  leaveLobby(code: string, playerId: string): LobbyRoom | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    if (lobby.players.length === 0) {
      this.lobbies.delete(code);
      return null;
    }

    if (lobby.hostId === playerId) {
      lobby.hostId = lobby.players[0].id;
      lobby.hostSocketId = lobby.players[0].socketId;
    }

    return lobby;
  }

  // ---- Player session methods ----

  registerPlayer(session: PlayerSession): void {
    this.players.set(session.id, session);
    this.socketToPlayer.set(session.socketId, session.id);
  }

  getPlayer(playerId: string): PlayerSession | undefined {
    return this.players.get(playerId);
  }

  getPlayerBySocket(socketId: string): PlayerSession | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    return playerId ? this.players.get(playerId) : undefined;
  }

  updatePlayerSocket(playerId: string, newSocketId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.socketToPlayer.delete(player.socketId);
      player.socketId = newSocketId;
      this.socketToPlayer.set(newSocketId, playerId);
    }
  }

  removePlayerSocket(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (playerId) {
      this.socketToPlayer.delete(socketId);
      const player = this.players.get(playerId);
      if (player) player.socketId = "";
    }
  }

  getStats(): { games: number; lobbies: number; players: number } {
    return {
      games: this.games.size,
      lobbies: this.lobbies.size,
      players: this.players.size,
    };
  }
}

export const store = new InMemoryStore();
