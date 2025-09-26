export interface TeamState {
  name: string;
  score: number;
  doOrDieCount: number; // 0-3のDo or Dieカウント
}

export interface TimerState {
  totalDuration: number;    // 設定された総時間（秒）
  startTime: number | null; // タイマー開始時のサーバー時刻（ミリ秒）
  isRunning: boolean;       // タイマーが動作中かどうか
  isPaused: boolean;        // 一時停止中かどうか
  pausedAt: number | null;  // 一時停止したサーバー時刻（ミリ秒）
  remainingSeconds: number; // 現在の残り時間（秒）
}

export interface SubTimerState {
  totalDuration: number;    // 固定30秒
  startTime: number | null; // サブタイマー開始時のサーバー時刻（ミリ秒）
  isRunning: boolean;       // サブタイマーが動作中かどうか
  isPaused: boolean;        // 一時停止中かどうか
  pausedAt: number | null;  // 一時停止したサーバー時刻（ミリ秒）
  remainingSeconds: number; // 現在の残り時間（秒）
}

export interface GameState {
  teamA: TeamState;
  teamB: TeamState;
  timer: TimerState;
  subTimer?: SubTimerState;
  leftSideTeam: 'teamA' | 'teamB';  // どちらのチームが左側にいるかを明示
  serverTime: number;
  lastUpdated: number;
}

export type GameAction =
  | { type: 'SCORE_UPDATE'; team: 'teamA' | 'teamB'; points: number }
  | { type: 'RESET_SCORES' }
  | { type: 'RESET_TEAM_SCORE'; team: 'teamA' | 'teamB' }
  | { type: 'SET_TEAM_NAME'; team: 'teamA' | 'teamB'; name: string }
  | { type: 'TIMER_START' }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESET' }
  | { type: 'TIMER_SET'; duration: number }
  | { type: 'TIMER_ADJUST'; seconds: number }
  | { type: 'SUB_TIMER_START' }
  | { type: 'SUB_TIMER_PAUSE' }
  | { type: 'SUB_TIMER_RESET' }
  | { type: 'DO_OR_DIE_UPDATE'; team: 'teamA' | 'teamB'; delta: number }
  | { type: 'DO_OR_DIE_RESET' }
  | { type: 'COURT_CHANGE' }
  | { type: 'RESET_ALL' };

export const MESSAGE_TYPES = {
  GAME_STATE: 'game_state',
  ACTION: 'action',
  ERROR: 'error',
} as const;
export const ACTION_TYPES = {
  SCORE_UPDATE: 'SCORE_UPDATE',
  RESET_SCORES: 'RESET_SCORES',
  RESET_TEAM_SCORE: 'RESET_TEAM_SCORE',
  SET_TEAM_NAME: 'SET_TEAM_NAME',
  TIMER_START: 'TIMER_START',
  TIMER_PAUSE: 'TIMER_PAUSE',
  TIMER_RESET: 'TIMER_RESET',
  TIMER_SET: 'TIMER_SET',
  TIMER_ADJUST: 'TIMER_ADJUST',
  SUB_TIMER_START: 'SUB_TIMER_START',
  SUB_TIMER_PAUSE: 'SUB_TIMER_PAUSE',
  SUB_TIMER_RESET: 'SUB_TIMER_RESET',
  DO_OR_DIE_UPDATE: 'DO_OR_DIE_UPDATE',
  DO_OR_DIE_RESET: 'DO_OR_DIE_RESET',
  COURT_CHANGE: 'COURT_CHANGE',
  RESET_ALL: 'RESET_ALL'
} as const;

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
  ASSETS: Fetcher;
}

export interface GameSessionState {
  gameState: GameState;
  connections: Set<WebSocket>;
}