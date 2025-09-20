export interface GameState {
  teamA: TeamState;
  teamB: TeamState;
  lastUpdated: number;
}

export interface TeamState {
  name: string;
  score: number;
}

export type GameAction =
  | { type: 'SCORE_UPDATE'; team: 'teamA' | 'teamB'; points: number }
  | { type: 'RESET_SCORES' }
  | { type: 'SET_TEAM_NAME'; team: 'teamA' | 'teamB'; name: string };

export interface GameMessage {
  type: 'game_state' | 'action' | 'error';
  data: GameState | GameAction | string;
  timestamp: number;
}

export interface WebSocketMessage {
  action: GameAction;
}

export interface Env {
  GAME_SESSION: DurableObjectNamespace;
}

export interface GameSessionState {
  gameState: GameState;
  connections: Set<WebSocket>;
}