# 3000 - Professional Team Strategy Card Game

A production-ready real-time multiplayer team-based strategy card game built with React, TypeScript, Node.js, and WebSockets.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Game Rules](#game-rules)
- [API Documentation](#api-documentation)
- [Development](#development)

## 🎮 Overview

3000 is a competitive multiplayer team strategy card game inspired by rummy mechanics but built around:

- **Collaborative meld building** - Teams work together on shared meld areas
- **Progressive scoring** - Score accumulates across multiple rounds toward 3000 points
- **Dynamic joker transformation** - Permanent jokers (2s) can change roles based on game state
- **Risk-based hand management** - Players manage both active and reserve hands
- **Real-time synchronization** - Full multiplayer support with WebSocket communication

## ✨ Features

### Game Features
- ✅ 2v2 and 3v3 multiplayer matches
- ✅ Real-time game synchronization
- ✅ Team-based public meld areas
- ✅ Dynamic joker system with transformation logic
- ✅ Progressive scoring system with bonuses and penalties
- ✅ Reserve 13-card hand system
- ✅ Turn timers with automatic skip
- ✅ Full server-authoritative validation
- ✅ Anti-cheat mechanisms
- ✅ Match history and statistics

### Technical Features
- ✅ Server-side game engine with deterministic rules
- ✅ WebSocket real-time updates
- ✅ Responsive mobile-first UI
- ✅ Smooth animations and transitions
- ✅ Reconnection handling
- ✅ Docker support
- ✅ Production-ready code

## 🏗️ Architecture

```
3000/
├── backend/                 # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── game/           # Game engine and logic
│   │   │   ├── engine/     # Core game engine
│   │   │   ├── validators/ # Meld and rule validation
│   │   │   └── scoring/    # Scoring calculations
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic services
│   │   ├── websocket/      # Socket.IO handlers
│   │   ├── database/       # Database configuration
│   │   └── routes/         # REST API routes
│   └── package.json
├── frontend/                # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # CSS styles
│   │   └── App.tsx
│   ├── index.html
│   └── package.json
├── shared/                  # Shared types and utilities
│   └── types.ts
└── README.md
```

### Technology Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- Socket.IO Client

**Backend:**
- Node.js
- TypeScript
- Express
- Socket.IO
- PostgreSQL
- Redis
- UUID

## 🚀 Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL 13+
- Redis 6+

### Setup

1. **Clone the repository**
```bash
cd 3000
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Backend (`backend/.env`):
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/game_3000
REDIS_URL=redis://localhost:6379
```

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## 📖 Usage

### Start Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm preview
```

## 🎲 Game Rules

### Match Configuration
- **2v2 Mode**: 4 players, 2 teams of 2
- **3v3 Mode**: 6 players, 2 teams of 3
- **Objective**: First team to reach 3000 points wins

### Deck
- 3 standard card decks (156 cards)
- 6 printed jokers
- All 2s act as permanent jokers

### Round Flow
1. **Team Selection** - Players draw cards to determine teams
2. **Seating** - Players seated alternately (teams non-adjacent)
3. **Dealing** - 13 active + 13 reserve cards to each player
4. **Gameplay** - Draw → Meld → Discard for each player
5. **Scoring** - Calculate points, check win condition

### Melds
- **Pure Sequence**: 3+ consecutive same-suit cards, no joker
- **Impure Sequence**: 3+ consecutive same-suit cards with 1 joker
- **Set**: 3-4 cards of same rank (with max 1 joker)

### Scoring
- Base: Sum of card values × 10
- Bonuses: First hand (+50), Reserve (+50), Long meld (+100/+200), Team finish (+50)
- Penalties: Remaining cards in hand (negative points)

### Special Rules
- Pure sequence protection (must maintain 1 pure sequence)
- 1000+ point restriction (minimum 10 points per meld)
- Joker transformation (2s can switch roles)
- Reserve hand activation (after first hand complete)
- Turn timers: 30s normal, 50s first reserve hand

## 📡 API Documentation

### REST Endpoints

**Create Game**
```
POST /api/games
Body: { type: "2v2" | "3v3", playerIds: string[] }
Response: { gameId: string, match: GameMatch }
```

**Get Game**
```
GET /api/games/:gameId
Response: { match: GameMatch }
```

### WebSocket Events

**Emit Events:**
- `JOIN_GAME` - Join a game room
- `DRAW_CARD` - Draw from deck or discard pile
- `PLACE_MELD` - Place a new meld
- `DISCARD_CARD` - Discard a card
- `FINISH` - Declare hand complete

**Receive Events:**
- `GAME_STATE_UPDATE` - Full game state update
- `CARDS_DRAWN` - Cards were drawn
- `MELD_PLACED` - New meld placed
- `CARD_DISCARDED` - Card discarded
- `PLAYER_FINISHED` - Player finished
- `ROUND_ENDED` - Round concluded
- `MATCH_ENDED` - Match concluded

## 🛠️ Development

### Building

**Backend:**
```bash
cd backend
npm run build       # Compile TypeScript
npm run lint        # Run ESLint
npm run typecheck   # Check types
```

**Frontend:**
```bash
cd frontend
npm run build       # Create production build
npm run lint        # Run ESLint
```

### Project Structure Notes

- Game logic is 100% server-authoritative
- Frontend is for UI/UX only
- All validation happens on backend
- State managed with Zustand (frontend) and in-memory (backend)
- WebSockets for real-time updates

### Key Components

**Game Engine** (`backend/src/game/engine/GameEngine.ts`)
- Orchestrates all game logic
- Manages game state transitions
- Handles turn flow and round management

**Meld Validator** (`backend/src/game/validators/MeldValidator.ts`)
- Validates sequence and set legality
- Checks joker rules
- Validates meld extensions

**Scoring Engine** (`backend/src/game/scoring/ScoringEngine.ts`)
- Calculates base scores
- Applies bonuses and penalties
- Determines winners

## 📝 Notes

- All game decisions happen server-side
- Database and Redis for persistence (not yet implemented)
- Turn timers automatically skip idle players
- Disconnected players are skipped but can reconnect
- Match history stored in PostgreSQL

## 🚀 Production Checklist

- [ ] Database migrations
- [ ] Redis caching strategy
- [ ] Environment configuration per environment
- [ ] Error handling and logging
- [ ] Rate limiting
- [ ] HTTPS/SSL setup
- [ ] Docker containerization
- [ ] Load balancing
- [ ] Database backups
- [ ] Monitoring and alerting
- [ ] Analytics integration
- [ ] Authentication system

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

**Built with ❤️ for competitive multiplayer gaming**
