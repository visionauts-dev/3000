import {
  GameMatch,
  GameState,
  MatchType,
  Player,
  Team,
  Round,
  Card,
  Meld,
  DrawChoice,
} from "../../types";
import { CardUtils } from "./CardUtils";
import { MeldValidator } from "../validators/MeldValidator";
import { ScoringEngine } from "../scoring/ScoringEngine";
import { v4 as uuidv4 } from "uuid";

interface TurnState {
  hasDrawn: boolean;
}

export class GameEngine {
  private match: GameMatch;
  private turnState: TurnState = { hasDrawn: false };
  private turnTimerHandle?: ReturnType<typeof setTimeout>;
  private onTurnTimeout?: (playerId: string) => void;

  constructor(matchType: MatchType, players: Player[]) {
    const teams = this.initializeTeams(matchType, players);
    this.match = {
      id: uuidv4(),
      type: matchType,
      state: GameState.LOBBY,
      teams,
      players,
      rounds: [],
      currentRound: null as unknown as Round,
      matchStartTime: new Date(),
      finished: false,
    };
  }

  // ============ INITIALIZATION ============

  private initializeTeams(matchType: MatchType, players: Player[]): Team[] {
    const playersPerTeam = matchType === MatchType.TWO_VS_TWO ? 2 : 3;
    const teams: Team[] = [];

    for (let i = 0; i < 2; i++) {
      const teamPlayers = players.slice(i * playersPerTeam, (i + 1) * playersPerTeam);
      const team: Team = {
        id: uuidv4(),
        name: `Team ${String.fromCharCode(65 + i)}`,
        players: teamPlayers,
        melds: [],
        totalScore: 0,
        hasStarted: false,
      };
      teams.push(team);
    }

    // Assign teamId to each player
    for (const team of teams) {
      for (const player of team.players) {
        player.teamId = team.id;
      }
    }

    return teams;
  }

  // Determine seating in alternating team order
  determineSeatings(): Player[] {
    const teams = this.match.teams;
    const seating: Player[] = [];
    const playerIndex = [0, 0];
    let teamIndex = 0;

    while (seating.length < this.match.players.length) {
      const team = teams[teamIndex];
      if (playerIndex[teamIndex] < team.players.length) {
        seating.push(team.players[playerIndex[teamIndex]]);
        playerIndex[teamIndex]++;
      }
      teamIndex = 1 - teamIndex;
    }

    seating.forEach((player, index) => {
      player.seatPosition = index;
    });

    return seating;
  }

  // Deal cards for round
  dealCards(): void {
    const deck = CardUtils.shuffleDeck(CardUtils.createThreeDeckDeck());
    let cardIndex = 0;

    for (const player of this.match.players) {
      player.hand = deck.slice(cardIndex, cardIndex + 13);
      cardIndex += 13;
    }

    for (const player of this.match.players) {
      player.reserveHand = deck.slice(cardIndex, cardIndex + 13);
      cardIndex += 13;
    }

    const drawPile = deck.slice(cardIndex);

    this.match.currentRound = {
      id: uuidv4(),
      roundNumber: this.match.rounds.length + 1,
      startTime: new Date(),
      teams: this.match.teams,
      currentPlayer: this.match.players[0],
      currentTurnNumber: 0,
      discardPile: { cards: [] },
      drawPile: { cards: drawPile },
      finished: false,
    };

    this.match.rounds.push(this.match.currentRound);
    this.match.state = GameState.PLAYER_TURN;
    this.turnState = { hasDrawn: false };
  }

  // Start game (deal + set state)
  startGame(): void {
    this.match.state = GameState.DEALING;
    this.dealCards();
  }

  // ============ TURN ACTIONS ============

