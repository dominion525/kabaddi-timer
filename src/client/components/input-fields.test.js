// input-fields.js単体テスト
// ブラウザコンソールまたはNode.js環境での実行用

// Node.js環境対応
if (typeof window === 'undefined') {
  // MockBrowserAPIsを読み込み
  require('../browser-apis.mock.js');
  require('./input-fields.js');
  global.window = global;
}

/**
 * 入力フィールド管理テストスイート
 * 純粋関数として分離された入力フィールド管理の動作確認
 */
class InputFieldsTestSuite {
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
    console.log('\n📋 テスト1: 入力フィールド管理の初期化');

    if (!this.mockAPIs) {
      this.assert('モックAPI確認', false, 'MockBrowserAPIsが利用できません');
      return null;
    }

    // デフォルト値の設定
    const defaultValues = {
      teamNames: {
        teamA: 'チームA',
        teamB: 'チームB'
      },
      timer: {
        presetMinutes: {
          short: 3,
          medium: 15,
          long: 20
        }
      }
    };

    // 入力フィールド管理の初期化
    const inputFields = createInputFields(this.mockAPIs, defaultValues);
    this.assert('InputFields作成', typeof inputFields === 'object');

    // 初期状態確認
    const initialValues = inputFields.getInputValues();
    this.assert('初期timerInputMinutes', initialValues.timerInputMinutes === 3);
    this.assert('初期timerInputSeconds', initialValues.timerInputSeconds === 0);
    this.assert('初期teamANameInput', initialValues.teamANameInput === 'チームA');
    this.assert('初期teamBNameInput', initialValues.teamBNameInput === 'チームB');

