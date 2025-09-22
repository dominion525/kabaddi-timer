// クライアントサイド単体テスト
// リファクタリング後のgame-appの動作確認テスト

// モックを事前に読み込み
if (typeof window === 'undefined') {
  // Node.js環境でのテスト用
  global.window = {};
  require('./browser-apis.mock.js');
  require('./timer-logic.js');
  require('./game-app.js');
} else {
  // ブラウザ環境でのテスト用
  console.log('🧪 ブラウザ環境でのテストを開始します');
}

/**
 * クライアントサイドテストスイート
 * 依存性注入により外部APIをモック化してテスト
 */
class GameAppTestSuite {
  constructor() {
    this.testResults = [];
    this.mockAPIs = typeof MockBrowserAPIs !== 'undefined' ? MockBrowserAPIs : null;
  }

  // テスト結果をリセット
  reset() {
    this.testResults = [];
    if (this.mockAPIs) {
      this.mockAPIs._reset();
    }
  }

  // テスト実行
  assert(testName, condition, errorMessage = '') {
    const result = {
      name: testName,
      passed: !!condition,
      error: condition ? null : errorMessage,
      timestamp: Date.now()
    };
    this.testResults.push(result);

    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${testName}`);
    if (!result.passed && errorMessage) {
      console.log(`   Error: ${errorMessage}`);
    }

    return result.passed;
  }

  // テスト1: 初期化テスト
  testInitialization() {
    console.log('\n📋 テスト1: アプリケーション初期化');

    if (!this.mockAPIs) {
      this.assert('モックAPI確認', false, 'MockBrowserAPIsが利用できません');
      return;
    }

    // モック設定
    this.mockAPIs._enableFastTimers();
    this.mockAPIs.window._setMediaQuery('(min-width: 768px)', true);

    // ゲームアプリ初期化
    const gameApp = window.gameApp('test-game', this.mockAPIs);
    this.assert('ゲームアプリ作成', typeof gameApp === 'object');
    this.assert('gameId設定', gameApp.gameId === 'test-game');
    this.assert('初期デスクトップ判定', gameApp.isDesktop === false); // init()前は未設定

    // 初期化実行
    gameApp.init();

    // 初期化後の状態確認
    this.assert('初期化後デスクトップ判定', gameApp.isDesktop === true);
    this.assert('WebSocket作成', this.mockAPIs._mockState.websockets.has('wss://localhost:8787/ws/test-game'));

    return gameApp;
  }

  // テスト2: WebSocket通信テスト
  testWebSocketCommunication() {
    console.log('\n📡 テスト2: WebSocket通信');

    const gameApp = this.testInitialization();
    if (!gameApp) return;

    const wsUrl = 'wss://localhost:8787/ws/test-game';
    const mockWs = this.mockAPIs._mockState.websockets.get(wsUrl);

    this.assert('WebSocket初期状態', mockWs.readyState === 0); // CONNECTING

    // 接続シミュレーション
    mockWs._simulateOpen();
    this.assert('WebSocket接続後状態', mockWs.readyState === 1); // OPEN
    this.assert('接続フラグ更新', gameApp.connected === true);

    // メッセージ送信テスト
    gameApp.sendAction({ type: 'TEST_ACTION', data: 'test' });
    this.assert('メッセージ送信', mockWs._messages.length === 2); // TIME_SYNC_REQUEST + TEST_ACTION

    // ゲーム状態受信テスト
    const mockGameState = {
      teamA: { name: 'チームA', score: 5, doOrDieCount: 1 },
      teamB: { name: 'チームB', score: 3, doOrDieCount: 0 },
      timer: {
        totalDuration: 900,
        startTime: null,
        isRunning: false,
        remainingSeconds: 600
      }
    };

    mockWs._simulateMessage({
      type: 'game_state',
      data: mockGameState
    });

    // 状態更新確認
    this.assert('ゲーム状態更新', gameApp.gameState.teamA.score === 5);
    this.assert('チーム名同期', gameApp.teamANameInput === 'チームA');
    this.assert('タイマー秒数更新', gameApp.timerSeconds === 600);
  }

  // テスト3: ストレージ機能テスト
  testStorageFunctionality() {
    console.log('\n💾 テスト3: ストレージ機能');

    const gameApp = window.gameApp('test-game', this.mockAPIs);

    // 初期状態確認
    this.assert('初期simpleMode', gameApp.simpleMode === false);

    // ストレージに値を事前設定
    this.mockAPIs.storage.set('kabaddi-timer-simple-mode', 'true');

    // 初期化してストレージ読み込みテスト
    gameApp.init();
    this.assert('ストレージ読み込み', gameApp.simpleMode === true);

    // トグル機能テスト
    gameApp.toggleSimpleMode();
    this.assert('トグル後状態', gameApp.simpleMode === false);
    this.assert('ストレージ保存', this.mockAPIs.storage.get('kabaddi-timer-simple-mode') === 'false');
  }

  // テスト4: タイマー機能テスト
  testTimerFunctionality() {
    console.log('\n⏱️ テスト4: タイマー機能');

    const gameApp = window.gameApp('test-game', this.mockAPIs);

    // タイマー設定テスト
    gameApp.setTimer(5, 30); // 5分30秒
    const expectedDuration = 5 * 60 + 30; // 330秒

    // 送信されたアクションを確認
    const logs = this.mockAPIs.console._getLogs('log');
    const timerLog = logs.find(log =>
      log.args[0] === 'Setting timer to:' &&
      log.args[1] === 5 &&
      log.args[2] === 'minutes,' &&
      log.args[3] === 30
    );
    this.assert('タイマー設定ログ', !!timerLog);

    // プリセット機能テスト
    gameApp.setTimerPreset('short'); // 3分
    this.assert('プリセット分設定', gameApp.timerInputMinutes === 3);
    this.assert('プリセット秒設定', gameApp.timerInputSeconds === 0);
  }

  // テスト5: スコア管理テスト
  testScoreManagement() {
    console.log('\n🏆 テスト5: スコア管理');

    const gameApp = window.gameApp('test-game', this.mockAPIs);
    gameApp.init();

    // WebSocket接続をシミュレート
    const wsUrl = 'wss://localhost:8787/ws/test-game';
    const mockWs = this.mockAPIs._mockState.websockets.get(wsUrl);
    mockWs._simulateOpen();

    // スコア更新テスト
    gameApp.updateScore('teamA', 2);
    const scoreMessage = mockWs._messages.find(msg => {
      const parsed = JSON.parse(msg);
      return parsed.action.type === 'SCORE_UPDATE' &&
             parsed.action.team === 'teamA' &&
             parsed.action.points === 2;
    });
    this.assert('スコア更新送信', !!scoreMessage);

    // Do or Die更新テスト
    gameApp.updateDoOrDie('teamB', 1);
    const doOrDieMessage = mockWs._messages.find(msg => {
      const parsed = JSON.parse(msg);
      return parsed.action.type === 'DO_OR_DIE_UPDATE' &&
             parsed.action.team === 'teamB' &&
             parsed.action.delta === 1;
    });
    this.assert('Do or Die更新送信', !!doOrDieMessage);
  }

  // テスト6: タイマーロジック純粋関数テスト
  testTimerLogicPureFunctions() {
    console.log('\n🧮 テスト6: タイマーロジック純粋関数');

    // フォーマット機能テスト
    this.assert('タイマーフォーマット(930秒)', TimerLogic.formatTimer(930) === '15:30');
    this.assert('タイマーフォーマット(65秒)', TimerLogic.formatTimer(65) === '01:05');
    this.assert('サブタイマーフォーマット(25秒)', TimerLogic.formatSubTimer(25) === '25');
    this.assert('サブタイマーフォーマット(5秒)', TimerLogic.formatSubTimer(5) === '05');

    // Do or Dieインジケーター生成テスト
    const indicators2 = TimerLogic.generateDoOrDieIndicators(2);
    this.assert('Do or Dieインジケーター(2個)',
      JSON.stringify(indicators2) === JSON.stringify([true, true, false]));

    const indicators0 = TimerLogic.generateDoOrDieIndicators(0);
    this.assert('Do or Dieインジケーター(0個)',
      JSON.stringify(indicators0) === JSON.stringify([false, false, false]));

    // タイマー計算テスト
    const runningTimer = {
      totalDuration: 300,
      startTime: Date.now() - 30000, // 30秒前開始
      isRunning: true,
      remainingSeconds: 270
    };

    const result = TimerLogic.calculateRemainingSeconds(runningTimer, 0);
    this.assert('動作中タイマー計算', Math.abs(result.seconds - 270) <= 1 && result.isRunning);

    const stoppedTimer = {
      totalDuration: 300,
      startTime: null,
      isRunning: false,
      remainingSeconds: 180
    };

    const stoppedResult = TimerLogic.calculateRemainingSeconds(stoppedTimer, 0);
    this.assert('停止中タイマー計算', stoppedResult.seconds === 180 && !stoppedResult.isRunning);
  }

  // テスト7: エラーハンドリングテスト
  testErrorHandling() {
    console.log('\n🚨 テスト7: エラーハンドリング');

    const gameApp = window.gameApp('test-game', this.mockAPIs);
    gameApp.init();

    // WebSocket接続エラーシミュレーション
    const wsUrl = 'wss://localhost:8787/ws/test-game';
    const mockWs = this.mockAPIs._mockState.websockets.get(wsUrl);

    mockWs._simulateError(new Error('Connection failed'));
    this.assert('WebSocketエラー処理', gameApp.connected === false);

    // 無効なメッセージ処理テスト
    mockWs._simulateOpen();
    mockWs._simulateMessage('invalid json');

    const errorLogs = this.mockAPIs.console._getLogs('error');
    const parseError = errorLogs.find(log =>
      log.args[0] === 'WebSocket message parse error:');
    this.assert('無効メッセージエラー処理', !!parseError);
  }

  // 全テスト実行
  runAllTests() {
    console.log('🚀 クライアントサイド単体テスト開始\n');

    this.reset();

    this.testInitialization();
    this.testWebSocketCommunication();
    this.testStorageFunctionality();
    this.testTimerFunctionality();
    this.testScoreManagement();
    this.testTimerLogicPureFunctions();
    this.testErrorHandling();

    // 結果サマリー
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;

    console.log(`\n📊 テスト結果サマリー:`);
    console.log(`   総テスト数: ${total}`);
    console.log(`   成功: ${passed}`);
    console.log(`   失敗: ${failed}`);
    console.log(`   成功率: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 すべてのテストが成功しました！');
      console.log('   リファクタリングされたクライアントサイドコードは正常に動作しています。');
    } else {
      console.log('\n⚠️ 失敗したテストがあります。詳細を確認してください。');
    }

    return {
      total,
      passed,
      failed,
      results: this.testResults
    };
  }

  // 特定テストのみ実行
  runTest(testName) {
    this.reset();

    const testMethod = `test${testName}`;
    if (typeof this[testMethod] === 'function') {
      this[testMethod]();
    } else {
      console.error(`テスト "${testName}" が見つかりません`);
    }
  }
}

// テストスイートをグローバルに公開
if (typeof window !== 'undefined') {
  window.GameAppTestSuite = GameAppTestSuite;
  window.runClientTests = function() {
    const testSuite = new GameAppTestSuite();
    return testSuite.runAllTests();
  };

  console.log('🧪 クライアントサイドテストスイートが読み込まれました');
  console.log('💡 ブラウザのコンソールで runClientTests() を実行してテストを開始してください');
} else {
  // Node.js環境での実行
  module.exports = GameAppTestSuite;
}