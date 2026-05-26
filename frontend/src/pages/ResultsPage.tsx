import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGameStore } from "../stores/gameStore";
import { ScoreEntry } from "../types";

export const ResultsPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { match, setGameId, setPlayerId } = useGameStore();
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    if (!gameId) { navigate("/"); return; }
    const saved = localStorage.getItem(`scores_${gameId}`);
    if (saved) {
      try { setScoreHistory(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [gameId, navigate]);

  if (!match) {
    return (
      <div className="bg-game-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Loading results...</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const winner = match.winningTeam;

  return (
    <div className="bg-game-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Winner banner */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl mb-2">🏆</div>
            <h1 className="text-4xl font-black text-yellow-400 mb-1">
              {winner ? `${winner.name} Wins!` : "Match Over!"}
            </h1>
            {winner && (
              <p className="text-2xl text-yellow-200 font-bold">{winner.totalScore} points</p>
            )}
          </motion.div>
        </div>

        {/* Team scores */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {match.teams.map((team, idx) => {
            const isWinner = team.id === winner?.id;
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`rounded-xl p-5 border-2 ${
                  isWinner
                    ? "bg-yellow-900/40 border-yellow-500"
                    : "bg-gray-800 border-gray-700"
                }`}
              >
                <h2 className={`text-xl font-bold mb-1 ${isWinner ? "text-yellow-400" : "text-white"}`}>
                  {team.name} {isWinner && "🏆"}
                </h2>
                <p className={`text-3xl font-black mb-3 ${isWinner ? "text-yellow-300" : "text-gray-300"}`}>
                  {team.totalScore}
                </p>
                <div className="space-y-1">
                  {team.players.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm text-gray-400">
                      <span>{p.username}</span>
                      <span>{p.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Round history */}
        {scoreHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6"
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Round History</h3>
            <div className="space-y-1">
              {scoreHistory.map((entry) => (
                <div key={`${entry.roundNumber}-${entry.teamId}`} className="flex justify-between text-sm">
                  <span className="text-gray-400">Round {entry.roundNumber}</span>
                  <span className="text-white">+{entry.totalScore}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setGameId(null);
              setPlayerId(getOrCreatePlayerId());
              navigate("/");
            }}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
          >
            Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem("game3000_playerId");
  if (!id) {
    id = "player-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("game3000_playerId", id);
  }
  return id;
}