    return inputFields;
  }

  // テスト2: タイマー入力値設定テスト
  testTimerInputSetting() {
    console.log('\n⏱ テスト2: タイマー入力値設定');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // 有効な値の設定
    const validResult = inputFields.setTimerInput(10, 30);
    this.assert('有効な値設定成功', validResult.success === true);
    this.assert('設定後の分', inputFields.get('timerInputMinutes') === 10);
    this.assert('設定後の秒', inputFields.get('timerInputSeconds') === 30);

    // 無効な値の設定（負の値）
    const invalidResult1 = inputFields.setTimerInput(-1, 30);
    this.assert('負の値で失敗', invalidResult1.success === false);
    this.assert('エラーメッセージ存在', invalidResult1.errors && invalidResult1.errors.length > 0);

    // 無効な値の設定（0分0秒）
    const invalidResult2 = inputFields.setTimerInput(0, 0);
    this.assert('0分0秒で失敗', invalidResult2.success === false);

    // 境界値テスト（59秒）
    const boundaryResult = inputFields.setTimerInput(5, 59);
    this.assert('境界値59秒成功', boundaryResult.success === true);

    // 境界値テスト（60秒 = 無効）
    const invalidBoundary = inputFields.setTimerInput(5, 60);
    this.assert('境界値60秒失敗', invalidBoundary.success === false);
  }

  // テスト3: プリセット設定テスト
  testPresetSetting() {
    console.log('\n🎯 テスト3: プリセット設定');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // shortプリセット
    const shortResult = inputFields.setTimerPreset('short');
    this.assert('shortプリセット成功', shortResult.success === true);
    this.assert('shortプリセット分数', shortResult.minutes === 3);
    this.assert('shortプリセット設定確認', inputFields.get('timerInputMinutes') === 3);

    // mediumプリセット
    const mediumResult = inputFields.setTimerPreset('medium');
    this.assert('mediumプリセット成功', mediumResult.success === true);
    this.assert('mediumプリセット分数', mediumResult.minutes === 15);

    // longプリセット
    const longResult = inputFields.setTimerPreset('long');
    this.assert('longプリセット成功', longResult.success === true);
    this.assert('longプリセット分数', longResult.minutes === 20);

    // 不正なプリセット
    const invalidResult = inputFields.setTimerPreset('invalid');
    this.assert('不正プリセット失敗', invalidResult.success === false);
    this.assert('不正プリセットエラー', invalidResult.errors && invalidResult.errors.length > 0);
  }

  // テスト4: チーム名設定テスト
  testTeamNameSetting() {
    console.log('\n👥 テスト4: チーム名設定');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // チームA名設定
    const teamAResult = inputFields.setTeamNameInput('teamA', '新チームA');
    this.assert('チームA名設定成功', teamAResult.success === true);
    this.assert('チームA名確認', inputFields.get('teamANameInput') === '新チームA');

    // チームB名設定
    const teamBResult = inputFields.setTeamNameInput('teamB', '新チームB');
    this.assert('チームB名設定成功', teamBResult.success === true);
    this.assert('チームB名確認', inputFields.get('teamBNameInput') === '新チームB');

    // 空文字列（無効）
    const emptyResult = inputFields.setTeamNameInput('teamA', '');
    this.assert('空文字列で失敗', emptyResult.success === false);

    // 長すぎる名前（無効）
    const longNameResult = inputFields.setTeamNameInput('teamA', 'あ'.repeat(21));
    this.assert('長すぎる名前で失敗', longNameResult.success === false);

    // 先頭末尾空白（無効）
    const whitespaceResult = inputFields.setTeamNameInput('teamA', ' チーム ');
    this.assert('先頭末尾空白で失敗', whitespaceResult.success === false);

    // 不正なチーム識別子
    const invalidTeamResult = inputFields.setTeamNameInput('teamC', 'チームC');
    this.assert('不正チーム識別子で失敗', invalidTeamResult.success === false);
  }

  // テスト5: バリデーション機能テスト
  testValidation() {
    console.log('\n✅ テスト5: バリデーション機能');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // タイマーバリデーション
    const timerValid = inputFields.validateTimerInput(15, 30);
    this.assert('有効タイマー', timerValid.isValid === true);

    const timerInvalid = inputFields.validateTimerInput(-1, 30);
    this.assert('無効タイマー', timerInvalid.isValid === false);
    this.assert('タイマーエラー数', timerInvalid.errors.length > 0);

    // チーム名バリデーション
    const teamNameValid = inputFields.validateTeamName('有効なチーム名');
    this.assert('有効チーム名', teamNameValid.isValid === true);

    const teamNameInvalid = inputFields.validateTeamName('');
    this.assert('無効チーム名', teamNameInvalid.isValid === false);
    this.assert('チーム名エラー数', teamNameInvalid.errors.length > 0);

    // 非文字列チーム名
    const nonStringResult = inputFields.validateTeamName(123);
    this.assert('非文字列チーム名で失敗', nonStringResult.isValid === false);
  }

  // テスト6: サーバー同期テスト
  testServerSync() {
    console.log('\n🔄 テスト6: サーバー同期');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // サーバー状態のシミュレート
    const gameState = {
      teamA: { name: 'サーバーチームA' },
      teamB: { name: 'サーバーチームB' },
      timer: {
        isRunning: false,
        remainingSeconds: 900 // 15分
      }
    };

    // 同期実行
    inputFields.syncWithGameState(gameState);

    // 同期結果確認
    this.assert('チームA名同期', inputFields.get('teamANameInput') === 'サーバーチームA');
    this.assert('チームB名同期', inputFields.get('teamBNameInput') === 'サーバーチームB');
    this.assert('タイマー分同期', inputFields.get('timerInputMinutes') === 15);
    this.assert('タイマー秒同期', inputFields.get('timerInputSeconds') === 0);

    // タイマー動作中は同期しない
    const runningState = {
      teamA: { name: 'チームA更新' },
      timer: {
        isRunning: true,
        remainingSeconds: 600
      }
    };

    // 現在の値を記録
    const beforeMinutes = inputFields.get('timerInputMinutes');

    inputFields.syncWithGameState(runningState);

    // タイマー動作中はタイマー値が変更されない
    this.assert('動作中タイマー非同期', inputFields.get('timerInputMinutes') === beforeMinutes);
    // チーム名は更新される
    this.assert('動作中チーム名同期', inputFields.get('teamANameInput') === 'チームA更新');
  }

  // テスト7: ユーティリティ機能テスト
  testUtilities() {
    console.log('\n🔧 テスト7: ユーティリティ機能');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // タイマー総秒数計算
    inputFields.setTimerInput(5, 30);
    const totalSeconds = inputFields.getTimerTotalSeconds();
    this.assert('総秒数計算', totalSeconds === 330); // 5*60 + 30

    // プリセット一覧取得
    const presets = inputFields.getAvailablePresets();
    this.assert('プリセット一覧型', Array.isArray(presets));
    this.assert('プリセット数', presets.length === 3);
    this.assert('プリセット構造', presets[0].key && presets[0].minutes && presets[0].displayName);

    // デフォルト値リセット
    inputFields.setTimerInput(10, 45);
    inputFields.setTeamNameInput('teamA', 'カスタムチーム');

    inputFields.resetToDefaults();

    this.assert('リセット後タイマー分', inputFields.get('timerInputMinutes') === 3);
    this.assert('リセット後タイマー秒', inputFields.get('timerInputSeconds') === 0);
    this.assert('リセット後チームA', inputFields.get('teamANameInput') === 'チームA');
    this.assert('リセット後チームB', inputFields.get('teamBNameInput') === 'チームB');

    // デバッグ情報
    const debugInfo = inputFields.debug();
    this.assert('デバッグ情報型', typeof debugInfo === 'object');
    this.assert('デバッグ状態存在', typeof debugInfo.state === 'object');
    this.assert('デバッグルール存在', typeof debugInfo.validationRules === 'object');
  }

  // テスト8: エラーハンドリングテスト
  testErrorHandling() {
    console.log('\n🚨 テスト8: エラーハンドリング');

    const defaultValues = {
      teamNames: { teamA: 'チームA', teamB: 'チームB' },
      timer: { presetMinutes: { short: 3, medium: 15, long: 20 } }
    };

    const inputFields = createInputFields(this.mockAPIs, defaultValues);

    // setState（テスト用）での不正キー
    inputFields.setState('invalidKey', 'value');
    this.assert('不正キー設定', inputFields.get('invalidKey') === undefined);

    // 警告ログが出力されたか確認
    const warnLogs = this.mockAPIs.console._getLogs('warn');
    this.assert('警告ログ出力', warnLogs.length > 0);

    // 境界値・極端値テスト
    const maxResult = inputFields.setTimerInput(999, 59);
    this.assert('最大値設定成功', maxResult.success === true);

    const overMaxResult = inputFields.setTimerInput(1000, 59);
    this.assert('最大値超過失敗', overMaxResult.success === false);

    // 小数点値（整数でない）
    const floatResult = inputFields.setTimerInput(5.5, 30);
    this.assert('小数点値失敗', floatResult.success === false);
  }

  // 全テスト実行
  runAllTests() {
    console.log('🚀 入力フィールド管理単体テスト開始\n');

    this.reset();

    this.testInitialization();
    this.testTimerInputSetting();
    this.testPresetSetting();
    this.testTeamNameSetting();
    this.testValidation();
    this.testServerSync();
    this.testUtilities();
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
      console.log('   入力フィールド管理モジュールは正常に動作しています。');
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
  window.InputFieldsTestSuite = InputFieldsTestSuite;
  window.runInputFieldsTests = function() {
    const testSuite = new InputFieldsTestSuite();
    return testSuite.runAllTests();
  };

  console.log('🧪 入力フィールド管理テストスイートが読み込まれました');
  console.log('💡 ブラウザのコンソールで runInputFieldsTests() を実行してテストを開始してください');
} else {
  // Node.js環境での実行
  module.exports = InputFieldsTestSuite;
}