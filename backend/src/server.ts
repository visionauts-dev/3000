import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GameEngine } from "./game/engine/GameEngine";
import { MatchType, DrawChoice, Player } from "./types";
import { store, LobbyRoom } from "./store/InMemoryStore";

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

const TURN_TIMEOUT_MS = parseInt(process.env.TURN_TIMEOUT_SECONDS || "30") * 1000;

app.use(cors());
app.use(express.json());

// ============ REST ENDPOINTS ============

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date(), stats: store.getStats() });
});

app.post("/api/lobby", (req: Request, res: Response) => {
  const { matchType, hostId, hostUsername } = req.body;
  if (!matchType || !hostId || !hostUsername) {
    return res.status(400).json({ error: "matchType, hostId and hostUsername are required" });
  }

  const type = matchType === "3v3" ? MatchType.THREE_VS_THREE : MatchType.TWO_VS_TWO;
  const lobby = store.createLobby(hostId, "", hostUsername, type);

  store.registerPlayer({ id: hostId, username: hostUsername, socketId: "", lobbyCode: lobby.code });

  return res.json({ lobby: serializeLobby(lobby) });
});

app.get("/api/lobby/:code", (req: Request, res: Response) => {
  const lobby = store.getLobby(req.params.code);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  return res.json({ lobby: serializeLobby(lobby) });
});

app.get("/api/games/:gameId", (req: Request, res: Response) => {
  const engine = store.getGame(req.params.gameId);
  if (!engine) return res.status(404).json({ error: "Game not found" });
  return res.json({ match: engine.getMatch() });
});

// ============ WEBSOCKET HANDLERS ============

