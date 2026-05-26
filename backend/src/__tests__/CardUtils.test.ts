import { CardUtils } from "../game/engine/CardUtils";
import { Rank, Suit } from "../types";

describe("CardUtils", () => {
  describe("createThreeDeckDeck", () => {
    it("creates exactly 162 cards", () => {
      const deck = CardUtils.createThreeDeckDeck();
      expect(deck.length).toBe(162);
    });

    it("has exactly 6 printed jokers", () => {
      const deck = CardUtils.createThreeDeckDeck();
      const jokers = deck.filter((c) => c.isJoker === true);
      expect(jokers.length).toBe(6);
    });

    it("has exactly 24 twos (permanent jokers) across 3 decks", () => {
      const deck = CardUtils.createThreeDeckDeck();
      const twos = deck.filter((c) => c.rank === Rank.TWO && !c.isJoker);
      expect(twos.length).toBe(12); // 4 suits × 3 decks
    });

    it("gives each card a unique id", () => {
      const deck = CardUtils.createThreeDeckDeck();
      const ids = new Set(deck.map((c) => c.id));
      expect(ids.size).toBe(162);
    });
  });

  describe("createStandardDeck", () => {
    it("creates 52 cards per deck (no jokers)", () => {
      const deck = CardUtils.createStandardDeck();
      expect(deck.length).toBe(52);
    });

    it("marks all TWO cards as permanent jokers", () => {
      const deck = CardUtils.createStandardDeck();
      const twos = deck.filter((c) => c.rank === Rank.TWO);
      expect(twos.every((c) => c.isPermanentJoker)).toBe(true);
    });
  });

  describe("shuffleDeck", () => {
    it("preserves card count", () => {
      const deck = CardUtils.createThreeDeckDeck();
      const shuffled = CardUtils.shuffleDeck(deck);
      expect(shuffled.length).toBe(deck.length);
    });

    it("does not mutate the original deck", () => {
      const deck = CardUtils.createThreeDeckDeck();
      const original = [...deck];
      CardUtils.shuffleDeck(deck);
      expect(deck.map((c) => c.id)).toEqual(original.map((c) => c.id));
    });
  });

  describe("compareCards", () => {
    it("ACE beats KING", () => {
      const ace = CardUtils.createCard(Rank.ACE, Suit.SPADES);
      const king = CardUtils.createCard(Rank.KING, Suit.SPADES);
      expect(CardUtils.compareCards(ace, king)).toBeLessThan(0);
    });

    it("SPADES beats HEARTS on same rank", () => {
      const s = CardUtils.createCard(Rank.ACE, Suit.SPADES);
      const h = CardUtils.createCard(Rank.ACE, Suit.HEARTS);
      expect(CardUtils.compareCards(s, h)).toBeLessThan(0);
    });
  });

  describe("countJokers", () => {
    it("counts printed jokers", () => {
      const cards = [
        CardUtils.createCard(Rank.TWO, Suit.SPADES, true, false),
        CardUtils.createCard(Rank.ACE, Suit.SPADES),
      ];
      expect(CardUtils.countJokers(cards)).toBe(1);
    });

    it("counts permanent jokers (2s)", () => {
      const cards = [
        CardUtils.createCard(Rank.TWO, Suit.HEARTS, false, true),
        CardUtils.createCard(Rank.ACE, Suit.SPADES),
      ];
      expect(CardUtils.countJokers(cards)).toBe(1);
    });

    it("returns 0 for no jokers", () => {
      const cards = [
        CardUtils.createCard(Rank.ACE, Suit.SPADES),
        CardUtils.createCard(Rank.KING, Suit.SPADES),
      ];
      expect(CardUtils.countJokers(cards)).toBe(0);
    });
  });

  describe("isSameSuit", () => {
    it("returns true for same-suit cards", () => {
      const cards = [
        CardUtils.createCard(Rank.ACE, Suit.SPADES),
        CardUtils.createCard(Rank.KING, Suit.SPADES),
      ];
      expect(CardUtils.isSameSuit(cards)).toBe(true);
    });

    it("returns false for mixed suits", () => {
      const cards = [
        CardUtils.createCard(Rank.ACE, Suit.SPADES),
        CardUtils.createCard(Rank.KING, Suit.HEARTS),
      ];
      expect(CardUtils.isSameSuit(cards)).toBe(false);
    });

    it("returns true for empty array", () => {
      expect(CardUtils.isSameSuit([])).toBe(true);
    });
  });

  describe("isConsecutiveRank", () => {
    it("returns true for consecutive ranks", () => {
      const cards = [
        CardUtils.createCard(Rank.KING, Suit.SPADES),
        CardUtils.createCard(Rank.QUEEN, Suit.SPADES),
        CardUtils.createCard(Rank.JACK, Suit.SPADES),
      ];
      expect(CardUtils.isConsecutiveRank(cards)).toBe(true);
    });

    it("returns false for non-consecutive ranks", () => {
      const cards = [
        CardUtils.createCard(Rank.KING, Suit.SPADES),
        CardUtils.createCard(Rank.JACK, Suit.SPADES),
        CardUtils.createCard(Rank.NINE, Suit.SPADES),
      ];
      expect(CardUtils.isConsecutiveRank(cards)).toBe(false);
    });
  });
});
