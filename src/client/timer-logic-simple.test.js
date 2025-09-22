// リファクタリング動作確認用の簡易テスト
// ブラウザのコンソールで実行可能

// テストデータの準備
const mockTimer = {
  totalDuration: 900, // 15分
  startTime: Date.now() - 30000, // 30秒前に開始
  isRunning: true,
  remainingSeconds: 870
};

const mockStoppedTimer = {
  totalDuration: 900,
  startTime: null,
  isRunning: false,
  remainingSeconds: 600 // 10分
};

const mockSubTimer = {
  totalDuration: 30,
  startTime: Date.now() - 5000, // 5秒前に開始
  isRunning: true,
  remainingSeconds: 25
};

// 簡易テスト関数
function runSimpleTests() {
  console.log('🔍 リファクタリング動作確認テスト開始');

  const tests = [
    // calculateRemainingSecondsテスト
    {
      name: '動作中タイマーの残り秒数計算',
      test: () => {
        const result = TimerLogic.calculateRemainingSeconds(mockTimer, 0);
        const expected = mockTimer.totalDuration - 30; // 30秒経過
        return Math.abs(result.seconds - expected) <= 1 && result.isRunning;
      }
    },

    {
      name: '停止中タイマーの残り秒数取得',
      test: () => {
        const result = TimerLogic.calculateRemainingSeconds(mockStoppedTimer, 0);
        return result.seconds === 600 && !result.isRunning;
      }
    },

    // calculateSubTimerRemainingSecondsテスト
    {
      name: '動作中サブタイマーの残り秒数計算',
      test: () => {
        const result = TimerLogic.calculateSubTimerRemainingSeconds(mockSubTimer, 0);
        const expected = mockSubTimer.totalDuration - 5; // 5秒経過
        return Math.abs(result.seconds - expected) <= 1 && result.isRunning;
      }
    },

    // formatTimerテスト
    {
      name: 'タイマーフォーマット（15:30）',
      test: () => {
        const result = TimerLogic.formatTimer(930); // 15分30秒
        return result === '15:30';
      }
    },

    {
      name: 'タイマーフォーマット（01:05）',
      test: () => {
        const result = TimerLogic.formatTimer(65); // 1分5秒
        return result === '01:05';
      }
    },

    // formatSubTimerテスト
    {
      name: 'サブタイマーフォーマット（25秒）',
      test: () => {
        const result = TimerLogic.formatSubTimer(25);
        return result === '25';
      }
    },

    {
      name: 'サブタイマーフォーマット（05秒）',
      test: () => {
        const result = TimerLogic.formatSubTimer(5);
        return result === '05';
      }
    },

    // generateDoOrDieIndicatorsテスト
    {
      name: 'Do or Dieインジケーター（2個）',
      test: () => {
        const result = TimerLogic.generateDoOrDieIndicators(2);
        return JSON.stringify(result) === JSON.stringify([true, true, false]);
      }
    },

    {
      name: 'Do or Dieインジケーター（0個）',
      test: () => {
        const result = TimerLogic.generateDoOrDieIndicators(0);
        return JSON.stringify(result) === JSON.stringify([false, false, false]);
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ ${index + 1}. ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${index + 1}. ${test.name} - 結果が期待値と違います`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${index + 1}. ${test.name} - エラー: ${error.message}`);
      failed++;
    }
  });

  console.log(`\n📊 テスト結果: ${passed}個成功, ${failed}個失敗`);

  if (failed === 0) {
    console.log('🎉 すべてのテストが成功しました！リファクタリングは正常に動作しています。');
  } else {
    console.log('⚠️ 失敗したテストがあります。実装を確認してください。');
  }

  return { passed, failed };
}

// ブラウザのコンソールで実行するための関数をグローバルに公開
if (typeof window !== 'undefined') {
  window.runSimpleTests = runSimpleTests;
  console.log('🚀 リファクタリング動作確認テストが読み込まれました。');
  console.log('💡 ブラウザのコンソールで runSimpleTests() を実行してください。');
}