import { Card, Meld, Rank } from "../../types";
import { CardUtils } from "../engine/CardUtils";

export class MeldValidator {
  // Validate if cards form a legal sequence
  static isValidSequence(cards: Card[]): boolean {
    if (cards.length < 3) return false;

    // Get joker count
    const jokerCount = CardUtils.countJokers(cards);

    // Sequence can have maximum 1 joker
    if (jokerCount > 1) return false;

    // All non-joker cards must be same suit
    const nonJokerCards = cards.filter((card) => !card.isJoker && !card.isPermanentJoker);
    if (nonJokerCards.length === 0) return false;

    // Check if all non-joker cards are same suit
    if (!CardUtils.isSameSuit(nonJokerCards)) return false;

    // Check if non-joker cards form a valid sequence or can be a sequence with joker
    if (jokerCount === 0) {
      // Pure sequence - must be consecutive
      return CardUtils.isConsecutiveRank(nonJokerCards);
    } else {
      // Impure sequence - need to check if joker can fill the gap
      // This is more complex - for now, if joker is present and other cards are same suit,
      // we trust it's valid (full validation handled by game engine)
      return true;
    }
  }

  // Validate if cards form a legal set
  static isValidSet(cards: Card[]): boolean {
    if (cards.length < 3) return false;

    // Get joker count
    const jokerCount = CardUtils.countJokers(cards);

    // Set can have maximum 1 joker
    if (jokerCount > 1) return false;

    // Get non-joker cards
    const nonJokerCards = cards.filter((card) => !card.isJoker && !card.isPermanentJoker);

    if (nonJokerCards.length === 0) return false;

    // All non-joker cards must have same rank
    const baseRank = nonJokerCards[0].rank;
    const sameRank = nonJokerCards.every((card) => card.rank === baseRank);

    if (!sameRank) return false;

    // No more than 3 copies of the same rank (from 3 decks, max 3 copies)
    // But with joker we can have 4 (3 natural + 1 joker)
    const maxCards = jokerCount > 0 ? 4 : 3;
    if (cards.length > maxCards) return false;

    return true;
  }

  // Validate a meld
  static isValidMeld(meld: Meld): boolean {
    if (meld.cards.length < 3) return false;

    if (meld.type === "SEQUENCE") {
      return this.isValidSequence(meld.cards);
    } else {
      return this.isValidSet(meld.cards);
    }
  }

  // Determine meld type from cards
  static determineMeldType(cards: Card[]): "SEQUENCE" | "SET" | null {
    // Try to determine if it's a sequence or set
    if (this.isValidSequence(cards)) {
      // Additional check - if it's also a valid set, prefer sequence
      return "SEQUENCE";
    } else if (this.isValidSet(cards)) {
      return "SET";
    }
    return null;
  }

  // Check if a sequence is pure (no joker)
  static isPureSequence(meld: Meld): boolean {
    if (meld.type !== "SEQUENCE") return false;
    const jokerCount = CardUtils.countJokers(meld.cards);
    return jokerCount === 0;
  }

  // Check if a sequence is impure (has joker)
  static isImpureSequence(meld: Meld): boolean {
    if (meld.type !== "SEQUENCE") return false;
    const jokerCount = CardUtils.countJokers(meld.cards);
    return jokerCount > 0;
  }

  // Check if card can be added to existing meld
  static canExtendMeld(meld: Meld, card: Card): boolean {
    if (!meld) return false;

    if (meld.type === "SEQUENCE") {
      return this.canExtendSequence(meld, card);
    } else {
      return this.canExtendSet(meld, card);
    }
  }

  private static canExtendSequence(meld: Meld, card: Card): boolean {
    const testCards = [...meld.cards, card];
    return this.isValidSequence(testCards);
  }

  private static canExtendSet(meld: Meld, card: Card): boolean {
    const testCards = [...meld.cards, card];
    return this.isValidSet(testCards);
  }

  // Validate a meld that contains jokers (checking pure sequence requirement)
  static isValidJokerState(melds: Meld[], newMeld?: Meld): boolean {
    const allMelds = newMeld ? [...melds, newMeld] : melds;

    // Count pure sequences
    const pureSequences = allMelds.filter(
      (m) => m.type === "SEQUENCE" && this.isPureSequence(m)
    ).length;

    // If only 1 pure sequence, cannot transform jokers
    if (pureSequences <= 1) {
      // Check if any 2-rank cards are being used as jokers
      for (const meld of allMelds) {
        const has2AsJoker = meld.cards.some(
          (card) => card.rank === Rank.TWO && card.isPermanentJoker && !this.isActingAsNatural2(meld, card)
        );
        if (has2AsJoker) return false;
      }
    }

    return true;
  }

  // Check if a 2 card is acting as natural 2 or joker
  private static isActingAsNatural2(meld: Meld, twoCard: Card): boolean {
    if (meld.type !== "SEQUENCE") return true;
    if (!CardUtils.isSameSuit(meld.cards)) return false;

    // Check if the 2 is consecutive with other cards (acting as natural)
    const nonJokerCards = meld.cards.filter((c) => c !== twoCard);
    const testCards = [...nonJokerCards, twoCard];
    return CardUtils.isConsecutiveRank(testCards);
  }

  // Create a meld from cards
  static createMeld(cards: Card[], teamId: string): Meld | null {
    const type = this.determineMeldType(cards);
    if (!type) return null;

    const isPure = !this.isMeldWithJoker(cards);
    const jokerCount = CardUtils.countJokers(cards);

    return {
      id: Math.random().toString(36).substring(7),
      teamId,
      cards,
      type,
      isValid: true,
      isPureSequence: type === "SEQUENCE" ? isPure : false,
      jokerCount,
    };
  }

  private static isMeldWithJoker(cards: Card[]): boolean {
    return CardUtils.countJokers(cards) > 0;
  }

  // Check if a 2 card (permanent joker) can be transformed
  static canTransform2ToJoker(
    meld: Meld,
    _twoCard: Card,
    allTeamMelds: Meld[]
  ): boolean {
    // Can only transform 2 in a sequence
    if (meld.type !== "SEQUENCE") return false;

    // Must have another valid pure sequence on the table
    const pureSequences = allTeamMelds.filter(
      (m) => m.type === "SEQUENCE" && this.isPureSequence(m)
    );

    // Need at least 2 pure sequences (one being the one we're transforming)
    const hasAnotherPure = pureSequences.length > 1;

    return hasAnotherPure;
  }
}

// Special export for Rank if needed
export { Rank };