  drawCard(playerId: string, choice: DrawChoice): Card[] {
    const player = this.match.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player not found");
    if (player.id !== this.match.currentRound.currentPlayer.id) {
      throw new Error("Not your turn");
    }
    if (this.turnState.hasDrawn) throw new Error("Already drew this turn");

    const round = this.match.currentRound;
    let cardsDrawn: Card[] = [];

    if (choice === DrawChoice.DRAW_FROM_DECK) {
      if (round.drawPile.cards.length === 0) {
        round.drawPile.cards = CardUtils.shuffleDeck([...round.discardPile.cards]);
        round.discardPile.cards = [];
      }
      const card = round.drawPile.cards.pop();
      if (card) {
        cardsDrawn = [card];
        player.hand.push(card);
      }
    } else if (choice === DrawChoice.TAKE_DISCARD_PILE) {
      if (round.discardPile.cards.length === 0) {
        throw new Error("Discard pile is empty");
      }
      cardsDrawn = [...round.discardPile.cards];
      player.hand.push(...cardsDrawn);
      round.discardPile.cards = [];
    }

    this.turnState.hasDrawn = true;
    this.match.state = GameState.MELD_PHASE;
    return cardsDrawn;
  }

  placeMeld(playerId: string, cards: Card[], teamId: string): Meld | null {
    const team = this.match.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Team not found");

    if (!this.turnState.hasDrawn) throw new Error("Must draw before placing melds");

    const meldType = MeldValidator.determineMeldType(cards);
    if (!meldType) return null;

    // Enforce 1000+ restriction: first meld of round must be a pure sequence
    if (ScoringEngine.shouldHave1000Restriction(team.totalScore) && !team.hasStarted) {
      const isPureSeq = meldType === "SEQUENCE" && CardUtils.countJokers(cards) === 0;
      if (!isPureSeq) {
        throw new Error("Team with 1000+ points must open with a pure sequence");
      }
      const totalPoints = cards.reduce((sum, c) => sum + CardUtils.getCardValue(c), 0);
      if (totalPoints < 10) {
        throw new Error("Team with 1000+ points must meld at least 10 points to open");
      }
    }

    const isPure = meldType === "SEQUENCE" && CardUtils.countJokers(cards) === 0;

    const meld: Meld = {
      id: uuidv4(),
      teamId,
      cards,
      type: meldType,
      isValid: true,
      isPureSequence: isPure,
      jokerCount: CardUtils.countJokers(cards),
    };

    team.melds.push(meld);
    team.hasStarted = true;

    const player = this.match.players.find((p) => p.id === playerId);
    if (player) {
      player.hand = player.hand.filter((c) => !cards.some((mc) => mc.id === c.id));
    }

    return meld;
  }

  extendMeld(playerId: string, meldId: string, cards: Card[]): boolean {
    const meld = this.getAllMelds().find((m) => m.id === meldId);
    if (!meld) return false;

    if (!this.turnState.hasDrawn) throw new Error("Must draw before extending melds");

    for (const card of cards) {
      if (!MeldValidator.canExtendMeld(meld, card)) return false;
    }

    meld.cards.push(...cards);
    meld.jokerCount = CardUtils.countJokers(meld.cards);
    meld.isPureSequence = meld.type === "SEQUENCE" && meld.jokerCount === 0;

    const player = this.match.players.find((p) => p.id === playerId);
    if (player) {
      player.hand = player.hand.filter((c) => !cards.some((mc) => mc.id === c.id));
    }

    return true;
  }

  discardCard(playerId: string, card: Card): void {
    const player = this.match.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player not found");
    if (player.id !== this.match.currentRound.currentPlayer.id) {
      throw new Error("Not your turn");
    }
    if (!this.turnState.hasDrawn) throw new Error("Must draw before discarding");

    player.hand = player.hand.filter((c) => c.id !== card.id);
    this.match.currentRound.discardPile.cards.push(card);

    // Activate reserve hand if active hand is empty
    if (player.hand.length === 0 && player.reserveHand.length > 0) {
      player.hand = [...player.reserveHand];
      player.reserveHand = [];
    }

    this.nextTurn();
  }

  finishHand(playerId: string): boolean {
    const player = this.match.players.find((p) => p.id === playerId);
    if (!player) return false;
    if (player.id !== this.match.currentRound.currentPlayer.id) return false;
    if (player.hand.length !== 0) return false;
    if (!this.turnState.hasDrawn) return false;

    // Activate reserve if needed, then check again
    if (player.reserveHand.length > 0) {
      player.hand = [...player.reserveHand];
      player.reserveHand = [];
      // Player continues with reserve hand
      this.nextTurn();
      return true;
    }

    player.finished = true;
    this.match.currentRound.finishingPlayer = player;
    this.checkRoundEnd();
    return true;
  }

