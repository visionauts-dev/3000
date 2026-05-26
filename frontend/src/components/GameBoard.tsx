import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, CardGroupDef } from "../stores/gameStore";
import { CardHand, Card, MeldDisplay, CardBack } from "./Card";
import { ScoreBoard } from "./ScoreBoard";
import { TurnTimer } from "./TurnTimer";
import { useWebSocket } from "../hooks/useWebSocket";
import { GameState, Card as CardType } from "../types";

// ─────────────────────── Group Staging Area ──────────────────────────────────

interface StagingAreaProps {
  groups: CardGroupDef[];
  playerHand: CardType[];
  onPlaceMeld: (cardIds: string[]) => void;
  onDissolve: (groupId: string) => void;
  disabled: boolean;
}

const StagingArea: React.FC<StagingAreaProps> = ({
  groups,
  playerHand,
  onPlaceMeld,
  onDissolve,
  disabled,
}) => {
  if (groups.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-black/30 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Melds</span>
          <span className="text-xs text-gray-600">— click "Place" to put a group on the table</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {groups.map((group) => {
            const groupCards = group.cardIds
              .map((id) => playerHand.find((c) => c.id === id))
              .filter((c): c is CardType => c !== undefined);

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 6 }}
                className="rounded-xl p-3 border flex flex-col gap-2"
                style={{
                  borderColor: `${group.color}50`,
                  background: `${group.color}10`,
                  boxShadow: `0 0 12px ${group.color}15`,
                }}
              >
                {/* Group header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: group.color }}
                    />
                    <span className="text-xs font-bold text-white/90">{group.label}</span>
                    <span className="text-[10px] text-gray-500">({groupCards.length} cards)</span>
                  </div>
                  <button
                    onClick={() => onDissolve(group.id)}
                    className="text-gray-500 hover:text-red-400 text-[11px] font-semibold transition-colors"
                    title="Dissolve group"
                  >
                    ✕
                  </button>
                </div>

                {/* Cards preview */}
                <div className="flex gap-1">
                  {groupCards.map((c) => (
                    <Card key={c.id} card={c} size="sm" />
                  ))}
                </div>

                {/* Actions */}
                <motion.button
                  whileHover={!disabled ? { scale: 1.03 } : {}}
                  whileTap={!disabled ? { scale: 0.97 } : {}}
                  onClick={() => !disabled && onPlaceMeld(group.cardIds)}
                  disabled={disabled || groupCards.length < 3}
                  className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: disabled || groupCards.length < 3 ? "#374151" : group.color }}
                >
                  Place as Meld
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────── GameBoard ──────────────────────────────────

export const GameBoard: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameId,
    playerId,
    match,
    currentRound,
    currentPlayer,
    playerHand,
    selectedCards,
    cardGroups,
    isConnected,
    toggleCardSelection,
    clearSelection,
    createGroup,
    dissolveGroup,
    error,
    setError,
  } = useGameStore();

  const { drawCard, placeMeld, extendMeld, discardCard, finishRound } = useWebSocket(
    gameId,
    playerId
  );

  const [extendMeldId, setExtendMeldId] = useState<string | null>(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

  const isCurrentPlayer = currentPlayer?.id === playerId;
  const playerTeam = match?.teams.find((t) => t.players.some((p) => p.id === playerId));
  const opponentTeam = match?.teams.find((t) => !t.players.some((p) => p.id === playerId));

  React.useEffect(() => {
    setHasDrawnThisTurn(false);
  }, [currentPlayer?.id]);

  const handleGroupSelected = () => {
    if (selectedCards.length >= 2) createGroup(selectedCards);
  };

  const handlePlaceGroupMeld = (cardIds: string[]) => {
    if (!playerTeam) return;
    const cards = cardIds
      .map((id) => playerHand.find((c) => c.id === id))
      .filter(Boolean) as typeof playerHand;
    if (cards.length >= 3) {
      placeMeld(cards, playerTeam.id);
      dissolveGroup(cardGroups.find((g) => g.cardIds.includes(cardIds[0]))?.id ?? "");
    }
  };

  const handleExtendMeld = (meldId: string) => {
    if (selectedCards.length > 0) {
      extendMeld(meldId, selectedCards);
      clearSelection();
      setExtendMeldId(null);
    }
  };

  const handleDrawDeck = () => { drawCard("DRAW_FROM_DECK"); setHasDrawnThisTurn(true); };

  const handleTakeDiscard = () => {
    if ((currentRound?.discardPile.cards.length ?? 0) > 0) {
      drawCard("TAKE_DISCARD_PILE");
      setHasDrawnThisTurn(true);
    }
  };

  const handleDiscard = () => {
    if (selectedCards.length === 1) {
      discardCard(selectedCards[0].id);
      clearSelection();
      setHasDrawnThisTurn(false);
    }
  };

  const handleFinish = () => {
    if (playerHand.length === 0) finishRound();
  };

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #0d2137 0%, #050d1a 100%)" }}>
        <div className="text-center">
          <div className="animate-pulse text-5xl font-black text-purple-400 mb-4 tracking-tight">3000</div>
          <p className="text-gray-400">{isConnected ? "Loading game..." : "Connecting to server..."}</p>
        </div>
      </div>
    );
  }

  if (match.state === GameState.MATCH_END) {
    navigate(`/results/${gameId}`);
    return null;
  }

  const topCard = currentRound?.discardPile.cards.at(-1);
  const deckSize = currentRound?.drawPile.cards.length ?? 0;
  const discardSize = currentRound?.discardPile.cards.length ?? 0;

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 0%, #0a1f12 0%, #050d0a 60%, #030608 100%)" }}>

      {/* ── Header ── */}
      <div className="bg-black/50 backdrop-blur border-b border-white/8 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="text-xl font-black tracking-tight" style={{ color: "#d4af37" }}>3000</div>
          <div className="flex-1">
            <ScoreBoard teams={match.teams} currentPlayerId={playerId ?? undefined} />
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"} shadow-lg`} />
            <span className="text-gray-500">{isConnected ? "Live" : "Reconnecting…"}</span>
          </div>
        </div>
      </div>

      {/* ── Error toast ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-950/90 border-b border-red-800 px-4 py-2 text-center text-sm text-red-300 cursor-pointer"
            onClick={() => setError(null)}
          >
            {error} — click to dismiss
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opponent strip ── */}
      <div className="bg-black/30 border-b border-white/6 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest shrink-0">Opponents</span>
          <div className="flex gap-2 flex-wrap">
            {opponentTeam?.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  currentPlayer?.id === p.id
                    ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                {currentPlayer?.id === p.id && <span className="text-amber-400 text-[10px]">▶</span>}
                <span>{p.username}</span>
                <span className="opacity-50 text-[10px]">{p.hand.length}c</span>
                {!p.isConnected && <span className="text-red-400">●</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main play area ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: Opponent melds */}
        <div className="lg:col-span-3">
          <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
            {opponentTeam?.name} Melds
          </h3>
          {opponentTeam?.melds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-gray-700 text-xs italic">No melds yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {opponentTeam?.melds.map((meld) => (
                <MeldDisplay key={meld.id} meld={meld} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Center: Felt table */}
        <div className="lg:col-span-6 space-y-3">
          {/* Team melds on table */}
          <div
            className="felt-table rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-300/80">{playerTeam?.name} — Table</h3>
              {playerTeam && (
                <span className="text-[10px] text-emerald-700">
                  {playerTeam.melds.reduce((n, m) => n + m.cards.length, 0)} cards melded
                </span>
              )}
            </div>

            {playerTeam?.melds.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-white/10 rounded-xl">
                <p className="text-white/20 text-sm">No melds placed yet</p>
                <p className="text-white/10 text-xs mt-1">Group cards below and place them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playerTeam?.melds.map((meld) => (
                  <MeldDisplay
                    key={meld.id}
                    meld={meld}
                    selected={extendMeldId === meld.id}
                    size="sm"
                    onExtendClick={
                      isCurrentPlayer && hasDrawnThisTurn
                        ? () => setExtendMeldId(extendMeldId === meld.id ? null : meld.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {/* Extend panel */}
            <AnimatePresence>
              {extendMeldId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 rounded-xl p-3 border border-amber-600/40 bg-amber-900/20"
                >
                  <p className="text-xs text-amber-300 mb-2">Select cards from your hand then confirm</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExtendMeld(extendMeldId)}
                      disabled={selectedCards.length === 0}
                      className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Extend ({selectedCards.length})
                    </button>
                    <button
                      onClick={() => setExtendMeldId(null)}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Draw & Discard piles */}
          <div className="rounded-2xl p-4 border border-white/8 bg-black/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Draw & Discard</h3>
              <span className="text-[10px] text-gray-700">{deckSize} in deck</span>
            </div>
            <div className="flex gap-6 items-end justify-center">
              {/* Draw pile */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: isCurrentPlayer && !hasDrawnThisTurn ? 1.06 : 1, y: isCurrentPlayer && !hasDrawnThisTurn ? -4 : 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDrawDeck}
                  disabled={!isCurrentPlayer || hasDrawnThisTurn}
                  className="disabled:opacity-35 disabled:cursor-not-allowed relative"
                  title="Draw from deck"
                >
                  {/* Stacked deck effect */}
                  <div className="absolute top-1 left-1 rounded-xl" style={{ width: 76, height: 108, background: "#1a3060", border: "2px solid #1e4fd8" }} />
                  <div className="absolute top-0.5 left-0.5 rounded-xl" style={{ width: 76, height: 108, background: "#1c3870", border: "2px solid #2054e8" }} />
                  <div className="relative">
                    <CardBack size="lg" />
                  </div>
                </motion.button>
                <span className="text-[10px] text-gray-600">Draw Pile</span>
              </div>

              {/* Arrow */}
              <div className="text-gray-700 text-xl mb-8">→</div>

              {/* Discard pile */}
              <div className="flex flex-col items-center gap-1.5">
                {topCard ? (
                  <motion.button
                    whileHover={{ scale: isCurrentPlayer && !hasDrawnThisTurn ? 1.06 : 1, y: isCurrentPlayer && !hasDrawnThisTurn ? -4 : 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTakeDiscard}
                    disabled={!isCurrentPlayer || hasDrawnThisTurn}
                    className="disabled:opacity-35 disabled:cursor-not-allowed"
                    title={`Take all ${discardSize} discard cards`}
                  >
                    <Card card={topCard} size="lg" />
                  </motion.button>
                ) : (
                  <div
                    className="rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center"
                    style={{ width: 76, height: 108 }}
                  >
                    <span className="text-gray-700 text-xs">Empty</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-600">
                  Discard {discardSize > 0 ? `(${discardSize})` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action panel */}
        <div className="lg:col-span-3 space-y-2.5">
          {isCurrentPlayer ? (
            <>
              <TurnTimer isMyTurn={true} totalSeconds={30} />

              {/* Group selected */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGroupSelected}
                disabled={selectedCards.length < 2 || cardGroups.length >= 5}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed border"
                style={{
                  background: selectedCards.length >= 2 ? "linear-gradient(135deg,#16a34a,#15803d)" : "#1f2937",
                  borderColor: selectedCards.length >= 2 ? "#22c55e50" : "transparent",
                }}
              >
                {selectedCards.length >= 2
                  ? `Group ${selectedCards.length} Cards →`
                  : "Select 2+ to Group"}
              </motion.button>

              {/* Discard */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDiscard}
                disabled={!hasDrawnThisTurn || selectedCards.length !== 1}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed border"
                style={{
                  background: hasDrawnThisTurn && selectedCards.length === 1
                    ? "linear-gradient(135deg,#ea580c,#c2410c)"
                    : "#1f2937",
                  borderColor: hasDrawnThisTurn && selectedCards.length === 1 ? "#f9731640" : "transparent",
                }}
              >
                {selectedCards.length === 1 ? "Discard Selected ✓" : "Discard (select 1)"}
              </motion.button>

              {/* Finish */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                disabled={playerHand.length > 0}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed border"
                style={{
                  background: playerHand.length === 0
                    ? "linear-gradient(135deg,#d97706,#b45309)"
                    : "#1f2937",
                  borderColor: playerHand.length === 0 ? "#f59e0b40" : "transparent",
                }}
              >
                {playerHand.length > 0 ? `Finish (${playerHand.length} left)` : "Finish Hand ✓"}
              </motion.button>

              {selectedCards.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear selection ({selectedCards.length})
                </button>
              )}

              {/* Round info */}
              <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-xs space-y-2 text-gray-500">
                <div className="flex justify-between">
                  <span>Round</span><span className="text-white">{currentRound?.roundNumber ?? 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Turn</span><span className="text-white">{currentRound?.currentTurnNumber ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hand size</span><span className="text-white">{playerHand.length}</span>
                </div>
                {!hasDrawnThisTurn && (
                  <p className="text-amber-600 text-[10px] text-center pt-1">← Draw a card first</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/3 p-5 text-center">
              <div className="flex justify-center mb-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="w-2.5 h-2.5 rounded-full bg-amber-400"
                />
              </div>
              <p className="text-xs text-gray-500 mb-1">Waiting for</p>
              <p className="font-bold text-amber-300">{currentPlayer?.username}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Group Staging Area ── */}
      <AnimatePresence>
        {cardGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <StagingArea
              groups={cardGroups}
              playerHand={playerHand}
              onPlaceMeld={handlePlaceGroupMeld}
              onDissolve={dissolveGroup}
              disabled={!isCurrentPlayer || !hasDrawnThisTurn}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player Hand ── */}
      <div
        className="border-t border-white/8 px-4 py-4"
        style={{ background: "linear-gradient(0deg, #030c06 0%, #040f09 100%)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Your Hand
              <span className="ml-2 text-white/60 normal-case tracking-normal">{playerHand.length} cards</span>
            </h3>
            {selectedCards.length > 0 && (
              <span className="text-xs font-medium text-blue-400">
                {selectedCards.length} selected
              </span>
            )}
          </div>
          <div className="overflow-x-auto pb-2">
            <CardHand
              cards={playerHand}
              selectedCards={selectedCards}
              onCardSelect={toggleCardSelection}
              cardGroups={cardGroups}
              draggable
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* ── Team footer ── */}
      <div className="bg-black/50 border-t border-white/6 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest shrink-0">Your Team</span>
          <div className="flex gap-2 flex-wrap">
            {playerTeam?.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                  currentPlayer?.id === p.id
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300 font-bold"
                    : "bg-white/5 border-white/8 text-gray-400"
                }`}
              >
                {currentPlayer?.id === p.id && <span className="text-blue-400 text-[10px]">▶</span>}
                <span>{p.username}</span>
                {p.id === playerId && <span className="text-blue-400/60 text-[10px]">(you)</span>}
                <span className="opacity-40 text-[10px]">{p.hand.length}c</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
