import { ScoringEngine } from "../game/scoring/ScoringEngine";
import { CardUtils } from "../game/engine/CardUtils";
import { Rank, Suit, Meld } from "../types";

function card(rank: Rank, suit: Suit) {
  return CardUtils.createCard(rank, suit);
}

function joker() {
  return CardUtils.createCard(Rank.TWO, Suit.SPADES, true, false);
}

function makeMeld(cards: ReturnType<typeof card>[], type: "SEQUENCE" | "SET" = "SEQUENCE"): Meld {
  return {
    id: Math.random().toString(36).slice(2),
    teamId: "team1",
    cards,
    type,
    isValid: true,
    isPureSequence: type === "SEQUENCE" && CardUtils.countJokers(cards) === 0,
    jokerCount: CardUtils.countJokers(cards),
  };
}

describe("ScoringEngine", () => {
  describe("getCardPoints", () => {
    it("ACE is worth 1.5 points", () => {
      expect(ScoringEngine.getCardPoints(card(Rank.ACE, Suit.SPADES))).toBe(1.5);
    });

    it("KING is worth 1 point", () => {
      expect(ScoringEngine.getCardPoints(card(Rank.KING, Suit.SPADES))).toBe(1);
    });

    it("SEVEN is worth 0.5 points", () => {
      expect(ScoringEngine.getCardPoints(card(Rank.SEVEN, Suit.SPADES))).toBe(0.5);
    });

    it("printed joker is worth 1 point", () => {
      expect(ScoringEngine.getCardPoints(joker())).toBe(1);
    });
  });

  describe("calculateBaseScore", () => {
    it("multiplies total card value by 10", () => {
      const melds = [
        makeMeld([card(Rank.KING, Suit.SPADES), card(Rank.QUEEN, Suit.SPADES), card(Rank.JACK, Suit.SPADES)]),
      ];
      // 3 × 1.0 = 3.0 × 10 = 30
      expect(ScoringEngine.calculateBaseScore(melds)).toBe(30);
    });

    it("returns 0 for empty melds", () => {
      expect(ScoringEngine.calculateBaseScore([])).toBe(0);
    });
  });

  describe("calculateBonuses", () => {
    it("awards 200 points for an 8+ card pure meld", () => {
      const cards = [
        card(Rank.ACE, Suit.SPADES),
        card(Rank.KING, Suit.SPADES),
        card(Rank.QUEEN, Suit.SPADES),
        card(Rank.JACK, Suit.SPADES),
        card(Rank.TEN, Suit.SPADES),
        card(Rank.NINE, Suit.SPADES),
        card(Rank.EIGHT, Suit.SPADES),
        card(Rank.SEVEN, Suit.SPADES),
      ];
      const melds = [makeMeld(cards)];
      const bonuses = ScoringEngine.calculateBonuses(melds, new Set());
      expect(bonuses.some((b) => b.type === "LONG_MELD_PURE" && b.points === 200)).toBe(true);
    });

    it("awards 100 points for an 8+ card impure meld (with joker)", () => {
      const cards = [
        card(Rank.ACE, Suit.SPADES),
        card(Rank.KING, Suit.SPADES),
        card(Rank.QUEEN, Suit.SPADES),
        card(Rank.JACK, Suit.SPADES),
        card(Rank.TEN, Suit.SPADES),
        card(Rank.NINE, Suit.SPADES),
        card(Rank.EIGHT, Suit.SPADES),
        joker(),
      ];
      const melds = [makeMeld(cards)];
      const bonuses = ScoringEngine.calculateBonuses(melds, new Set());
      expect(bonuses.some((b) => b.type === "LONG_MELD_JOKER" && b.points === 100)).toBe(true);
    });

    it("returns no bonuses for short melds", () => {
      const melds = [
        makeMeld([card(Rank.KING, Suit.SPADES), card(Rank.QUEEN, Suit.SPADES), card(Rank.JACK, Suit.SPADES)]),
      ];
      const bonuses = ScoringEngine.calculateBonuses(melds, new Set());
      expect(bonuses.length).toBe(0);
    });
  });

  describe("calculatePenalties", () => {
    it("adds no penalty for finished player", () => {
      const player = {
        id: "p1",
        hand: [card(Rank.KING, Suit.SPADES), card(Rank.QUEEN, Suit.SPADES)],
        finished: true,
      };
      const penalties = ScoringEngine.calculatePenalties([player], new Set(["p1"]));
      expect(penalties.length).toBe(0);
    });

    it("adds penalty for unfinished player cards", () => {
      const player = {
        id: "p1",
        hand: [card(Rank.KING, Suit.SPADES)],
        finished: false,
      };
      const penalties = ScoringEngine.calculatePenalties([player], new Set());
      expect(penalties.length).toBe(1);
      expect(penalties[0].penaltyPoints).toBe(1);
    });
  });

  describe("calculateRoundScore", () => {
    it("integrates base score, bonuses, and penalties", () => {
      const melds = [
        makeMeld([
          card(Rank.KING, Suit.SPADES),
          card(Rank.QUEEN, Suit.SPADES),
          card(Rank.JACK, Suit.SPADES),
        ]),
      ];
      const players = [{ id: "p1", hand: [], finished: true }];
      const result = ScoringEngine.calculateRoundScore(melds, new Set(["p1"]), players, true);
      expect(result.baseScore).toBe(30);
      expect(result.totalScore).toBeGreaterThan(0);
    });
  });

  describe("shouldHave1000Restriction", () => {
    it("returns true at exactly 1000", () => {
      expect(ScoringEngine.shouldHave1000Restriction(1000)).toBe(true);
    });

    it("returns false below 1000", () => {
      expect(ScoringEngine.shouldHave1000Restriction(999)).toBe(false);
    });
  });
});