  // ============ TURN TIMER ============

  setTurnTimeoutHandler(handler: (playerId: string) => void): void {
    this.onTurnTimeout = handler;
  }

  startTurnTimer(timeoutMs: number): void {
    this.clearTurnTimer();
    const currentPlayerId = this.match.currentRound?.currentPlayer?.id;
    if (!currentPlayerId) return;

    this.turnTimerHandle = setTimeout(() => {
      // Auto-discard: draw from deck and discard first card
      try {
        const player = this.match.players.find((p) => p.id === currentPlayerId);
        if (player && !this.turnState.hasDrawn) {
          const cards = this.drawCard(currentPlayerId, DrawChoice.DRAW_FROM_DECK);
          if (cards.length > 0) {
            this.discardCard(currentPlayerId, cards[0]);
          }
        } else if (player && player.hand.length > 0) {
          this.discardCard(currentPlayerId, player.hand[0]);
        }
        this.onTurnTimeout?.(currentPlayerId);
      } catch {
        // Turn already advanced
      }
    }, timeoutMs);
  }

  clearTurnTimer(): void {
    if (this.turnTimerHandle) {
      clearTimeout(this.turnTimerHandle);
      this.turnTimerHandle = undefined;
    }
  }

  // ============ GAME STATE MANAGEMENT ============

  private nextTurn(): void {
    this.clearTurnTimer();
    const round = this.match.currentRound;
    const activePlayers = this.match.players.filter((p) => !p.finished);

    if (activePlayers.length === 0) {
      this.checkRoundEnd();
      return;
    }

    const currentIndex = activePlayers.findIndex((p) => p.id === round.currentPlayer.id);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    round.currentPlayer = activePlayers[nextIndex];
    round.currentTurnNumber++;
    this.turnState = { hasDrawn: false };
    this.match.state = GameState.PLAYER_TURN;
  }

  private checkRoundEnd(): void {
    const round = this.match.currentRound;
    const finishingPlayer = round.finishingPlayer;
    if (!finishingPlayer) return;

    if (finishingPlayer.hand.length === 0 && finishingPlayer.reserveHand.length === 0) {
      this.endRound();
    }
  }

  private endRound(): void {
    const round = this.match.currentRound;
    round.finished = true;
    round.endTime = new Date();
    this.match.state = GameState.ROUND_END;
    this.clearTurnTimer();

    for (const team of this.match.teams) {
      const finishedPlayerIds = new Set(
        team.players.filter((p) => p.finished).map((p) => p.id)
      );
      const score = ScoringEngine.calculateRoundScore(
        team.melds,
        finishedPlayerIds,
        team.players,
        finishedPlayerIds.size === team.players.length
      );
      team.totalScore += score.totalScore;

      if (team.totalScore >= 3000) {
        this.endMatch(team);
        return;
      }
    }

    this.prepareNextRound();
  }

  private prepareNextRound(): void {
    for (const player of this.match.players) {
      player.finished = false;
      player.hand = [];
      player.reserveHand = [];
    }

    for (const team of this.match.teams) {
      team.melds = [];
      team.hasStarted = false;
    }

    this.dealCards();
  }

  private endMatch(winningTeam: Team): void {
    this.match.winningTeam = winningTeam;
    this.match.matchEndTime = new Date();
    this.match.finished = true;
    this.match.state = GameState.MATCH_END;
    this.clearTurnTimer();
  }

  // ============ UTILITIES ============

  private getAllMelds(): Meld[] {
    return this.match.teams.reduce<Meld[]>((acc, team) => [...acc, ...team.melds], []);
  }

  getMatch(): GameMatch { return this.match; }
  getState(): GameState { return this.match.state; }
  getTeams(): Team[] { return this.match.teams; }
  getPlayers(): Player[] { return this.match.players; }
  getCurrentRound(): Round { return this.match.currentRound; }
  getCurrentPlayer(): Player { return this.match.currentRound?.currentPlayer; }
  hasTurnDrawn(): boolean { return this.turnState.hasDrawn; }
}
