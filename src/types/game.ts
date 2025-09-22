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
  serverTime: number;
  lastUpdated: number;
}

export type GameAction =
  | { type: 'SCORE_UPDATE'; team: 'teamA' | 'teamB'; points: number }
  | { type: 'RESET_SCORES' }
  | { type: 'SET_TEAM_NAME'; team: 'teamA' | 'teamB'; name: string }
  | { type: 'TIMER_START' }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESET' }
  | { type: 'TIMER_SET'; duration: number }
  | { type: 'TIMER_ADJUST'; seconds: number }
  | { type: 'SUB_TIMER_START' }
  | { type: 'SUB_TIMER_PAUSE' }
  | { type: 'SUB_TIMER_RESET' }
  | { type: 'TIME_SYNC_REQUEST'; clientRequestTime?: number }
  | { type: 'DO_OR_DIE_UPDATE'; team: 'teamA' | 'teamB'; delta: number }
  | { type: 'DO_OR_DIE_RESET' }
  | { type: 'COURT_CHANGE' }
  | { type: 'RESET_ALL' };

export interface GameMessage {
  type: 'game_state' | 'action' | 'error' | 'time_sync';
  data: GameState | GameAction | string | TimeSyncData;
  timestamp: number;
}

export interface TimeSyncData {
  serverTime: number;
  clientRequestTime?: number;
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