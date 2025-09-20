import { GameState, GameAction, GameMessage, WebSocketMessage } from '../types/game';

export class GameSession {
  private state: DurableObjectState;
  private connections: Set<WebSocket> = new Set();
  private gameState: GameState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.gameState = {
      teamA: { name: 'チームA', score: 0 },
      teamB: { name: 'チームB', score: 0 },
      lastUpdated: Date.now()
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket): Promise<void> {
    webSocket.accept();
    this.connections.add(webSocket);

    await this.loadGameState();

    this.sendToClient(webSocket, {
      type: 'game_state',
      data: this.gameState,
      timestamp: Date.now()
    });

    webSocket.addEventListener('message', async (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string);
        await this.handleAction(message.action);
      } catch (error) {
        this.sendToClient(webSocket, {
          type: 'error',
          data: 'Invalid message format',
          timestamp: Date.now()
        });
      }
    });

    webSocket.addEventListener('close', () => {
      this.connections.delete(webSocket);
    });

    webSocket.addEventListener('error', () => {
      this.connections.delete(webSocket);
    });
  }

  private async loadGameState(): Promise<void> {
    const stored = await this.state.storage.get<GameState>('gameState');
    if (stored) {
      this.gameState = stored;
    }
  }

  private async saveGameState(): Promise<void> {
    this.gameState.lastUpdated = Date.now();
    await this.state.storage.put('gameState', this.gameState);
  }

  private async handleAction(action: GameAction): Promise<void> {
    switch (action.type) {
      case 'SCORE_UPDATE':
        if (action.team === 'teamA') {
          this.gameState.teamA.score = Math.max(0, this.gameState.teamA.score + action.points);
        } else {
          this.gameState.teamB.score = Math.max(0, this.gameState.teamB.score + action.points);
        }
        break;

      case 'RESET_SCORES':
        this.gameState.teamA.score = 0;
        this.gameState.teamB.score = 0;
        break;

      case 'SET_TEAM_NAME':
        if (action.team === 'teamA') {
          this.gameState.teamA.name = action.name;
        } else {
          this.gameState.teamB.name = action.name;
        }
        break;

      default:
        return;
    }

    await this.saveGameState();
    this.broadcastState();
  }

  private broadcastState(): void {
    const message: GameMessage = {
      type: 'game_state',
      data: this.gameState,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);

    for (const connection of this.connections) {
      try {
        connection.send(messageString);
      } catch (error) {
        this.connections.delete(connection);
      }
    }
  }

  private sendToClient(webSocket: WebSocket, message: GameMessage): void {
    try {
      webSocket.send(JSON.stringify(message));
    } catch (error) {
      this.connections.delete(webSocket);
    }
  }
}