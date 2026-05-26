# 🏗️ Game 3000 Architecture Documentation

## System Overview

Game 3000 is a production-grade multiplayer card game engine built with a **server-authoritative** architecture. All game decisions are made server-side to ensure fair play and prevent cheating.

## Architecture Principles

### 1. Server-Authoritative Design
The server is the single source of truth for:
- Game state
- Rule validation
- Scoring calculations
- Winning conditions
- Card distribution

Frontend can only:
- Render UI
- Accept user input
- Display game state
- Show animations

### 2. Real-Time Synchronization
- WebSocket (Socket.IO) for instant updates
- All players see consistent game state
- Automatic reconnection handling
- Graceful handling of disconnected players

### 3. Deterministic Game Engine
- Same input → Same output (always)
- No randomness in validation
- Reproducible game progression
- Audit trail capability

## Technology Stack Rationale

### Frontend: React + TypeScript
- **Why React**: Component-based, large ecosystem, performance
- **Why TypeScript**: Type safety, better IDE support, fewer runtime errors
- **Why Vite**: Fast development, optimal production builds
- **Why Tailwind**: Utility-first, responsive, production-ready styling

### Backend: Node.js + Express
- **Why Node**: JavaScript for full-stack, great for I/O operations
- **Why Express**: Lightweight, battle-tested, large ecosystem
- **Why TypeScript**: Same reason as frontend
- **Why Socket.IO**: Reliable WebSocket layer with fallbacks

### State Management
- **Frontend**: Zustand (lightweight, flexible Zustand store)
- **Backend**: In-memory (with Redis for persistence)

### Data Storage
- **PostgreSQL**: Structured game data, transactions, relationships
- **Redis**: Session state, caching, real-time game state

## Core Game Engine Design

```
GameEngine
├── Match Management
│   ├── Team creation and assignment
│   ├── Player seating arrangement
│   └── Round progression
├── Game State Machine
│   ├── LOBBY
│   ├── TEAM_SELECTION
│   ├── SEATING
│   ├── DEALING
│   ├── ROUND_START
│   ├── PLAYER_TURN
│   ├── DRAW_PHASE
│   ├── MELD_PHASE
│   ├── DISCARD_PHASE
│   ├── ROUND_END
│   └── MATCH_END
├── Turn Management
│   ├── Draw handling
│   ├── Meld placement
│   ├── Discard execution
│   └── Player rotation
└── Round Resolution
    ├── Score calculation
    ├── Bonus application
    ├── Penalty assessment
    └── Winner determination
```

## Meld Validation System

### Sequence Validation
```
Input: Array of Cards
↓
Check Length ≥ 3
↓
Count Jokers (max 1)
↓
Check Suit Consistency (non-joker cards)
↓
Check Rank Consecutiveness
↓
Output: Valid | Invalid
```

### Set Validation
```
Input: Array of Cards
↓
Check Length ≥ 3
↓
Count Jokers (max 1)
↓
Check Rank Consistency
↓
Check Maximum 3 of Same Rank
↓
Output: Valid | Invalid
```

### Joker Transformation Logic
```
1. Check if team has pure sequence (min 2 required for transformation)
2. Identify 2-rank cards acting as jokers
3. Allow transformation if:
   - More than 1 pure sequence exists
   - No violation of pure sequence protection rule
4. Update meld state
```

## Scoring System Architecture

### Three-Layer Scoring

1. **Base Score Layer**
   - Sum card point values
   - Multiply by 10
   - Formula: `sum(card.points) × 10`

2. **Bonus Layer**
   - First hand completion: +50
   - Reserve hand completion: +50
   - Long meld (8+ cards) with joker: +100
   - Long meld (8+ cards) pure: +200
   - Team finish: +50
   - **Bonuses stack**

3. **Penalty Layer**
   - Remaining card in hand: negative point value
   - Applied to all non-finishing players
   - Automatically calculated

### Final Score
```
Score = Base + Σ(Bonuses) - Σ(Penalties)
```

## Data Flow Diagrams

### Player Draw Action
```
Frontend: User clicks "Draw from Deck"
↓
Emit: DRAW_CARD event with playerId, choice
↓
Backend: Validate current player
↓
Backend: Validate game state (DRAW_PHASE)
↓
Backend: Draw card from deck
↓
Backend: Add to player hand
↓
Backend: Transition to MELD_PHASE
↓
Broadcast: CARDS_DRAWN to all players
↓
Frontend: Update game state
↓
Frontend: Render animation
↓
Frontend: Enable meld/discard buttons
```

### Meld Placement Action
```
Frontend: User selects cards and clicks "Place Meld"
↓
Emit: PLACE_MELD with cards array, teamId
↓
Backend: Validate current player
↓
Backend: Validate meld legality
│   ├── Check sequence/set validity
│   ├── Check 1000+ point restrictions
│   └── Check joker rules
↓
Backend: If invalid → Emit ERROR
↓
Backend: If valid → Create Meld object
↓
Backend: Add to team melds
↓
Backend: Remove from player hand
↓
Broadcast: MELD_PLACED to all players
↓
Frontend: Update game state
↓
Frontend: Render meld animation
```

