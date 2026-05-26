import { Card, Meld, ScoreBonus, ScorePenalty } from "../../types";
import { CardUtils } from "../engine/CardUtils";

export class ScoringEngine {
  // Get point value for a single card
  static getCardPoints(card: Card): number {
    return CardUtils.getCardValue(card);
  }

  // Calculate total points for a meld
  static getMeldPoints(meld: Meld): number {
    let total = 0;
    for (const card of meld.cards) {
      total += this.getCardPoints(card);
    }
    return total;
  }

  // Calculate base score from all melds on team table
  static calculateBaseScore(melds: Meld[]): number {
    let total = 0;
    for (const meld of melds) {
      const meldPoints = this.getMeldPoints(meld);
      total += meldPoints;
    }
    // Multiply by 10
    return Math.floor(total * 10);
  }

  // Calculate bonus points
  static calculateBonuses(melds: Meld[], _finishedPlayerIds: Set<string>): ScoreBonus[] {
    const bonuses: ScoreBonus[] = [];

    // Long meld bonuses (8+ cards)
    for (const meld of melds) {
      if (meld.cards.length >= 8) {
        const jokerCount = CardUtils.countJokers(meld.cards);
        if (jokerCount > 0) {
          bonuses.push({
            type: "LONG_MELD_JOKER",
            points: 100,
          });
        } else {
          bonuses.push({
            type: "LONG_MELD_PURE",
            points: 200,
          });
        }
      }
    }

    return bonuses;
  }

  // Calculate penalties for remaining cards
  static calculatePenalties(
    players: any[],
    finishedPlayerIds: Set<string>
  ): ScorePenalty[] {
    const penalties: ScorePenalty[] = [];

    for (const player of players) {
      // Only non-finishing players get penalties
      if (finishedPlayerIds.has(player.id)) continue;

      const remainingCards = player.hand || [];
      let penaltyPoints = 0;

      for (const card of remainingCards) {
        penaltyPoints += this.getCardPoints(card);
      }

      penalties.push({
        playerId: player.id,
        remainingCards,
        penaltyPoints,
      });
    }

    return penalties;
  }

  // Calculate total round score for team
  static calculateRoundScore(
    melds: Meld[],
    finishedPlayerIds: Set<string>,
    players: any[],
    teamFinished: boolean
  ): {
    baseScore: number;
    bonuses: ScoreBonus[];
    penalties: ScorePenalty[];
    totalScore: number;
  } {
    // Base score from melds
    const baseScore = this.calculateBaseScore(melds);

    // Bonuses
    const bonuses = this.calculateBonuses(melds, finishedPlayerIds);
    let bonusTotal = bonuses.reduce((sum, b) => sum + b.points, 0);

    // Add finish bonuses
    if (finishedPlayerIds.size > 0) {
      bonuses.push({
        type: "FIRST_HAND",
        points: 50,
      });
    }

    // Penalties
    const penalties = this.calculatePenalties(players, finishedPlayerIds);
    const penaltyTotal = penalties.reduce((sum, p) => sum + p.penaltyPoints, 0);

    // Team finish bonus
    if (teamFinished) {
      bonuses.push({
        type: "TEAM_FINISH",
        points: 50,
      });
      bonusTotal += 50;
    }

    const totalScore = baseScore + bonusTotal - penaltyTotal;

    return {
      baseScore,
      bonuses,
      penalties,
      totalScore,
    };
  }

  // Check if team should have passed 1000+ restrictions
  static shouldHave1000Restriction(teamScore: number): boolean {
    return teamScore >= 1000;
  }

  // Validate meld against 1000+ point restriction
  static validateMeldFor1000Restriction(
    playerMelds: Meld[]
  ): { hasPureSequence: boolean; hasMinimumPoints: boolean } {
    // Must have at least one pure sequence
    const hasPureSequence = playerMelds.some(
      (m) => m.type === "SEQUENCE" && CardUtils.countJokers(m.cards) === 0
    );

    // Must have minimum 10 points
    const totalPoints = playerMelds.reduce((sum, meld) => sum + this.getMeldPoints(meld), 0);
    const hasMinimumPoints = totalPoints >= 10;

    return { hasPureSequence, hasMinimumPoints };
  }
}
