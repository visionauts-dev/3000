import React from "react";
import { Card as CardType, Suit } from "../types";
import { motion } from "framer-motion";

export type CardSize = "sm" | "md" | "lg";

export interface CardGroup {
  id: string;
  label: string;
  cardIds: string[];
  color: string;
}

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  size?: CardSize;
  groupColor?: string;
  disabled?: boolean;
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  SPADES: "♠",
  HEARTS: "♥",
  DIAMONDS: "♦",
  CLUBS: "♣",
};

const RANK_DISPLAY: Record<string, string> = {
  ACE: "A", KING: "K", QUEEN: "Q", JACK: "J",
  TEN: "10", NINE: "9", EIGHT: "8", SEVEN: "7",
  SIX: "6", FIVE: "5", FOUR: "4", THREE: "3", TWO: "2",
};

const DIMS: Record<CardSize, { w: number; h: number; rank: number; suit: number; center: number }> = {
  sm:  { w: 46,  h: 64,  rank: 9,  suit: 8,  center: 18 },
  md:  { w: 58,  h: 82,  rank: 11, suit: 10, center: 24 },
  lg:  { w: 76,  h: 108, rank: 14, suit: 12, center: 36 },
};

// ─────────────────────────────── SVG Face Art ────────────────────────────────

const AceCenterArt: React.FC<{ suit: string; isRed: boolean; size: CardSize }> = ({ suit, isRed, size }) => {
  const s = DIMS[size].center + 8;
  const c = isRed ? "#dc2626" : "#111827";
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" style={{ overflow: "visible" }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <line
          key={i}
          x1="24" y1="24"
          x2={24 + 20 * Math.cos((a * Math.PI) / 180)}
          y2={24 + 20 * Math.sin((a * Math.PI) / 180)}
          stroke={c} strokeWidth="0.7" opacity="0.18"
        />
      ))}
      <text x="24" y="30" textAnchor="middle" fill={c} fontSize="26" fontFamily="Georgia, serif" fontWeight="bold">
        {suit}
      </text>
    </svg>
  );
};

