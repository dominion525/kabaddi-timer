export class MockWebSocket {
  public readyState: number = 1; // OPEN
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  private messageQueue: string[] = [];
  private eventListeners: { [key: string]: ((event: any) => void)[] } = {};

  constructor(public url?: string) {}

  send(data: string): void {
    this.messageQueue.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void): void {
    if (!this.eventListeners[type]) return;
    const index = this.eventListeners[type].indexOf(listener);
    if (index > -1) {
      this.eventListeners[type].splice(index, 1);
    }
  }

  // テスト用ユーティリティメソッド
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  getLastSentMessage(): string | undefined {
    return this.messageQueue[this.messageQueue.length - 1];
  }

  getAllSentMessages(): string[] {
    return [...this.messageQueue];
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}

// WebSocketPairのモック
export class MockWebSocketPair {
  0: MockWebSocket;
  1: MockWebSocket;

  constructor() {
    this[0] = new MockWebSocket();
    this[1] = new MockWebSocket();
  }
}

// グローバルWebSocketの置き換え用
export function mockWebSocket() {
  // @ts-ignore
  global.WebSocket = MockWebSocket;
  // @ts-ignore
  global.WebSocketPair = MockWebSocketPair;
}