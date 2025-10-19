import { describe, it, expect, env } from './test-helpers';

describe('GameSession - ブロードキャスト動作の検証', () => {
  it('スコア更新が全クライアントにブロードキャストされる', async () => {
    const id = env.GAME_SESSION.idFromName('test-broadcast-score');
    const gameSession = env.GAME_SESSION.get(id);

    // WebSocket接続を2つ作成
    const request1 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-1',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response1 = await gameSession.fetch(request1);
    const ws1 = response1.webSocket!;
    ws1.accept();

    const request2 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-2',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response2 = await gameSession.fetch(request2);
    const ws2 = response2.webSocket!;
    ws2.accept();

    // メッセージ受信を記録
    const ws1Messages: unknown[] = [];
    const ws2Messages: unknown[] = [];

    ws1.addEventListener('message', (event) => {
      ws1Messages.push(JSON.parse(event.data as string));
    });

    ws2.addEventListener('message', (event) => {
      ws2Messages.push(JSON.parse(event.data as string));
    });

    // 初期化メッセージを待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // カウンタをリセット
    ws1Messages.length = 0;
    ws2Messages.length = 0;

    // ws1からスコア更新をリクエスト
    ws1.send(JSON.stringify({
      action: { type: 'SCORE_UPDATE', team: 'teamA', points: 5 }
    }));

    // メッセージ処理を待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // 両方のクライアントにブロードキャストされることを確認
    expect(ws1Messages.length).toBe(1);
    expect(ws2Messages.length).toBe(1);

    // 両方のメッセージが同じ内容であることを確認
    expect((ws1Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws2Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws1Messages[0] as { data: { teamA: { score: number } } }).data.teamA.score).toBe(5);
    expect((ws2Messages[0] as { data: { teamA: { score: number } } }).data.teamA.score).toBe(5);
  });

  it('DO/DIE更新が全クライアントにブロードキャストされる', async () => {
    const id = env.GAME_SESSION.idFromName('test-broadcast-dodordie');
    const gameSession = env.GAME_SESSION.get(id);

    // WebSocket接続を2つ作成
    const request1 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-1',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response1 = await gameSession.fetch(request1);
    const ws1 = response1.webSocket!;
    ws1.accept();

    const request2 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-2',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response2 = await gameSession.fetch(request2);
    const ws2 = response2.webSocket!;
    ws2.accept();

    // メッセージ受信を記録
    const ws1Messages: unknown[] = [];
    const ws2Messages: unknown[] = [];

    ws1.addEventListener('message', (event) => {
      ws1Messages.push(JSON.parse(event.data as string));
    });

    ws2.addEventListener('message', (event) => {
      ws2Messages.push(JSON.parse(event.data as string));
    });

    // 初期化メッセージを待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // カウンタをリセット
    ws1Messages.length = 0;
    ws2Messages.length = 0;

    // ws1からDO/DIE更新をリクエスト
    ws1.send(JSON.stringify({
      action: { type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 }
    }));

    // メッセージ処理を待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // 両方のクライアントにブロードキャストされることを確認
    expect(ws1Messages.length).toBe(1);
    expect(ws2Messages.length).toBe(1);

    // 両方のメッセージが同じ内容であることを確認
    expect((ws1Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws2Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws1Messages[0] as { data: { teamB: { doOrDieCount: number } } }).data.teamB.doOrDieCount).toBe(1);
    expect((ws2Messages[0] as { data: { teamB: { doOrDieCount: number } } }).data.teamB.doOrDieCount).toBe(1);
  });

  it('チーム名変更が全クライアントにブロードキャストされる', async () => {
    const id = env.GAME_SESSION.idFromName('test-broadcast-teamname');
    const gameSession = env.GAME_SESSION.get(id);

    // WebSocket接続を2つ作成
    const request1 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-1',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response1 = await gameSession.fetch(request1);
    const ws1 = response1.webSocket!;
    ws1.accept();

    const request2 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-2',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response2 = await gameSession.fetch(request2);
    const ws2 = response2.webSocket!;
    ws2.accept();

    // メッセージ受信を記録
    const ws1Messages: unknown[] = [];
    const ws2Messages: unknown[] = [];

    ws1.addEventListener('message', (event) => {
      ws1Messages.push(JSON.parse(event.data as string));
    });

    ws2.addEventListener('message', (event) => {
      ws2Messages.push(JSON.parse(event.data as string));
    });

    // 初期化メッセージを待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // カウンタをリセット
    ws1Messages.length = 0;
    ws2Messages.length = 0;

    // ws1からチーム名変更をリクエスト
    ws1.send(JSON.stringify({
      action: { type: 'SET_TEAM_NAME', team: 'teamA', name: '東京タイガース' }
    }));

    // メッセージ処理を待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // 両方のクライアントにブロードキャストされることを確認
    expect(ws1Messages.length).toBe(1);
    expect(ws2Messages.length).toBe(1);

    // 両方のメッセージが同じ内容であることを確認
    expect((ws1Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws2Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws1Messages[0] as { data: { teamA: { name: string } } }).data.teamA.name).toBe('東京タイガース');
    expect((ws2Messages[0] as { data: { teamA: { name: string } } }).data.teamA.name).toBe('東京タイガース');
  });

  it('タイマー操作が全クライアントにブロードキャストされる', async () => {
    const id = env.GAME_SESSION.idFromName('test-broadcast-timer');
    const gameSession = env.GAME_SESSION.get(id);

    // WebSocket接続を2つ作成
    const request1 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-1',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response1 = await gameSession.fetch(request1);
    const ws1 = response1.webSocket!;
    ws1.accept();

    const request2 = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key-2',
        'Sec-WebSocket-Version': '13'
      }
    });
    const response2 = await gameSession.fetch(request2);
    const ws2 = response2.webSocket!;
    ws2.accept();

    // メッセージ受信を記録
    const ws1Messages: unknown[] = [];
    const ws2Messages: unknown[] = [];

    ws1.addEventListener('message', (event) => {
      ws1Messages.push(JSON.parse(event.data as string));
    });

    ws2.addEventListener('message', (event) => {
      ws2Messages.push(JSON.parse(event.data as string));
    });

    // 初期化メッセージを待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // カウンタをリセット
    ws1Messages.length = 0;
    ws2Messages.length = 0;

    // ws1からタイマー設定をリクエスト
    ws1.send(JSON.stringify({
      action: { type: 'TIMER_SET', duration: 600 }
    }));

    // メッセージ処理を待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // 両方のクライアントにブロードキャストされることを確認
    expect(ws1Messages.length).toBe(1);
    expect(ws2Messages.length).toBe(1);

    // 両方のメッセージが同じ内容であることを確認
    expect((ws1Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws2Messages[0] as { type: string }).type).toBe('game_state');
    expect((ws1Messages[0] as { data: { timer: { totalDuration: number } } }).data.timer.totalDuration).toBe(600);
    expect((ws2Messages[0] as { data: { timer: { totalDuration: number } } }).data.timer.totalDuration).toBe(600);
  });
});