const KingCenterArt: React.FC<{ isRed: boolean; size: CardSize }> = ({ isRed, size }) => {
  const s = DIMS[size].center + 4;
  const c = isRed ? "#dc2626" : "#1a1a2e";
  return (
    <svg width={s} height={s} viewBox="0 0 44 44">
      {/* Crown base */}
      <rect x="8" y="30" width="28" height="6" rx="2" fill={c} />
      {/* Crown body */}
      <path d="M8 30 L8 20 L16 27 L22 12 L28 27 L36 20 L36 30 Z" fill={c} />
      {/* Jewels */}
      <circle cx="8"  cy="20" r="3" fill="#d97706" />
      <circle cx="22" cy="12" r="3" fill="#d97706" />
      <circle cx="36" cy="20" r="3" fill="#d97706" />
      {/* Highlight */}
      <path d="M8 30 L8 22 L16 28 L22 14 L28 28 L36 22 L36 30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
};

const QueenCenterArt: React.FC<{ isRed: boolean; size: CardSize }> = ({ isRed, size }) => {
  const s = DIMS[size].center + 4;
  const c = isRed ? "#dc2626" : "#1a1a2e";
  return (
    <svg width={s} height={s} viewBox="0 0 44 44">
      <path
        d="M22 4 L24 14 L34 10 L27 18 L38 22 L27 26 L34 34 L24 30 L22 40 L20 30 L10 34 L17 26 L6 22 L17 18 L10 10 L20 14 Z"
        fill={c} opacity="0.85"
      />
      <circle cx="22" cy="22" r="6" fill="#d97706" opacity="0.65" />
      <circle cx="22" cy="22" r="3" fill={c} />
    </svg>
  );
};

const JackCenterArt: React.FC<{ isRed: boolean; size: CardSize }> = ({ isRed, size }) => {
  const s = DIMS[size].center + 4;
  const c = isRed ? "#dc2626" : "#1a1a2e";
  return (
    <svg width={s} height={s} viewBox="0 0 44 44">
      {/* Shield */}
      <path d="M22 4 L38 11 L38 24 Q38 35 22 41 Q6 35 6 24 L6 11 Z" fill={c} opacity="0.82" />
      <path d="M22 9 L33 14 L33 24 Q33 31 22 36 Q11 31 11 24 L11 14 Z" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      {/* Cross */}
      <rect x="20" y="14" width="4" height="16" rx="1.5" fill="rgba(255,255,255,0.55)" />
      <rect x="14" y="19" width="16" height="4" rx="1.5" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
};

// ──────────────────────────────── Card Back ───────────────────────────────────

export const CardBack: React.FC<{ size?: CardSize }> = ({ size = "lg" }) => {
  const { w, h } = DIMS[size];
  return (
    <div
      className="rounded-xl border-2 border-blue-600 overflow-hidden shadow-md"
      style={{ width: w, height: h, minWidth: w, background: "linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#1e3a8a 100%)" }}
    >
      <div className="w-full h-full relative flex items-center justify-center">
        <div className="absolute inset-1 border border-blue-400/30 rounded-lg" />
        <div className="absolute inset-2 border border-blue-400/15 rounded-lg" />
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 40 56">
          <defs>
            <pattern id="dp" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M4 0 L8 4 L4 8 L0 4Z" fill="#93c5fd" />
            </pattern>
          </defs>
          <rect width="40" height="56" fill="url(#dp)" />
        </svg>
        <span className="text-blue-300/50 font-black text-xl tracking-tight select-none">3K</span>
      </div>
    </div>
  );
};

// ──────────────────────────────── Main Card ───────────────────────────────────

export const Card: React.FC<CardProps> = ({
  card,
  selected = false,
  onClick,
  draggable,
  size = "lg",
  groupColor,
  disabled = false,
  faceDown = false,
}) => {
  if (faceDown) return <CardBack size={size} />;

  const { w, h, rank: rankSz, suit: suitSz, center: centerSz } = DIMS[size];
  const rankDisplay = RANK_DISPLAY[card.rank as string] ?? (card.rank as string);
  const suitSymbol = !card.isJoker && card.suit ? (SUIT_SYMBOLS[card.suit as string] ?? "") : "";
  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;
  const isFaceCard = ["ACE", "KING", "QUEEN", "JACK"].includes(card.rank as string);

  const selBorder = groupColor ?? "#3b82f6";
  const selShadow = groupColor
    ? `0 0 0 2.5px ${groupColor}, 0 8px 20px rgba(0,0,0,0.35)`
    : "0 0 0 2.5px #3b82f6, 0 8px 20px rgba(59,130,246,0.3)";

  // Joker cards
  if (card.isJoker || card.isPermanentJoker) {
    const isPermanent = !!(card.isPermanentJoker && !card.isJoker);
    const bg = isPermanent
      ? "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%)"
      : "linear-gradient(135deg,#581c87 0%,#7e22ce 100%)";
    const accent = isPermanent ? "#93c5fd" : "#d8b4fe";
    const borderC = selected ? selBorder : (isPermanent ? "#60a5fa" : "#a855f7");

    return (
      <motion.div
        whileHover={!disabled ? { y: -6, scale: 1.04 } : {}}
        whileTap={!disabled ? { scale: 0.96 } : {}}
        onClick={!disabled ? onClick : undefined}
        style={{
          width: w, height: h, minWidth: w,
          background: bg,
          border: `2px solid ${borderC}`,
          boxShadow: selected ? selShadow : "0 4px 12px rgba(0,0,0,0.35)",
          transform: selected ? "translateY(-6px)" : undefined,
        }}
        className={`rounded-xl cursor-pointer flex flex-col justify-between p-1.5 select-none relative overflow-hidden ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent pointer-events-none rounded-xl" />
        <div style={{ fontSize: rankSz, color: accent, fontWeight: 800, lineHeight: 1 }}>
          {isPermanent ? rankDisplay : "★"}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div style={{ fontSize: suitSz - 1, color: accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const }}>
            JOKER
          </div>
          {isPermanent && suitSymbol && (
            <div style={{ fontSize: suitSz, color: accent, opacity: 0.55 }}>{suitSymbol}</div>
          )}
        </div>
        <div style={{ fontSize: rankSz, color: accent, fontWeight: 800, lineHeight: 1, transform: "rotate(180deg)" }}>
          {isPermanent ? rankDisplay : "★"}
        </div>
      </motion.div>
    );
  }

  const textColor = isRed ? "#dc2626" : "#111827";
  const cardBg = isFaceCard
    ? isRed
      ? "linear-gradient(165deg,#ffffff 55%,#fff1f2 100%)"
      : "linear-gradient(165deg,#ffffff 55%,#f8fafc 100%)"
    : "#ffffff";
  const borderC = selected ? selBorder : isRed ? "#fca5a5" : "#d1d5db";

  return (
    <motion.div
      whileHover={!disabled ? { y: -6, scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={!disabled ? onClick : undefined}
      draggable={draggable}
      style={{
        width: w, height: h, minWidth: w,
        background: cardBg,
        border: `2px solid ${borderC}`,
        boxShadow: selected ? selShadow : "0 3px 10px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)",
        transform: selected ? "translateY(-6px)" : undefined,
      }}
      className={`rounded-xl cursor-pointer flex flex-col justify-between p-1 select-none relative overflow-hidden ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {/* Gloss overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ background: "linear-gradient(175deg,rgba(255,255,255,0.55) 0%,transparent 45%)" }}
      />

      {/* Top-left corner */}
      <div className="flex flex-col items-start leading-none relative z-10" style={{ gap: 1 }}>
        <span style={{ fontSize: rankSz, fontWeight: 800, color: textColor, lineHeight: 1 }}>{rankDisplay}</span>
        <span style={{ fontSize: suitSz, color: textColor, lineHeight: 1 }}>{suitSymbol}</span>
      </div>

      {/* Center art */}
      <div className="flex items-center justify-center flex-1 relative z-10">
        {(card.rank as string) === "ACE"   && <AceCenterArt suit={suitSymbol} isRed={isRed} size={size} />}
        {(card.rank as string) === "KING"  && <KingCenterArt  isRed={isRed} size={size} />}
        {(card.rank as string) === "QUEEN" && <QueenCenterArt isRed={isRed} size={size} />}
        {(card.rank as string) === "JACK"  && <JackCenterArt  isRed={isRed} size={size} />}
        {!isFaceCard && (
          <span style={{ fontSize: centerSz, color: textColor, opacity: 0.12, fontFamily: "Georgia, serif" }}>
            {suitSymbol}
          </span>
        )}
      </div>

      {/* Bottom-right corner (inverted) */}
      <div
        className="flex flex-col items-end leading-none relative z-10"
        style={{ gap: 1, transform: "rotate(180deg)" }}
      >
        <span style={{ fontSize: rankSz, fontWeight: 800, color: textColor, lineHeight: 1 }}>{rankDisplay}</span>
        <span style={{ fontSize: suitSz, color: textColor, lineHeight: 1 }}>{suitSymbol}</span>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────── Card Hand ───────────────────────────────────

interface CardHandProps {
  cards: CardType[];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  cardGroups?: CardGroup[];
  draggable?: boolean;
  size?: CardSize;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  selectedCards,
  onCardSelect,
  cardGroups = [],
  draggable,
  size = "lg",
}) => {
  // Build cardId → group map
  const cardGroupMap = new Map<string, CardGroup>();
  for (const g of cardGroups) {
    for (const id of g.cardIds) cardGroupMap.set(id, g);
  }

  // Render grouped cards first, in group order, then ungrouped
  const seenIds = new Set<string>();
  const grouped: CardType[] = [];
  for (const g of cardGroups) {
    for (const id of g.cardIds) {
      const c = cards.find((x) => x.id === id);
      if (c && !seenIds.has(c.id)) { grouped.push(c); seenIds.add(c.id); }
    }
  }
  const ungrouped = cards.filter((c) => !seenIds.has(c.id));
  const ordered = [...grouped, ...ungrouped];

  return (
    <div className="flex items-end gap-1.5 flex-wrap" style={{ paddingTop: 24 }}>
      {ordered.map((card, idx) => {
        const group = cardGroupMap.get(card.id);
        const prevGroup = idx > 0 ? cardGroupMap.get(ordered[idx - 1].id) : undefined;
        const isFirstInGroup = group && (!prevGroup || prevGroup.id !== group.id);

        return (
          <div key={card.id} className="relative flex flex-col items-center">
            {isFirstInGroup && (
              <div
                className="absolute flex items-center justify-center"
                style={{ top: -22, left: 0, right: 0, zIndex: 10 }}
              >
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap shadow"
                  style={{ background: group.color }}
                >
                  {group.label}
                </span>
              </div>
            )}
            {group && (
              <div
                className="absolute rounded-xl pointer-events-none"
                style={{
                  inset: -2,
                  border: `1.5px solid ${group.color}60`,
                  boxShadow: `0 0 8px ${group.color}25`,
                }}
              />
            )}
            <Card
              card={card}
              selected={selectedCards.some((c) => c.id === card.id)}
              onClick={() => onCardSelect(card)}
              draggable={draggable}
              size={size}
              groupColor={group?.color}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────── Meld Display ────────────────────────────────

interface MeldDisplayProps {
  meld: any;
  onExtendClick?: () => void;
  selected?: boolean;
  size?: CardSize;
}

export const MeldDisplay: React.FC<MeldDisplayProps> = ({
  meld,
  onExtendClick,
  selected = false,
  size = "sm",
}) => {
  const isPure = meld.isPureSequence;
  const type = meld.type as string;

  return (
    <div
      className={`rounded-xl p-3 border transition-all ${
        selected
          ? "border-yellow-400 bg-yellow-900/20 shadow-yellow-400/20 shadow-lg"
          : "border-white/10 bg-white/5 hover:bg-white/8"
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isPure
                ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                : type === "SEQUENCE"
                ? "bg-blue-900/60 text-blue-300 border border-blue-700"
                : "bg-violet-900/60 text-violet-300 border border-violet-700"
            }`}
          >
            {isPure ? "Pure " : ""}
            {type === "SEQUENCE" ? "Sequence" : "Set"}
          </span>
          <span className="text-[10px] text-gray-500">{meld.cards.length} cards</span>
        </div>
        {onExtendClick && (
          <button
            onClick={onExtendClick}
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700 hover:bg-yellow-900/70 transition-colors"
          >
            + Extend
          </button>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {meld.cards.map((c: CardType) => (
          <Card key={c.id} card={c} size={size} />
        ))}
      </div>
    </div>
  );
};
