# 🎮 Game 3000 Setup Guide

## Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# The app will be available at http://localhost:3000
```

### Option 2: Local Development

#### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

#### Setup PostgreSQL (macOS with Homebrew)
```bash
brew install postgresql
brew services start postgresql
createdb game_3000
```

#### Setup PostgreSQL (Windows)
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/)
- Create database: `game_3000`

#### Setup Redis
```bash
brew install redis          # macOS
brew services start redis

# Or Windows - download from redis.io
```

#### Start Backend
```bash
cd backend
npm install
npm run dev
```

#### Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
3000/
├── backend/              # Node.js Express server
├── frontend/             # React Vite app
├── shared/               # Shared types
├── docker-compose.yml    # Docker setup
└── README.md
```

## Common Development Tasks

### Backend Development

```bash
cd backend

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npm run typecheck

# Start production server
npm start
```

### Frontend Development

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## Troubleshooting

### Port Already in Use
```bash
# macOS/Linux - Kill process on port
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Create database if missing
createdb game_3000

# Reset connection
psql -U game_user -d game_3000
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Build Errors
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install

# Clean build
rm -rf dist/
npm run build
```

## Environment Variables

### Backend (.env)
```
PORT=3001                    # Server port
NODE_ENV=development        # Environment
FRONTEND_URL=...            # CORS origin
DATABASE_URL=...            # PostgreSQL connection
REDIS_URL=...               # Redis connection
```

### Frontend (.env)
```
VITE_API_URL=...            # Backend API URL
VITE_WS_URL=...             # WebSocket URL
```

## Testing Game Locally

1. Open two browser tabs to `http://localhost:3000`
2. Each tab will be assigned different player IDs
3. Create a game and start playing

## Production Deployment

### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Build
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

### Deploy
Options:
- Heroku
- AWS ECS
- Google Cloud Run
- DigitalOcean App Platform
- Self-hosted (VPS)

## Database Migrations

```bash
# (Not yet implemented - add using Knex/TypeORM)
npm run migrate:up
npm run migrate:down
```

## Monitoring & Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Local development - check terminal output
```

## Performance Tips

1. **Database**: Add indexes on frequently queried columns
2. **Caching**: Use Redis for session/game state
3. **Assets**: Compress CSS/JS in production builds
4. **Network**: Use CDN for static assets
5. **Monitoring**: Set up error tracking (Sentry, etc)

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Start services
4. ✅ Test game locally
5. [ ] Implement database models
6. [ ] Add authentication
7. [ ] Deploy to production
8. [ ] Set up monitoring
9. [ ] Configure backups

## Support

- Check [README.md](README.md) for full documentation
- Review [Game Rules](GAME_RULES.md) for gameplay
- Check console errors for debugging
- Review server logs: `npm run dev` output

---

**Happy gaming! 🎲**
