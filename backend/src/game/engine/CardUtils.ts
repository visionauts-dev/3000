import { Card, Rank, Suit } from "../../types";
import { v4 as uuidv4 } from "uuid";

export class CardUtils {
  private static RANK_ORDER: Record<Rank, number> = {
    [Rank.ACE]: 13,
    [Rank.KING]: 12,
    [Rank.QUEEN]: 11,
    [Rank.JACK]: 10,
    [Rank.TEN]: 9,
    [Rank.NINE]: 8,
    [Rank.EIGHT]: 7,
    [Rank.SEVEN]: 6,
    [Rank.SIX]: 5,
    [Rank.FIVE]: 4,
    [Rank.FOUR]: 3,
    [Rank.THREE]: 2,
    [Rank.TWO]: 1,
  };

  private static SUIT_PRIORITY: Record<Suit, number> = {
    [Suit.SPADES]: 4,
    [Suit.HEARTS]: 3,
    [Suit.DIAMONDS]: 2,
    [Suit.CLUBS]: 1,
  };

  private static CARD_VALUES: Record<Rank, number> = {
    [Rank.ACE]: 1.5,
    [Rank.KING]: 1,
    [Rank.QUEEN]: 1,
    [Rank.JACK]: 1,
    [Rank.TEN]: 1,
    [Rank.NINE]: 1,
    [Rank.EIGHT]: 1,
    [Rank.SEVEN]: 0.5,
    [Rank.SIX]: 0.5,
    [Rank.FIVE]: 0.5,
    [Rank.FOUR]: 0.5,
    [Rank.THREE]: 0.5,
    [Rank.TWO]: 1, // Joker value
  };

  static createCard(rank: Rank, suit: Suit, isJoker = false, isPermanentJoker = false): Card {
    return {
      id: uuidv4(),
      rank,
      suit,
      isJoker,
      isPermanentJoker,
    };
  }

  static createStandardDeck(): Card[] {
    const deck: Card[] = [];
    const ranks = Object.values(Rank);
    const suits = Object.values(Suit);

    for (const rank of ranks) {
      for (const suit of suits) {
        const isPermanent2 = rank === Rank.TWO;
        deck.push(this.createCard(rank, suit, false, isPermanent2));
      }
    }

    return deck;
  }

  static createThreeDeckDeck(): Card[] {
    const deck: Card[] = [];
    for (let i = 0; i < 3; i++) {
      deck.push(...this.createStandardDeck()); // 3 × 52 = 156 cards
    }
    // 6 printed jokers total (not per deck)
    for (let i = 0; i < 6; i++) {
      deck.push({
        id: uuidv4(),
        rank: Rank.TWO,
        suit: Suit.SPADES,
        isJoker: true,
        isPermanentJoker: false,
      });
    }
    return deck; // 162 total
  }

  static compareCards(card1: Card, card2: Card): number {
    // Returns > 0 if card1 > card2, < 0 if card1 < card2, 0 if equal
    const rankDiff = CardUtils.RANK_ORDER[card2.rank] - CardUtils.RANK_ORDER[card1.rank];
    if (rankDiff !== 0) return rankDiff;
    return CardUtils.SUIT_PRIORITY[card2.suit] - CardUtils.SUIT_PRIORITY[card1.suit];
  }

  static getCardValue(card: Card): number {
    // Returns point value of card (for meld scoring)
    if (card.isJoker) return 1; // Printed joker
    return CardUtils.CARD_VALUES[card.rank];
  }

  static getCardDisplay(card: Card): string {
    if (card.isJoker) return "Joker";
    return `${card.rank}${this.suitToSymbol(card.suit)}`;
  }

  private static suitToSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      [Suit.SPADES]: "♠",
      [Suit.HEARTS]: "♥",
      [Suit.DIAMONDS]: "♦",
      [Suit.CLUBS]: "♣",
    };
    return symbols[suit];
  }

  static isSameSuit(cards: Card[]): boolean {
    if (cards.length === 0) return true;
    const firstSuit = cards[0].suit;
    return cards.every((card) => card.suit === firstSuit);
  }

  static isConsecutiveRank(cards: Card[]): boolean {
    // Check if cards form a consecutive sequence in rank
    if (cards.length < 2) return true;
    const sorted = [...cards].sort((a, b) => CardUtils.compareCards(a, b));
    for (let i = 1; i < sorted.length; i++) {
      const prev = CardUtils.RANK_ORDER[sorted[i - 1].rank];
      const curr = CardUtils.RANK_ORDER[sorted[i].rank];
      if (prev - curr !== 1) return false;
    }
    return true;
  }

  static countJokers(cards: Card[]): number {
    return cards.filter((card) => card.isJoker || card.isPermanentJoker).length;
  }

  static isCardEqual(card1: Card, card2: Card): boolean {
    return card1.rank === card2.rank && card1.suit === card2.suit;
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
