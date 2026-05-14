export type Role = 'innocent' | 'imposter';
export type GamePhase = 'lobby' | 'answering' | 'reveal' | 'voting' | 'results';

export interface Player {
  id: string;
  name: string;
  role?: Role | null;
  answer?: string | null;
  vote?: string | null;
  score: number;
  isReady: boolean;
  isHost: boolean;
  avatarColor: string;
}

export interface QuestionTheme {
  theme: string;
  innocentQuestion: string;
  imposterQuestion: string;
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  timer: number;
  currentTheme?: QuestionTheme | null;
  winner?: Role | null;
  votedOutPlayerId?: string | null;
}

export interface ServerToClientEvents {
  gameStateUpdate: (state: GameState) => void;
  gameStarted: (state: GameState) => void;
  phaseTransition: (phase: GamePhase, state: GameState) => void;
  playerVoted: (voterId: string, targetId: string) => void;
  results: (winner: Role, votedOutId?: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (name: string) => void;
  toggleReady: () => void;
  submitAnswer: (answer: string) => void;
  submitVote: (targetId: string) => void;
  playAgain: () => void;
}
