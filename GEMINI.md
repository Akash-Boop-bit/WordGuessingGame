# Imposter Word Game - Project Context

This document serves as a persistent memory for AI assistants to quickly understand the project state and architecture, minimizing redundant research turns.

## 🚀 Project Overview
A real-time social deduction game (Among Us style) for 4-8 players.
- **Goal:** Crewmates (Innocents) must vote out the 1 Imposter.
- **Mechanic:** Everyone gets a question. The Imposter's question is different but on the same theme. Players answer with one word, then vote based on the answers.

## 🛠 Tech Stack
- **Frontend:** React (TypeScript), Vite, Tailwind CSS, Framer Motion (animations), Lucide React (icons).
- **Backend:** Node.js, Express, Socket.io (real-time communication).
- **Shared:** TypeScript types defined in `/shared/types.ts`.

## 📁 Directory Structure
- `/client`: React frontend. Runs on `http://localhost:5173`.
- `/server`: Node.js/Socket.io backend. Runs on `http://localhost:3001`.
- `/shared`: Shared TypeScript interfaces for game state and socket events.

## 🕹 Game Loop (Phases)
1. **Lobby:** Players join and "Ready Up". Minimum 4 players to start.
2. **Answering:** Players receive their specific question based on their role and submit a one-word answer.
3. **Reveal:** All player answers are shown simultaneously.
4. **Voting:** Players discuss and vote for the suspected imposter.
5. **Results:** Winner is declared, roles are revealed, and the host can trigger "Play Again".

## 📡 Socket Events
### Client to Server
- `joinRoom(name)`: Join the lobby.
- `toggleReady()`: Change readiness state.
- `submitAnswer(word)`: Send answer during Answering phase.
- `submitVote(targetId)`: Vote for a player during Voting phase.
- `playAgain()`: Reset game (Host only).

### Server to Client
- `gameStateUpdate`: Syncs the entire `GameState` object.

## 📝 Current Development State
- **Core Loop:** Fully implemented and functional.
- **UI:** Polished Space/Among Us theme with animations.
- **GitHub:** Pushed to `https://github.com/Akash-Boop-bit/WordGuessingGame.git`.
- **Known Fixes:** Server `tsconfig.json` updated for CommonJS compatibility; type system allows `null` for optional state properties to prevent crashes.

## 🛠 How to Run
1. **Server:** `cd server && npm run dev`
2. **Client:** `cd client && npm run dev`