function serializeLobby(lobby: LobbyRoom) {
  return {
    id: lobby.id,
    code: lobby.code,
    hostId: lobby.hostId,
    matchType: lobby.matchType,
    players: lobby.players.map((p) => ({
      id: p.id,
      username: p.username,
      isReady: p.isReady,
      isHost: p.id === lobby.hostId,
    })),
    state: lobby.state,
    createdAt: lobby.createdAt,
    gameId: lobby.gameId,
  };
}

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ---- LOBBY EVENTS ----

  socket.on(
    "CREATE_LOBBY",
    (data: { matchType: string; playerId: string; username: string }) => {
      const { matchType, playerId, username } = data;
      const type = matchType === "3v3" ? MatchType.THREE_VS_THREE : MatchType.TWO_VS_TWO;
      const lobby = store.createLobby(playerId, socket.id, username, type);

      store.registerPlayer({
        id: playerId,
        username,
        socketId: socket.id,
        lobbyCode: lobby.code,
      });

      socket.join(`lobby:${lobby.code}`);
      socket.emit("LOBBY_CREATED", { lobby: serializeLobby(lobby) });
    }
  );

  socket.on(
    "JOIN_LOBBY",
    (data: { code: string; playerId: string; username: string }) => {
      const { code, playerId, username } = data;
      const lobby = store.joinLobby(code, {
        id: playerId,
        username,
        socketId: socket.id,
        isReady: false,
      });

      if (!lobby) {
        socket.emit("ERROR", { message: "Lobby not found, full, or already started" });
        return;
      }

      store.registerPlayer({
        id: playerId,
        username,
        socketId: socket.id,
        lobbyCode: code,
      });

      socket.join(`lobby:${code}`);
      io.to(`lobby:${code}`).emit("LOBBY_UPDATED", { lobby: serializeLobby(lobby) });
    }
  );

  socket.on("LEAVE_LOBBY", (data: { code: string; playerId: string }) => {
    const { code, playerId } = data;
    const lobby = store.leaveLobby(code, playerId);
    socket.leave(`lobby:${code}`);

    if (lobby) {
      io.to(`lobby:${code}`).emit("LOBBY_UPDATED", { lobby: serializeLobby(lobby) });
    }
  });

  socket.on("START_GAME", (data: { code: string; playerId: string }) => {
    const { code, playerId } = data;
    const lobby = store.getLobby(code);

    if (!lobby) {
      socket.emit("ERROR", { message: "Lobby not found" });
      return;
    }

    if (lobby.hostId !== playerId) {
      socket.emit("ERROR", { message: "Only the host can start the game" });
      return;
    }

    const requiredPlayers = lobby.matchType === MatchType.TWO_VS_TWO ? 4 : 6;
    if (lobby.players.length < requiredPlayers) {
      socket.emit("ERROR", {
        message: `Need ${requiredPlayers} players to start (have ${lobby.players.length})`,
      });
      return;
    }

    // Build Player objects
    const players: Player[] = lobby.players.map((lp, i) => ({
      id: lp.id,
      username: lp.username,
      teamId: "",
      hand: [],
      reserveHand: [],
      score: 0,
      finished: false,
      isConnected: true,
      seatPosition: i,
    }));

    const engine = new GameEngine(lobby.matchType, players);
    engine.startGame();

    const gameId = engine.getMatch().id;
    store.addGame(gameId, engine);
    lobby.state = "STARTED";
    lobby.gameId = gameId;

    // Wire up turn timeout
    engine.setTurnTimeoutHandler((timedOutPlayerId) => {
      io.to(`game:${gameId}`).emit("TURN_TIMEOUT", {
        playerId: timedOutPlayerId,
        currentPlayer: engine.getCurrentPlayer(),
        round: engine.getCurrentRound(),
      });
      broadcastGameState(gameId, engine);
      engine.startTurnTimer(TURN_TIMEOUT_MS);
    });

    io.to(`lobby:${code}`).emit("GAME_STARTED", {
      gameId,
      match: engine.getMatch(),
    });

    engine.startTurnTimer(TURN_TIMEOUT_MS);
    console.log(`[Game] Started game ${gameId} from lobby ${code}`);
  });

  // ---- GAME EVENTS ----

  socket.on("JOIN_GAME", (data: { gameId: string; playerId: string }) => {
    const { gameId, playerId } = data;
    const engine = store.getGame(gameId);

    if (!engine) {
      socket.emit("ERROR", { message: "Game not found" });
      return;
    }

    socket.join(`game:${gameId}`);
    socket.data.gameId = gameId;
    socket.data.playerId = playerId;

    // Mark player reconnected
    const player = engine.getPlayers().find((p) => p.id === playerId);
    if (player) player.isConnected = true;

    store.updatePlayerSocket(playerId, socket.id);

    socket.emit("GAME_STATE_UPDATE", {
      match: engine.getMatch(),
      state: engine.getState(),
      hasDrawn: engine.hasTurnDrawn(),
    });
  });

  socket.on(
    "DRAW_CARD",
    (data: { gameId: string; playerId: string; choice: string }) => {
      const { gameId, playerId, choice } = data;
      const engine = store.getGame(gameId);
      if (!engine) { socket.emit("ERROR", { message: "Game not found" }); return; }

      try {
        const drawChoice =
          choice === "DRAW_FROM_DECK" ? DrawChoice.DRAW_FROM_DECK : DrawChoice.TAKE_DISCARD_PILE;
        const cards = engine.drawCard(playerId, drawChoice);

        io.to(`game:${gameId}`).emit("CARDS_DRAWN", {
          playerId,
          cards,
          round: engine.getCurrentRound(),
          hasDrawn: engine.hasTurnDrawn(),
        });
        broadcastGameState(gameId, engine);
      } catch (err) {
        socket.emit("ERROR", { message: (err as Error).message });
      }
    }
  );

  socket.on(
    "PLACE_MELD",
    (data: { gameId: string; playerId: string; cards: unknown[]; teamId: string }) => {
      const { gameId, playerId, cards, teamId } = data;
      const engine = store.getGame(gameId);
      if (!engine) { socket.emit("ERROR", { message: "Game not found" }); return; }

      try {
        const meld = engine.placeMeld(playerId, cards as never, teamId);
        if (meld) {
          io.to(`game:${gameId}`).emit("MELD_PLACED", { meld, teamId, playerId });
          broadcastGameState(gameId, engine);
        } else {
          socket.emit("ERROR", { message: "Invalid meld" });
        }
      } catch (err) {
        socket.emit("ERROR", { message: (err as Error).message });
      }
    }
  );

  socket.on(
    "EXTEND_MELD",
    (data: { gameId: string; playerId: string; meldId: string; cards: unknown[] }) => {
      const { gameId, playerId, meldId, cards } = data;
      const engine = store.getGame(gameId);
      if (!engine) { socket.emit("ERROR", { message: "Game not found" }); return; }

      try {
        const ok = engine.extendMeld(playerId, meldId, cards as never);
        if (ok) {
          io.to(`game:${gameId}`).emit("MELD_EXTENDED", { meldId, cards, playerId });
          broadcastGameState(gameId, engine);
        } else {
          socket.emit("ERROR", { message: "Cannot extend meld with those cards" });
        }
      } catch (err) {
        socket.emit("ERROR", { message: (err as Error).message });
      }
    }
  );

  socket.on(
    "DISCARD_CARD",
    (data: { gameId: string; playerId: string; cardId: string }) => {
      const { gameId, playerId, cardId } = data;
      const engine = store.getGame(gameId);
      if (!engine) { socket.emit("ERROR", { message: "Game not found" }); return; }

      try {
        const player = engine.getPlayers().find((p) => p.id === playerId);
        const card = player?.hand.find((c) => c.id === cardId);
        if (!card) { socket.emit("ERROR", { message: "Card not found in hand" }); return; }

        engine.discardCard(playerId, card);

        io.to(`game:${gameId}`).emit("CARD_DISCARDED", {
          playerId,
          card,
          currentPlayer: engine.getCurrentPlayer(),
          round: engine.getCurrentRound(),
        });

        broadcastGameState(gameId, engine);

        if (!engine.getMatch().finished) {
          engine.startTurnTimer(TURN_TIMEOUT_MS);
        }
      } catch (err) {
        socket.emit("ERROR", { message: (err as Error).message });
      }
    }
  );

  socket.on("FINISH", (data: { gameId: string; playerId: string }) => {
    const { gameId, playerId } = data;
    const engine = store.getGame(gameId);
    if (!engine) { socket.emit("ERROR", { message: "Game not found" }); return; }

    try {
      const success = engine.finishHand(playerId);
      if (success) {
        io.to(`game:${gameId}`).emit("PLAYER_FINISHED", {
          playerId,
          round: engine.getCurrentRound(),
        });

        const match = engine.getMatch();
        if (match.finished) {
          engine.clearTurnTimer();
          io.to(`game:${gameId}`).emit("MATCH_ENDED", {
            match,
            winner: match.winningTeam,
          });
        } else {
          broadcastGameState(gameId, engine);
          engine.startTurnTimer(TURN_TIMEOUT_MS);
        }
      } else {
        socket.emit("ERROR", { message: "Cannot finish — hand not empty" });
      }
    } catch (err) {
      socket.emit("ERROR", { message: (err as Error).message });
    }
  });

  socket.on("disconnect", () => {
    const session = store.getPlayerBySocket(socket.id);
    if (session) {
      store.removePlayerSocket(socket.id);

      // Mark player disconnected in active game
      if (session.gameId) {
        const engine = store.getGame(session.gameId);
        if (engine) {
          const player = engine.getPlayers().find((p) => p.id === session.id);
          if (player) player.isConnected = false;
          io.to(`game:${session.gameId}`).emit("PLAYER_DISCONNECTED", {
            playerId: session.id,
          });
        }
      }
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

function broadcastGameState(gameId: string, engine: GameEngine): void {
  io.to(`game:${gameId}`).emit("GAME_STATE_UPDATE", {
    match: engine.getMatch(),
    state: engine.getState(),
    hasDrawn: engine.hasTurnDrawn(),
  });
}

// ============ SERVER START ============

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Game 3000 server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`CORS origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});
