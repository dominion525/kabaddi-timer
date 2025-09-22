// ui-state.js単体テスト
// ブラウザコンソールまたはNode.js環境での実行用

// Node.js環境対応
if (typeof window === 'undefined') {
  // MockBrowserAPIsを読み込み
  require('../browser-apis.mock.js');
  require('./ui-state.js');
  global.window = global;
}

/**
 * UI状態管理テストスイート
 * 純粋関数として分離されたUI状態管理の動作確認
 */
class UIStateTestSuite {
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
    console.log('\n📋 テスト1: UI状態管理の初期化');

    if (!this.mockAPIs) {
      this.assert('モックAPI確認', false, 'MockBrowserAPIsが利用できません');
      return null;
    }

    // UI状態管理の初期化
    const uiState = createUIState(this.mockAPIs);
    this.assert('UIState作成', typeof uiState === 'object');

    // 初期状態確認
    const initialState = uiState.getState();
    this.assert('初期showControlPanel', initialState.showControlPanel === false);
    this.assert('初期showStatusBar', initialState.showStatusBar === true);
    this.assert('初期simpleMode', initialState.simpleMode === false);
    this.assert('初期isDesktop', initialState.isDesktop === false);

    return uiState;
  }

  // テスト2: ローカルストレージ連携テスト
  testLocalStorageIntegration() {
    console.log('\n💾 テスト2: ローカルストレージ連携');

    const uiState = createUIState(this.mockAPIs);

    // 事前にsimpleModeをストレージに設定
    this.mockAPIs.storage.set('kabaddi-timer-simple-mode', 'true');

    // 初期化でストレージから読み込み
    uiState.initialize();
    this.assert('ストレージ読み込み後simpleMode', uiState.get('simpleMode') === true);

    // シンプルモードトグル
    const newSimpleMode = uiState.toggleSimpleMode();
    this.assert('トグル後戻り値', newSimpleMode === false);
    this.assert('トグル後状態', uiState.get('simpleMode') === false);
    this.assert('ストレージ保存確認', this.mockAPIs.storage.get('kabaddi-timer-simple-mode') === 'false');
  }

  // テスト3: メディアクエリ監視テスト
  testMediaQueryMonitoring() {
    console.log('\n📱 テスト3: メディアクエリ監視');

    // デスクトップ表示をシミュレート
    this.mockAPIs.window._setMediaQuery('(min-width: 768px)', true);

    const uiState = createUIState(this.mockAPIs);
    uiState.initialize();

    this.assert('デスクトップ判定true', uiState.get('isDesktop') === true);

    // モバイル表示に変更
    this.mockAPIs.window._setMediaQuery('(min-width: 768px)', false);
    uiState.initialize(); // 再初期化でテスト

    this.assert('モバイル判定false', uiState.get('isDesktop') === false);
  }

  // テスト4: 状態トグル機能テスト
  testStateToggling() {
    console.log('\n🔄 テスト4: 状態トグル機能');

    const uiState = createUIState(this.mockAPIs);
    uiState.initialize();

    // コントロールパネル トグル
    const controlPanelResult = uiState.toggleControlPanel();
    this.assert('コントロールパネルトグル戻り値', controlPanelResult === true);
    this.assert('コントロールパネル状態更新', uiState.get('showControlPanel') === true);

    // 再度トグル
    uiState.toggleControlPanel();
    this.assert('コントロールパネル再トグル', uiState.get('showControlPanel') === false);

    // ステータスバー トグル
    const statusBarResult = uiState.toggleStatusBar();
    this.assert('ステータスバートグル戻り値', statusBarResult === false); // 初期true -> false
    this.assert('ステータスバー状態更新', uiState.get('showStatusBar') === false);
  }

  // テスト5: 状態取得・設定テスト
  testStateAccessors() {
    console.log('\n🔍 テスト5: 状態取得・設定');

    const uiState = createUIState(this.mockAPIs);
    uiState.initialize();

    // 個別状態取得
    this.assert('get(showControlPanel)', uiState.get('showControlPanel') === false);
    this.assert('get(showStatusBar)', uiState.get('showStatusBar') === true);
    this.assert('get(simpleMode)', uiState.get('simpleMode') === false);

    // 全状態取得
    const fullState = uiState.getState();
    this.assert('getState戻り値型', typeof fullState === 'object');
    this.assert('getState内容確認', fullState.showControlPanel === false && fullState.showStatusBar === true);

    // テスト用状態設定
    uiState.setState('showControlPanel', true);
    this.assert('setState確認', uiState.get('showControlPanel') === true);

    // 不正なキーでの設定
    uiState.setState('invalidKey', true);
    this.assert('不正キー設定', uiState.get('invalidKey') === undefined);
  }

  // テスト6: エラーハンドリングテスト
  testErrorHandling() {
    console.log('\n🚨 テスト6: エラーハンドリング');

    const uiState = createUIState(this.mockAPIs);

    // 不正なJSON文字列でのストレージテスト
    this.mockAPIs.storage.set('kabaddi-timer-simple-mode', 'invalid-json');

    uiState.initialize();
    // エラーが発生してもデフォルト値が使用される
    this.assert('不正JSON処理', uiState.get('simpleMode') === false);

    // 警告ログが出力されたか確認
    const warnLogs = this.mockAPIs.console._getLogs('warn');
    this.assert('警告ログ出力', warnLogs.length > 0);
  }

  // テスト7: クリーンアップテスト
  testCleanup() {
    console.log('\n🧹 テスト7: クリーンアップ');

    const uiState = createUIState(this.mockAPIs);
    uiState.initialize();

    // デバッグ情報確認
    const debugInfo = uiState.debug();
    this.assert('デバッグ情報取得', typeof debugInfo === 'object');
    this.assert('状態情報含有', typeof debugInfo.state === 'object');
    this.assert('ストレージキー確認', debugInfo.storageKey === 'kabaddi-timer-simple-mode');

    // クリーンアップ実行
    uiState.cleanup();
    const debugAfterCleanup = uiState.debug();
    this.assert('クリーンアップ後確認', debugAfterCleanup.hasMediaQueryListener === false);
  }

  // 全テスト実行
  runAllTests() {
    console.log('🚀 UI状態管理単体テスト開始\n');

    this.reset();

    this.testInitialization();
    this.testLocalStorageIntegration();
    this.testMediaQueryMonitoring();
    this.testStateToggling();
    this.testStateAccessors();
    this.testErrorHandling();
    this.testCleanup();

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
      console.log('   UI状態管理モジュールは正常に動作しています。');
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
}

// テストスイートをグローバルに公開
if (typeof window !== 'undefined') {
  window.UIStateTestSuite = UIStateTestSuite;
  window.runUIStateTests = function() {
    const testSuite = new UIStateTestSuite();
    return testSuite.runAllTests();
  };

  console.log('🧪 UI状態管理テストスイートが読み込まれました');
  console.log('💡 ブラウザのコンソールで runUIStateTests() を実行してテストを開始してください');
} else {
  // Node.js環境での実行
  module.exports = UIStateTestSuite;
}