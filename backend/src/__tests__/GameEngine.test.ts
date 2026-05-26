import { GameEngine } from "../game/engine/GameEngine";
import { MatchType, DrawChoice, Player } from "../types";

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    username: `Player${i + 1}`,
    teamId: "",
    hand: [],
    reserveHand: [],
    score: 0,
    finished: false,
    isConnected: true,
  }));
}

describe("GameEngine - 2v2", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(MatchType.TWO_VS_TWO, makePlayers(4));
  });

  it("initializes with LOBBY state", () => {
    expect(engine.getState()).toBe("LOBBY");
  });

  it("creates 2 teams", () => {
    expect(engine.getTeams().length).toBe(2);
  });

  it("assigns 2 players per team", () => {
    const teams = engine.getTeams();
    expect(teams[0].players.length).toBe(2);
    expect(teams[1].players.length).toBe(2);
  });

  it("assigns teamIds to players after initialization", () => {
    const ps = engine.getPlayers();
    expect(ps.every((p) => p.teamId !== "")).toBe(true);
  });

  describe("after startGame", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("transitions to PLAYER_TURN state", () => {
      expect(engine.getState()).toBe("PLAYER_TURN");
    });

    it("deals 13 cards to each player", () => {
      const ps = engine.getPlayers();
      expect(ps.every((p) => p.hand.length === 13)).toBe(true);
    });

    it("deals 13 reserve cards to each player", () => {
      const ps = engine.getPlayers();
      expect(ps.every((p) => p.reserveHand.length === 13)).toBe(true);
    });

    it("creates a draw pile", () => {
      expect(engine.getCurrentRound().drawPile.cards.length).toBeGreaterThan(0);
    });

    it("hasDrawn starts as false", () => {
      expect(engine.hasTurnDrawn()).toBe(false);
    });
  });

  describe("turn flow", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("draw from deck adds a card to player hand", () => {
      const currentPlayer = engine.getCurrentPlayer();
      const handBefore = currentPlayer.hand.length;
      engine.drawCard(currentPlayer.id, DrawChoice.DRAW_FROM_DECK);
      expect(currentPlayer.hand.length).toBe(handBefore + 1);
    });

    it("marks hasDrawn after drawing", () => {
      const currentPlayer = engine.getCurrentPlayer();
      engine.drawCard(currentPlayer.id, DrawChoice.DRAW_FROM_DECK);
      expect(engine.hasTurnDrawn()).toBe(true);
    });

    it("discard advances to next player", () => {
      const p1 = engine.getCurrentPlayer();
      engine.drawCard(p1.id, DrawChoice.DRAW_FROM_DECK);
      const card = p1.hand[0];
      engine.discardCard(p1.id, card);
      const p2 = engine.getCurrentPlayer();
      expect(p2.id).not.toBe(p1.id);
    });

    it("cannot discard without drawing first", () => {
      const p1 = engine.getCurrentPlayer();
      const card = p1.hand[0];
      expect(() => engine.discardCard(p1.id, card)).toThrow("Must draw before discarding");
    });

    it("cannot draw twice in the same turn", () => {
      const p1 = engine.getCurrentPlayer();
      engine.drawCard(p1.id, DrawChoice.DRAW_FROM_DECK);
      expect(() => engine.drawCard(p1.id, DrawChoice.DRAW_FROM_DECK)).toThrow(
        "Already drew this turn"
      );
    });

    it("wrong player cannot draw", () => {
      const allPlayers = engine.getPlayers();
      const nonCurrent = allPlayers.find((p) => p.id !== engine.getCurrentPlayer().id)!;
      expect(() => engine.drawCard(nonCurrent.id, DrawChoice.DRAW_FROM_DECK)).toThrow(
        "Not your turn"
      );
    });

    it("discard adds card to discard pile", () => {
      const p1 = engine.getCurrentPlayer();
      engine.drawCard(p1.id, DrawChoice.DRAW_FROM_DECK);
      const card = p1.hand[0];
      engine.discardCard(p1.id, card);
      const discardPile = engine.getCurrentRound().discardPile.cards;
      expect(discardPile.some((c) => c.id === card.id)).toBe(true);
    });
  });

  describe("place meld", () => {
    beforeEach(() => {
      engine.startGame();
    });

    it("cannot place meld before drawing", () => {
      const p1 = engine.getCurrentPlayer();
      const team = engine.getTeams().find((t) => t.id === p1.teamId)!;
      expect(() =>
        engine.placeMeld(p1.id, p1.hand.slice(0, 3), team.id)
      ).toThrow("Must draw before placing melds");
    });
  });
});

describe("GameEngine - 3v3", () => {
  it("creates 3 players per team", () => {
    const engine = new GameEngine(MatchType.THREE_VS_THREE, makePlayers(6));
    const teams = engine.getTeams();
    expect(teams[0].players.length).toBe(3);
    expect(teams[1].players.length).toBe(3);
  });

  it("deals valid number of cards after start", () => {    const engine = new GameEngine(MatchType.THREE_VS_THREE, makePlayers(6));
    engine.startGame();
    const ps = engine.getPlayers();
    expect(ps.every((p) => p.hand.length === 13)).toBe(true);
    expect(ps.every((p) => p.reserveHand.length === 13)).toBe(true);
  });
});

