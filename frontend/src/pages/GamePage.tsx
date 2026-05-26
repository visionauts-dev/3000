import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameBoard } from "../components/GameBoard";
import { useGameStore } from "../stores/gameStore";
import { getOrCreatePlayerId } from "../stores/lobbyStore";

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { setGameId, setPlayerId, match } = useGameStore();

  useEffect(() => {
    if (!gameId) { navigate("/"); return; }
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    setGameId(gameId);
  }, [gameId, navigate, setGameId, setPlayerId]);

  // Redirect to results when match finishes
  useEffect(() => {
    if (match?.finished && gameId) {
      navigate(`/results/${gameId}`);
    }
  }, [match?.finished, gameId, navigate]);

  if (!gameId) return null;

  return <GameBoard />;
};
