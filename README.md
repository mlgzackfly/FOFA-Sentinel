# FOFA API Client

A modern, hacker-style web application for interacting with the FOFA API.

## Features

- 🔍 **Complete FOFA API Integration** - All API endpoints supported
- 💾 **Query History** - Save and manage your search queries
- 📊 **Result Storage** - Store query results in SQLite database
- 📄 **Export to TXT** - Export results in text format
- 🔐 **API Key Management** - Secure API key storage
- 🎨 **Hacker-Style UI** - Modern, professional interface with terminal aesthetics

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file (optional)
cp .env.example .env

# Run development server (both frontend and backend)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### First Time Setup

1. Start the application: `npm run dev`
2. Navigate to the Settings page (CONFIG in sidebar)
3. Enter your FOFA API credentials:
   - FOFA Email: Your FOFA account email
   - FOFA API Key: Your API key from https://fofa.info/user/personal
4. Click "SAVE" to store your credentials

### Build for Production

```bash
npm run build
```

### Running Production Build

After building, you can run the production server:

```bash
# Start the server
npm run build:server

# The server will run on port 3001 (or PORT from .env)
# Serve the frontend build from dist/client using any static file server
```

## Project Structure

```
fofa/
├── src/
│   ├── server/          # Backend server
│   │   ├── index.ts     # Server entry point
│   │   ├── routes/      # API routes
│   │   ├── db/          # Database setup
│   │   └── services/    # Business logic
│   ├── client/          # Frontend React app
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utilities
│   └── shared/          # Shared types
├── data/                # SQLite database files
└── public/              # Static assets
```

## API Endpoints

### FOFA API Wrapper
- `POST /api/fofa/search` - Search hosts
- `POST /api/fofa/stats` - Get statistics
- `POST /api/fofa/host` - Host aggregation
- `GET /api/fofa/account` - Account information
- `POST /api/fofa/search-after` - Search after (pagination)

### Application API
- `GET /api/history` - Get query history
- `GET /api/history/:id` - Get specific query
- `DELETE /api/history/:id` - Delete query
- `GET /api/results/:id` - Get query results
- `POST /api/export/:id` - Export results as TXT
- `POST /api/config/key` - Save API key
- `GET /api/config/key` - Get API key (masked)

## License

MIT

