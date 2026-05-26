import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";
import { GameMatch, GameState, Card } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const useWebSocket = (gameId: string | null, playerId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const { updateGameState, setConnected, setError, setPlayerHand } = useGameStore();

  const connect = useCallback(() => {
    if (!gameId || !playerId) return;
    if (socketRef.current?.connected) return;

    const socket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("JOIN_GAME", { gameId, playerId });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "GAME_STATE_UPDATE",
      (data: { match: GameMatch; state: GameState; hasDrawn?: boolean }) => {
        updateGameState(data.match, data.state);
        // Sync player's own hand
        const player = data.match.players.find((p) => p.id === playerId);
        if (player) setPlayerHand(player.hand);
      }
    );

    socket.on("CARDS_DRAWN", (data: { match?: GameMatch; state?: GameState }) => {
      if (data.match && data.state) updateGameState(data.match, data.state);
    });

    socket.on("CARD_DISCARDED", (data: { match?: GameMatch; state?: GameState }) => {
      if (data.match && data.state) updateGameState(data.match, data.state);
    });

    socket.on("MELD_PLACED", () => { /* state update comes via GAME_STATE_UPDATE */ });
    socket.on("MELD_EXTENDED", () => { /* state update comes via GAME_STATE_UPDATE */ });
    socket.on("PLAYER_FINISHED", () => { /* state update comes via GAME_STATE_UPDATE */ });

    socket.on(
      "ROUND_ENDED",
      (data: { match?: GameMatch; state?: GameState }) => {
        if (data.match && data.state) updateGameState(data.match, data.state);
      }
    );

    socket.on("MATCH_ENDED", (data: { match: GameMatch }) => {
      updateGameState(data.match, GameState.MATCH_END);
    });

    socket.on("TURN_TIMEOUT", (data: { match?: GameMatch; state?: GameState }) => {
      if (data.match && data.state) updateGameState(data.match, data.state);
    });

    socket.on("PLAYER_DISCONNECTED", () => { /* optional: show indicator */ });

    socket.on("ERROR", (data: { message: string }) => {
      setError(data.message);
      // Auto-clear after 4s
      setTimeout(() => setError(null), 4000);
    });

    socketRef.current = socket;
  }, [gameId, playerId, updateGameState, setConnected, setError, setPlayerHand]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const drawCard = useCallback(
    (choice: "DRAW_FROM_DECK" | "TAKE_DISCARD_PILE") => {
      socketRef.current?.emit("DRAW_CARD", { gameId, playerId, choice });
    },
    [gameId, playerId]
  );

  const placeMeld = useCallback(
    (cards: Card[], teamId: string) => {
      socketRef.current?.emit("PLACE_MELD", { gameId, playerId, cards, teamId });
    },
    [gameId, playerId]
  );

  const extendMeld = useCallback(
    (meldId: string, cards: Card[]) => {
      socketRef.current?.emit("EXTEND_MELD", { gameId, playerId, meldId, cards });
    },
    [gameId, playerId]
  );

  const discardCard = useCallback(
    (cardId: string) => {
      socketRef.current?.emit("DISCARD_CARD", { gameId, playerId, cardId });
    },
    [gameId, playerId]
  );

  const finishRound = useCallback(() => {
    socketRef.current?.emit("FINISH", { gameId, playerId });
  }, [gameId, playerId]);

  useEffect(() => {
    if (gameId && playerId) connect();
    return disconnect;
  }, [gameId, playerId, connect, disconnect]);

  return {
    isConnected: socketRef.current?.connected || false,
    drawCard,
    placeMeld,
    extendMeld,
    discardCard,
    finishRound,
  };
};
