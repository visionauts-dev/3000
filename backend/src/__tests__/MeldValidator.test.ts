import { MeldValidator } from "../game/validators/MeldValidator";
import { CardUtils } from "../game/engine/CardUtils";
import { Rank, Suit, Meld } from "../types";

function makeCard(rank: Rank, suit: Suit, isJoker = false, isPermanentJoker = false) {
  return CardUtils.createCard(rank, suit, isJoker, isPermanentJoker);
}

function joker() {
  return CardUtils.createCard(Rank.TWO, Suit.SPADES, true, false);
}

describe("MeldValidator", () => {
  describe("isValidSequence", () => {
    it("accepts a pure 3-card sequence", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.QUEEN, Suit.SPADES),
        makeCard(Rank.JACK, Suit.SPADES),
      ];
      expect(MeldValidator.isValidSequence(cards)).toBe(true);
    });

    it("accepts a 5-card pure sequence", () => {
      const cards = [
        makeCard(Rank.ACE, Suit.HEARTS),
        makeCard(Rank.KING, Suit.HEARTS),
        makeCard(Rank.QUEEN, Suit.HEARTS),
        makeCard(Rank.JACK, Suit.HEARTS),
        makeCard(Rank.TEN, Suit.HEARTS),
      ];
      expect(MeldValidator.isValidSequence(cards)).toBe(true);
    });

    it("accepts an impure sequence (1 joker)", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        joker(),
        makeCard(Rank.JACK, Suit.SPADES),
      ];
      expect(MeldValidator.isValidSequence(cards)).toBe(true);
    });

    it("rejects a sequence with 2 jokers", () => {
      const cards = [makeCard(Rank.KING, Suit.SPADES), joker(), joker()];
      expect(MeldValidator.isValidSequence(cards)).toBe(false);
    });

    it("rejects mixed-suit cards without joker", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.QUEEN, Suit.HEARTS),
        makeCard(Rank.JACK, Suit.SPADES),
      ];
      expect(MeldValidator.isValidSequence(cards)).toBe(false);
    });

    it("rejects a sequence with fewer than 3 cards", () => {
      const cards = [makeCard(Rank.KING, Suit.SPADES), makeCard(Rank.QUEEN, Suit.SPADES)];
      expect(MeldValidator.isValidSequence(cards)).toBe(false);
    });

    it("rejects non-consecutive same-suit cards", () => {
      const cards = [
        makeCard(Rank.ACE, Suit.SPADES),
        makeCard(Rank.QUEEN, Suit.SPADES),
        makeCard(Rank.JACK, Suit.SPADES),
      ];
      expect(MeldValidator.isValidSequence(cards)).toBe(false);
    });
  });

  describe("isValidSet", () => {
    it("accepts a 3-card set (same rank)", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.KING, Suit.HEARTS),
        makeCard(Rank.KING, Suit.DIAMONDS),
      ];
      expect(MeldValidator.isValidSet(cards)).toBe(true);
    });

    it("accepts a set with a joker", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.KING, Suit.HEARTS),
        joker(),
      ];
      expect(MeldValidator.isValidSet(cards)).toBe(true);
    });

    it("rejects a set with 2 jokers", () => {
      const cards = [makeCard(Rank.KING, Suit.SPADES), joker(), joker()];
      expect(MeldValidator.isValidSet(cards)).toBe(false);
    });

    it("rejects a set with different ranks", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.QUEEN, Suit.HEARTS),
        makeCard(Rank.JACK, Suit.DIAMONDS),
      ];
      expect(MeldValidator.isValidSet(cards)).toBe(false);
    });

    it("rejects more than 3 natural copies (max from 3 decks)", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.KING, Suit.SPADES),
      ];
      expect(MeldValidator.isValidSet(cards)).toBe(false);
    });
  });

  describe("determineMeldType", () => {
    it("returns SEQUENCE for consecutive same-suit cards", () => {
      const cards = [
        makeCard(Rank.KING, Suit.SPADES),
        makeCard(Rank.QUEEN, Suit.SPADES),
        makeCard(Rank.JACK, Suit.SPADES),
      ];
      expect(MeldValidator.determineMeldType(cards)).toBe("SEQUENCE");
    });

    it("returns SET for same-rank cards", () => {
      const cards = [
        makeCard(Rank.ACE, Suit.SPADES),
        makeCard(Rank.ACE, Suit.HEARTS),
        makeCard(Rank.ACE, Suit.DIAMONDS),
      ];
      expect(MeldValidator.determineMeldType(cards)).toBe("SET");
    });

    it("returns null for invalid cards", () => {
      const cards = [
        makeCard(Rank.ACE, Suit.SPADES),
        makeCard(Rank.TEN, Suit.HEARTS),
        makeCard(Rank.FIVE, Suit.DIAMONDS),
      ];
      expect(MeldValidator.determineMeldType(cards)).toBeNull();
    });
  });

  describe("isPureSequence", () => {
    it("returns true for no-joker sequence", () => {
      const meld: Meld = {
        id: "1",
        teamId: "t1",
        cards: [
          makeCard(Rank.KING, Suit.SPADES),
          makeCard(Rank.QUEEN, Suit.SPADES),
          makeCard(Rank.JACK, Suit.SPADES),
        ],
        type: "SEQUENCE",
        isValid: true,
        isPureSequence: true,
        jokerCount: 0,
      };
      expect(MeldValidator.isPureSequence(meld)).toBe(true);
    });

    it("returns false for sequence with joker", () => {
      const meld: Meld = {
        id: "2",
        teamId: "t1",
        cards: [makeCard(Rank.KING, Suit.SPADES), joker(), makeCard(Rank.JACK, Suit.SPADES)],
        type: "SEQUENCE",
        isValid: true,
        isPureSequence: false,
        jokerCount: 1,
      };
      expect(MeldValidator.isPureSequence(meld)).toBe(false);
    });
  });

  describe("canExtendMeld", () => {
    it("can extend a sequence with adjacent card", () => {
      const meld: Meld = {
        id: "3",
        teamId: "t1",
        cards: [
          makeCard(Rank.KING, Suit.SPADES),
          makeCard(Rank.QUEEN, Suit.SPADES),
          makeCard(Rank.JACK, Suit.SPADES),
        ],
        type: "SEQUENCE",
        isValid: true,
        isPureSequence: true,
        jokerCount: 0,
      };
      const newCard = makeCard(Rank.TEN, Suit.SPADES);
      expect(MeldValidator.canExtendMeld(meld, newCard)).toBe(true);
    });

    it("cannot extend a set beyond max cards", () => {
      const meld: Meld = {
        id: "4",
        teamId: "t1",
        cards: [
          makeCard(Rank.ACE, Suit.SPADES),
          makeCard(Rank.ACE, Suit.HEARTS),
          makeCard(Rank.ACE, Suit.DIAMONDS),
        ],
        type: "SET",
        isValid: true,
        isPureSequence: false,
        jokerCount: 0,
      };
      const extra = makeCard(Rank.ACE, Suit.CLUBS);
      // 4 natural cards in set exceeds max (3 natural)
      expect(MeldValidator.canExtendMeld(meld, extra)).toBe(false);
    });
  });
});
