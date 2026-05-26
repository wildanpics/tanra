export type Role = "civilian" | "impostor" | "mr_white" | "jester";

export type GamePhase =
  | "waiting"
  | "role-reveal"
  | "clue"
  | "discussion"
  | "voting"
  | "voting-reveal"
  | "result";

export type Difficulty = "easy" | "medium" | "hard";

export interface Player {
  id: string;
  username: string;
  avatar: string;
  role?: Role;
  word?: string;
  isAlive: boolean;
  isReady: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  votedFor?: string;
  isHost?: boolean;
  joinedAt?: number;
  isGhost?: boolean;
  isBot?: boolean;
}

export interface WordPair {
  id: string;
  civilian: string;
  impostor: string;
  category: string;
  difficulty: Difficulty;
  clues?: string[]; // Hardcoded clues for bot AI
}

export interface Message {
  id: string;
  playerId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  type?: "chat" | "system" | "emote";
}

export interface Vote {
  voterId: string;
  targetId: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  wordPairId?: string;
  timerEnd?: number;
  timerDuration?: number;
  impostorIds?: string[];
  mrWhiteIds?: string[];
  jesterIds?: string[];
  eliminatedPlayers?: string[];
  eliminatedPending?: string | null;
  winner?: "civilian" | "impostor" | "mr_white" | "jester" | null;
  revealedWord?: { civilian: string; impostor: string };
  wordPair?: WordPair; // the complete pair + clues for bots
  clueOrder?: string[];
  currentClueIndex?: number;
  sabotagedPlayerId?: string | null;
  sabotageUsed?: boolean;
  settings?: RoomSettings;
  startedAt?: number;
  endedAt?: number;
}

export interface RoomSettings {
  maxPlayers: number;
  impostorCount: number;
  clueTime: number;
  discussionTime: number;
  votingTime: number;
  difficulty: Difficulty;
  category: string;
  mrWhiteCount: number;
  jesterCount: number;
  hiddenDeath: boolean;
  micMode: "auto" | "open";
  impostorSabotage: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  createdAt: number;
  status: "waiting" | "playing" | "finished";
  players: Record<string, Player>;
  gameState: GameState;
  settings: RoomSettings;
}

export interface UserProfile {
  uid: string;
  username: string;
  avatar: string;
  email: string;
  createdAt: number;
  gamesPlayed?: number;
  wins?: number;
  impostorWins?: number;
  civilianWins?: number;
  mrWhiteWins?: number;
  jesterWins?: number;
}
