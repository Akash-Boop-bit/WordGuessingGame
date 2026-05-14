import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  GameState, 
  Player, 
  GamePhase, 
  Role 
} from '../shared/types';
import { questionThemes } from './questions';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

let gameState: GameState = {
  players: [],
  phase: 'lobby',
  timer: 0
};

let timerInterval: NodeJS.Timeout | null = null;

const startTimer = (seconds: number, callback: () => void) => {
  if (timerInterval) clearInterval(timerInterval);
  gameState.timer = seconds;
  broadcastState();

  timerInterval = setInterval(() => {
    gameState.timer--;
    if (gameState.timer <= 0) {
      if (timerInterval) clearInterval(timerInterval);
      callback();
    }
    broadcastState();
  }, 1000);
};

const broadcastState = () => {
  io.emit('gameStateUpdate', gameState);
};

const transitionToPhase = (phase: GamePhase) => {
  gameState.phase = phase;
  
  if (phase === 'answering') {
    const randomTheme = questionThemes[Math.floor(Math.random() * questionThemes.length)];
    gameState.currentTheme = randomTheme;
    
    // Assign roles
    const imposterIndex = Math.floor(Math.random() * gameState.players.length);
    gameState.players.forEach((p, i) => {
      p.role = i === imposterIndex ? 'imposter' : 'innocent';
      p.answer = null;
      p.vote = null;
    });

    startTimer(15, () => transitionToPhase('reveal'));
  } else if (phase === 'reveal') {
    startTimer(5, () => transitionToPhase('voting'));
  } else if (phase === 'voting') {
    startTimer(45, () => resolveVotes());
  } else if (phase === 'results') {
    // Timer handles reset or play again logic if needed
  }
  
  broadcastState();
};

const resolveVotes = () => {
  const voteCounts: Record<string, number> = {};
  gameState.players.forEach(p => {
    if (p.vote) {
      voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let votedOutId: string | null = null;
  
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      votedOutId = id;
    }
  });

  const votedPlayer = gameState.players.find(p => p.id === votedOutId);
  
  if (votedPlayer?.role === 'imposter') {
    gameState.winner = 'innocent';
  } else {
    gameState.winner = 'imposter';
  }
  
  gameState.votedOutPlayerId = votedOutId;
  transitionToPhase('results');
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinRoom', (name) => {
    if (gameState.phase !== 'lobby') return;
    if (gameState.players.length >= 8) return;

    const newPlayer: Player = {
      id: socket.id,
      name,
      score: 0,
      isReady: false,
      isHost: gameState.players.length === 0,
      avatarColor: COLORS[gameState.players.length % COLORS.length]
    };

    gameState.players.push(newPlayer);
    broadcastState();
  });

  socket.on('toggleReady', () => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && gameState.phase === 'lobby') {
      player.isReady = !player.isReady;
      
      const allReady = gameState.players.length >= 4 && gameState.players.every(p => p.isReady);
      if (allReady) {
        transitionToPhase('answering');
      } else {
        broadcastState();
      }
    }
  });

  socket.on('submitAnswer', (answer) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && gameState.phase === 'answering') {
      player.answer = answer;
      
      const allAnswered = gameState.players.every(p => p.answer);
      if (allAnswered) {
        transitionToPhase('reveal');
      } else {
        broadcastState();
      }
    }
  });

  socket.on('submitVote', (targetId) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && gameState.phase === 'voting' && socket.id !== targetId) {
      player.vote = targetId;
      
      const allVoted = gameState.players.every(p => p.vote);
      if (allVoted) {
        resolveVotes();
      } else {
        broadcastState();
      }
    }
  });

  socket.on('playAgain', () => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player?.isHost) {
      gameState.phase = 'lobby';
      gameState.winner = null;
      gameState.votedOutPlayerId = null;
      gameState.currentTheme = null;
      gameState.players.forEach(p => {
        p.isReady = false;
        p.answer = null;
        p.vote = null;
      });
      broadcastState();
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    
    if (gameState.players.length === 0) {
      gameState.phase = 'lobby';
      if (timerInterval) clearInterval(timerInterval);
    } else {
      // Re-assign host if necessary
      if (!gameState.players.some(p => p.isHost) && gameState.players.length > 0) {
        gameState.players[0].isHost = true;
      }
    }
    broadcastState();
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