## Connection Management

### Player Connection Lifecycle
```
1. JOIN_GAME
   - Verify gameId and playerId
   - Add to Socket.IO room
   - Send full game state
   - Notify other players

2. ACTIVE (during game)
   - Send/receive game events
   - Monitor heartbeat
   - Track last activity time

3. DISCONNECTED (unintended)
   - Player marked as disconnected
   - Turn skipped if active
   - Reconnection window (5 minutes)
   - Can rejoin with same playerId

4. TIMEOUT (no activity)
   - After 5 minutes, auto-skip
   - After 10 minutes, remove player
   - Team plays with reduced players

5. LEFT_GAME
   - Player intentionally leaves
   - Game continues or ends
   - Recorded in match history
```

## State Persistence Strategy

### In-Memory State (Development)
- Entire game state in RAM
- Cleared on server restart
- Suitable for development/testing

### Redis State (Production)
```
game:{gameId} → Complete game state (JSON)
  ├── match object
  ├── teams
  ├── players
  ├── rounds
  └── current round state

player:{playerId} → Player session
  ├── gameId
  ├── team id
  └── connection status
```

### PostgreSQL Persistence (Future)
```
Tables:
- games
- teams
- players
- rounds
- melds
- turns
- scores
- match_history
```

## Error Handling Strategy

### Validation Errors (400)
- Invalid meld
- Out of turn
- Insufficient cards
- Rule violations

### Not Found Errors (404)
- Game not found
- Player not found
- Card not found

### Server Errors (500)
- Database connection failure
- Unexpected state transition
- Invalid calculations

### Error Response
```json
{
  "type": "ERROR",
  "code": "INVALID_MELD",
  "message": "Selected cards do not form a valid sequence",
  "details": { /* context */ }
}
```

## Performance Considerations

### Optimization Strategies

1. **Game State**
   - Serialize only changed properties
   - Broadcast diffs instead of full state
   - Compress before transmission

2. **Card Operations**
   - Pre-calculate valid melds (future)
   - Cache sorted cards
   - Memoize validation results

3. **Network**
   - Batch updates (50ms window)
   - Compression for large payloads
   - Rate limiting for actions (100ms between actions)

4. **Database** (Future)
   - Index on gameId, playerId, teamId
   - Connection pooling
   - Query optimization

### Scalability Notes
- Single instance: 100-500 concurrent games
- With Redis: 1000+ concurrent games
- With load balancing: 10000+ concurrent games

## Security Measures

### Input Validation
- All inputs validated server-side
- Card IDs verified against deck
- Player IDs verified against session

### Authorization
- Only player's own actions allowed
- Can only modify own hand
- Can only access visible information

### Anti-Cheat
- Server calculates all scores
- No client-side decision acceptance
- Audit trail of all actions
- Statistical anomaly detection (future)

### Rate Limiting
- 100ms minimum between actions
- Timeout disconnection for spam
- Rate limit per IP (future)

## Testing Strategy (Future)

### Unit Tests
- Card utilities
- Meld validation
- Scoring engine
- State transitions

### Integration Tests
- Complete game flows
- Player interactions
- State synchronization
- Error conditions

### Load Tests
- 100 concurrent games
- Network latency simulation
- State update frequency

## Deployment Architecture

### Development
```
Frontend → Vite dev server (3000)
Backend → ts-node (3001)
Database → Local PostgreSQL
Cache → Local Redis
```

### Production
```
Frontend → Nginx (static + SSL)
Backend → Node.js cluster
Database → Managed PostgreSQL
Cache → Redis cluster
```

### Docker Deployment
```
Docker Compose:
- Frontend service
- Backend service
- PostgreSQL container
- Redis container
- Nginx reverse proxy
```

## Future Enhancements

1. **Authentication**
   - User accounts
   - OAuth integration
   - Session management

2. **Matchmaking**
   - Rating system
   - Skill-based matching
   - Queue management

3. **Analytics**
   - Game statistics
   - Win rates
   - Card usage patterns

4. **Social Features**
   - Chat/messaging
   - Spectating
   - Replays

5. **Mobile App**
   - React Native version
   - Native optimizations
   - Offline support

6. **Advanced Features**
   - Tournament system
   - Achievements
   - Seasonal rankings
   - Streaming integration

## Troubleshooting Guide

### Game State Inconsistency
1. Check server logs
2. Verify database state
3. Force state resync from server
4. Reconnect all players

### Performance Issues
1. Check Redis connection
2. Monitor PostgreSQL queries
3. Check network latency
4. Reduce update frequency

### Frequent Disconnections
1. Check network stability
2. Verify WebSocket health
3. Check firewall/proxy rules
4. Consider regional servers

---

**Architecture designed for reliability, scalability, and fair play** ⚖️
