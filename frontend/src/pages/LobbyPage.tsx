import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { LobbyRoom, MatchType } from "../types";
import { useLobbyStore, getOrCreatePlayerId } from "../stores/lobbyStore";

const SOCKET_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || "http://localhost:3001";
const ioOptions: any = { reconnection: true, reconnectionDelay: 1000 };
if (typeof SOCKET_URL === "string" && (SOCKET_URL.startsWith("ws:") || SOCKET_URL.startsWith("wss:"))) {
  ioOptions.transports = ["websocket"];
}

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { lobby, playerId, username, isLoading, error, setLobby, setPlayerId, setUsername, setLoading, setError } =
    useLobbyStore();

  const socketRef = useRef<Socket | null>(null);
  const [view, setView] = useState<"home" | "create" | "join" | "waiting">("home");
  const [inputUsername, setInputUsername] = useState(username || "");
  const [matchType, setMatchType] = useState<MatchType>(MatchType.TWO_VS_TWO);
  const [roomCode, setRoomCode] = useState("");

  // Restore player id on mount
  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    const saved = localStorage.getItem("game3000_username");
    if (saved) {
      setInputUsername(saved);
      setUsername(saved);
    }
  }, [setPlayerId, setUsername]);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const socket = io(SOCKET_URL, ioOptions);

    socket.on("connect", () => setError(null));
    socket.on("disconnect", () => setError("Disconnected from server"));

    socket.on("LOBBY_CREATED", (data: { lobby: LobbyRoom }) => {
      setLobby(data.lobby);
      setView("waiting");
      setLoading(false);
    });

    socket.on("LOBBY_UPDATED", (data: { lobby: LobbyRoom }) => {
      setLobby(data.lobby);
      setLoading(false);
    });

    socket.on("GAME_STARTED", (data: { gameId: string }) => {
      socketRef.current?.disconnect();
      navigate(`/game/${data.gameId}`);
    });

    socket.on("ERROR", (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    });

    socketRef.current = socket;
    return socket;
  }, [navigate, setError, setLobby, setLoading]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const saveUsername = (name: string) => {
    setInputUsername(name);
    setUsername(name);
    localStorage.setItem("game3000_username", name);
  };

  const handleCreate = () => {
    if (!inputUsername.trim()) { setError("Please enter a username"); return; }
    const name = inputUsername.trim();
    saveUsername(name);
    setLoading(true);
    setError(null);
    const socket = connectSocket();
    socket.emit("CREATE_LOBBY", { matchType, playerId, username: name });
  };

  const handleJoin = () => {
    if (!inputUsername.trim()) { setError("Please enter a username"); return; }
    if (!roomCode.trim()) { setError("Please enter a room code"); return; }
    const name = inputUsername.trim();
    saveUsername(name);
    setLoading(true);
    setError(null);
    const socket = connectSocket();
    socket.emit("JOIN_LOBBY", { code: roomCode.trim().toUpperCase(), playerId, username: name });
    setView("waiting");
  };

  const handleLeave = () => {
    if (lobby) {
      socketRef.current?.emit("LEAVE_LOBBY", { code: lobby.code, playerId });
    }
    setLobby(null);
    setView("home");
  };

  const handleStartGame = () => {
    if (!lobby) return;
    socketRef.current?.emit("START_GAME", { code: lobby.code, playerId });
  };

  const maxPlayers = lobby?.matchType === MatchType.TWO_VS_TWO ? 4 : 6;

  // Waiting room view
  if (view === "waiting" && lobby) {
    const isHost = lobby.hostId === playerId;
    const canStart = isHost && lobby.players.length === maxPlayers;

    return (
      <div className="bg-game-bg min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-purple-400 mb-1">Lobby</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-400 text-sm">Room Code:</span>
            <span className="font-mono text-2xl font-bold text-yellow-400 tracking-widest">{lobby.code}</span>
          </div>

          <div className="mb-4 text-sm text-gray-400">
            {lobby.matchType === MatchType.TWO_VS_TWO ? "2v2 — 4 players" : "3v3 — 6 players"} ·{" "}
            <span className={lobby.players.length === maxPlayers ? "text-green-400" : "text-yellow-400"}>
              {lobby.players.length}/{maxPlayers} players
            </span>
          </div>

          <div className="space-y-2 mb-6">
            {lobby.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  p.id === playerId ? "bg-blue-900 border border-blue-600" : "bg-gray-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="font-medium text-white">{p.username}</span>
                {p.isHost && (
                  <span className="ml-auto text-xs text-yellow-400 font-semibold">HOST</span>
                )}
                {p.id === playerId && !p.isHost && (
                  <span className="ml-auto text-xs text-blue-400">You</span>
                )}
              </div>
            ))}
            {Array.from({ length: maxPlayers - lobby.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="px-4 py-3 rounded-lg bg-gray-800/50 border border-dashed border-gray-700">
                <span className="text-gray-600 text-sm">Waiting for player...</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {isHost && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartGame}
                disabled={!canStart || isLoading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors"
              >
                {canStart ? "Start Game" : `Need ${maxPlayers - lobby.players.length} more`}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLeave}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Leave
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Home / Create / Join forms
  return (
    <div className="bg-game-bg min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            3000
          </h1>
          <p className="text-gray-400 mt-2">Professional Team Strategy Card Game</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 text-red-200 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {view === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setView("create")}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-colors"
            >
              Create Game
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setView("join")}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-colors"
            >
              Join Game
            </motion.button>
          </motion.div>
        )}

        {view === "create" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Create Lobby</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Match Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value={MatchType.TWO_VS_TWO}>2v2 (4 players)</option>
                <option value={MatchType.THREE_VS_THREE}>3v3 (6 players)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCreate}
                disabled={isLoading}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                {isLoading ? "Creating..." : "Create Lobby"}
              </motion.button>
              <button
                onClick={() => { setView("home"); setError(null); }}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}

        {view === "join" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Join Lobby</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Room Code</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-center tracking-widest text-xl"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                {isLoading ? "Joining..." : "Join Lobby"}
              </motion.button>
              <button
                onClick={() => { setView("home"); setError(null); }}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
