import { env } from 'cloudflare:test';
import { GameSession } from '../../durable-objects/game-session';

// テスト用のGameSessionインスタンスを作成するヘルパー
export async function createTestGameSession(gameId: string = 'test-game'): Promise<{
  gameSession: DurableObjectStub<GameSession>;
  id: DurableObjectId;
}> {
  const id = env.GAME_SESSION.idFromName(gameId);
  const gameSession = env.GAME_SESSION.get(id);

  return { gameSession, id };
}

// WebSocketペアを作成するヘルパー
export function createWebSocketPair(): WebSocketPair {
  return new WebSocketPair();
}

// テスト用のWebSocket接続を作成
export async function createTestWebSocketConnection(gameId: string = 'test-game'): Promise<{
  clientSocket: WebSocket;
  serverSocket: WebSocket;
  gameSession: DurableObjectStub<GameSession>;
}> {
  const { gameSession } = await createTestGameSession(gameId);
  const { 0: clientSocket, 1: serverSocket } = createWebSocketPair();

  return { clientSocket, serverSocket, gameSession };
}

// テスト用のリクエストを作成
export function createTestRequest(path: string = '/websocket', options: RequestInit = {}): Request {
  return new Request(`http://localhost${path}`, {
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Key': 'test-key',
      'Sec-WebSocket-Version': '13',
      ...options.headers
    },
    ...options
  });
}

// WebSocketメッセージのアサーション用ヘルパー
export function waitForMessage(socket: WebSocket, timeout: number = 1000): Promise<MessageEvent> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`WebSocket message timeout after ${timeout}ms`));
    }, timeout);

    socket.addEventListener('message', (event) => {
      clearTimeout(timeoutId);
      resolve(event);
    }, { once: true });
  });
}

// 非同期でWebSocket接続が確立されるのを待つ
export function waitForWebSocketOpen(socket: WebSocket, timeout: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`WebSocket open timeout after ${timeout}ms`));
    }, timeout);

    socket.addEventListener('open', () => {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });
  });
}