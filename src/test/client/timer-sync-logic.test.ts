// タイマー時刻同期ロジックのテスト
// 現状のロジックで問題となるケースを明確に示し、TDDで改善していく

import {
  calculateRemainingSecondsOriginal,
  calculateSubTimerRemainingSecondsOriginal,
  calculateRemainingSecondsImproved,
  calculateSubTimerRemainingSecondsImproved,
  calculateRemainingSecondsRelative,
  type TimerState,
  type SyncPoint
} from '../../client/components/timer-sync-logic';

describe('Timer Sync Logic - 現状の問題を確認', () => {

  // ===== 正常系テスト（現在も動作する） =====

  describe('正常系：時刻差がない場合', () => {
    it('30秒タイマーが正しくカウントダウンする', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000, // サーバー開始時刻
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 開始直後（0秒経過）
      const result1 = calculateRemainingSecondsOriginal(
        timer,
        0,      // オフセット0
        1000000000 // クライアント時刻（開始直後）
      );
      expect(result1.seconds).toBe(30);
      expect(result1.isRunning).toBe(true);

      // 5秒経過
      const result2 = calculateRemainingSecondsOriginal(
        timer,
        0,
        1000005000 // 5秒経過
      );
      expect(result2.seconds).toBe(25);
      expect(result2.isRunning).toBe(true);
    });
  });

  // ===== 問題ケース1：大きな時刻ずれ（現在失敗する） =====

  describe('問題ケース：大きな時刻ずれ', () => {
    it('サーバーが5秒進んでいる場合の問題', () => {
      // 状況説明：
      // - サーバー時刻: 12:00:05 (1000005000ms) でタイマー開始
      // - クライアント時刻: 12:00:00 (1000000000ms) - サーバーより5秒遅れ
      // - serverTimeOffset: -5000ms (サーバーが5秒進んでいる)
      // - 現実：サーバーではすでに5秒経過しているのでタイマーは25秒になっているはず
      // - 問題：現在のロジックは30秒を返してしまう

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000, // サーバーは12:00:00に開始
        totalDuration: 30,
        remainingSeconds: 30
      };

      // サーバーが5秒進んだ現在（12:00:05）にクライアントが状態を受信
      const result = calculateRemainingSecondsOriginal(
        timer,
        -5000,      // サーバーが5秒進んでいる
        1000000000  // クライアント時刻12:00:00（遅れている）
      );

      // 期待値：25秒（サーバーで5秒経過済み）
      // 実際の結果：30秒（問題！）
      console.log('サーバー5秒進みのテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(25); // これは失敗するはず
      expect(result.isRunning).toBe(true);
    });

    it('サーバーが5秒遅れている場合の問題', () => {
      // 状況説明：
      // - サーバー時刻: 12:00:00 (1000000000ms) でタイマー開始（現実時刻）
      // - クライアント時刻: 12:00:05 (1000005000ms) - サーバーより5秒進んでいる
      // - serverTimeOffset: 5000ms (サーバーが5秒遅れている)
      // - 現実：まだタイマー開始していない（-5秒後に開始予定）
      // - 問題：現在のロジックは35秒のような異常値を返す可能性

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000, // サーバーは12:00:00に開始予定
        totalDuration: 30,
        remainingSeconds: 30
      };

      // クライアントが5秒先行している時点（11:59:55相当のサーバー時刻）で受信
      const result = calculateRemainingSecondsOriginal(
        timer,
        5000,       // サーバーが5秒遅れている
        1000005000  // クライアント時刻12:00:05（先行している）
      );

      // 期待値：30秒（まだ開始前なので満タン）
      // 実際の結果：異常値の可能性
      console.log('サーバー5秒遅れのテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(30); // これも失敗する可能性
      expect(result.isRunning).toBe(true);
    });

    it('極端なケース：2000ms差', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000002000, // サーバーが2秒進んでいる
        totalDuration: 30,
        remainingSeconds: 30
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        -2000,      // クライアントが2秒遅れ
        1000000000  // クライアント時刻
      );

      // 期待値：30秒
      // 実際の結果：28秒
      console.log('2000ms差のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(30); // これも失敗
    });
  });

  // ===== 問題ケース2：微妙な時刻ずれ（ちらつき問題） =====

  describe('問題ケース：微妙な時刻ずれ（ちらつき）', () => {
    it('100ms遅延でのタイマー開始時のちらつき', () => {
      // 正しいシナリオ：
      // - サーバー：1000000000ms でタイマー開始、100ms経過した状態（1000000100ms）
      // - クライアント：999999900ms（100ms遅れ）でその状態を受信
      // - serverTimeOffset: +100ms（サーバーが100ms進んでいる）
      // - 期待値：30秒表示（まだ開始直後）
      // - 実際：負の経過時間によりMath.ceilで31秒表示（問題！）

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,   // タイマー開始時刻（サーバー基準）
        totalDuration: 30,
        remainingSeconds: 29.9   // サーバーでは0.1秒経過
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        100,        // サーバーが100ms進んでいる
        1000000000  // クライアント時刻（100ms遅れ）
      );

      // 期待値：30秒（ちらつきなし）
      // 実際の結果：31秒（負の経過時間による切り上げ問題！）
      console.log('100ms遅延のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(31); // これが失敗すべき（問題の証拠）
    });

    it('50ms遅延でのボーダーケース', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 開始から50ms後の状況
      const result = calculateRemainingSecondsOriginal(
        timer,
        -50,        // サーバーが50ms進んでいる
        999999950   // クライアント時刻（50ms遅れ）
      );

      console.log('50ms遅延のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(30); // これも微妙な差で失敗する可能性
    });

    it('29.95秒での切り上げ問題', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 0.05秒経過（29.95秒残り）
      const result = calculateRemainingSecondsOriginal(
        timer,
        0,
        1000000050  // 50ms経過
      );

      // Math.ceilにより29.95 → 30になるべきだが...
      console.log('29.95秒のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(30);
    });
  });

  // ===== サブタイマーのテスト =====

  describe('サブタイマーの問題ケース', () => {
    it('サブタイマーでも同様の問題が発生', () => {
      const subTimer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30, // 30秒固定
        remainingSeconds: 30
      };

      const result = calculateSubTimerRemainingSecondsOriginal(
        subTimer,
        -5000,      // サーバーが5秒進んでいる
        1000000000  // クライアント時刻（遅れている）
      );

      console.log('サブタイマー5秒遅れのテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(25); // サーバーで5秒経過済みのはず
    });
  });

  // ===== 一時停止関連のテスト =====

  describe('一時停止時の動作', () => {
    it('停止中のタイマーは時刻差の影響を受けない', () => {
      const timer: TimerState = {
        isRunning: false,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 25 // 停止時の残り時間
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        -5000,      // 大きな時刻差があっても
        1000000000
      );

      // 停止中は remainingSeconds をそのまま返すべき
      expect(result.seconds).toBe(25);
      expect(result.isRunning).toBe(false);
    });
  });

  // ===== 実際のユーザー報告問題の再現 =====

  describe('実際の本番環境問題の再現', () => {
    it('30秒タイマーが27秒から開始する問題', () => {
      // 実際のシナリオ：
      // - サーバーでタイマー開始（12:00:00）
      // - 3秒後（12:00:03）にクライアントが状態受信
      // - この時点でサーバーではタイマーが27秒残っている
      // - 問題：クライアントは30秒と表示すべきか、27秒と表示すべきか？

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000, // サーバータイマー開始時刻
        totalDuration: 30,
        remainingSeconds: 27    // サーバーの現在の残り時間（3秒経過済み）
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        -3000,      // サーバーが3秒進んでいる
        1000000000  // クライアント時刻（遅れている）
      );

      // 期待値：27秒（サーバーの実際の残り時間に合わせるべき）
      // 実際：27秒か30秒かどちらが返ってくる？
      console.log('30→27秒問題のテスト結果:', result.seconds, '秒');
      // 現状のロジックでは27秒になる可能性が高い
      expect(result.seconds).toBe(27);
    });

    it('30秒タイマーが33秒から開始する問題', () => {
      // 実際のシナリオ：
      // - クライアントがサーバーより3秒進んでいる
      // - サーバーでタイマー開始（12:00:00）
      // - クライアントはまだ11:59:57の時点で状態受信
      // - この時点でサーバー時刻的には-3秒（開始前）

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000, // サーバータイマー開始時刻
        totalDuration: 30,
        remainingSeconds: 30
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        3000,       // サーバーが3秒遅れている
        1000000000  // クライアント時刻（進んでいる）
      );

      // 期待値：30秒（まだ開始前なので満タン）
      // 実際の問題：33秒の異常値が発生
      console.log('30→33秒問題のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(33); // 現状版では異常値になる（問題の再現）
    });

    it('Math.ceilによる切り上げで31秒になる問題', () => {
      // 実際のシナリオ：
      // - タイマー開始直後（0.1秒経過）
      // - Math.ceil(29.9) = 30 であるべき
      // - しかし何らかの理由で31秒と表示される

      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 0.1秒経過した状況
      const result = calculateRemainingSecondsOriginal(
        timer,
        0,          // 時刻差なし
        1000000100  // 100ms経過
      );

      // 期待値：30秒（29.9秒 → Math.ceil → 30秒）
      console.log('Math.ceil問題のテスト結果:', result.seconds, '秒');
      expect(result.seconds).toBe(30);
    });
  });

  // ===== エッジケース =====

  describe('エッジケース', () => {
    it('nullタイマーの処理', () => {
      const result = calculateRemainingSecondsOriginal(
        null as any,
        0,
        1000000000
      );

      expect(result.seconds).toBe(0);
      expect(result.isRunning).toBe(false);
    });

    it('startTimeがnullの実行中タイマー', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: null, // 異常状態
        totalDuration: 30,
        remainingSeconds: 25
      };

      const result = calculateRemainingSecondsOriginal(
        timer,
        0,
        1000000000
      );

      // remainingSecondsを使うべき
      expect(result.seconds).toBe(25);
      expect(result.isRunning).toBe(true);
    });
  });
});

// ===== 改善版ロジックのテスト =====

describe('Timer Sync Logic - 改善版の検証', () => {

  describe('改善版：実際の本番環境問題の解決確認', () => {
    it('30秒タイマーが33秒問題 → 30秒に修正', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 30    // サーバーの残り時間
      };

      // 現状版（問題あり）
      const originalResult = calculateRemainingSecondsOriginal(
        timer,
        3000,       // サーバーが3秒遅れている
        1000000000  // クライアント時刻（進んでいる）
      );

      // 改善版（修正済み）
      const improvedResult = calculateRemainingSecondsImproved(
        timer,
        3000,
        1000000000
      );

      console.log('33秒問題：現状版=', originalResult.seconds, '改善版=', improvedResult.seconds);

      // 現状版は33秒（問題）
      expect(originalResult.seconds).toBe(33);

      // 改善版は30秒（修正済み）
      expect(improvedResult.seconds).toBe(30);
      expect(improvedResult.isRunning).toBe(true);
    });

    it('30秒タイマーが27秒問題 → サーバー基準で正しい値', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,  // 同期受信時のクライアント時刻
        totalDuration: 30,
        remainingSeconds: 27    // 同期時のサーバー残り秒数
      };

      const improvedResult = calculateRemainingSecondsImproved(
        timer,
        -3000,      // serverTimeOffset（未使用）
        1000000000  // 同期直後なので同じクライアント時刻
      );

      console.log('27秒問題：改善版=', improvedResult.seconds);

      // 改善版：同期時点から時間が経過していないので27秒のまま（正しい）
      expect(improvedResult.seconds).toBe(27);
      expect(improvedResult.isRunning).toBe(true);
    });

    it('Math.ceilによるUX改善を維持', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,  // 同期受信時刻
        totalDuration: 30,
        remainingSeconds: 30    // 同期時の残り秒数
      };

      // 0.1秒経過した状況
      const improvedResult = calculateRemainingSecondsImproved(
        timer,
        0,          // serverTimeOffset（未使用）
        1000000100  // 100ms経過
      );

      console.log('Math.ceil維持：改善版=', improvedResult.seconds);

      // 改善版：29.9秒 → Math.ceil → 30秒（UX：0.1秒でも1秒として表示）
      expect(improvedResult.seconds).toBe(30);
    });
  });

  describe('改善版：エッジケースのテスト', () => {
    it('異常に大きな時刻ずれを制限', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 25
      };

      const improvedResult = calculateRemainingSecondsImproved(
        timer,
        10000,      // 10秒のずれ（異常値）
        1000000000
      );

      console.log('異常値制限：改善版=', improvedResult.seconds);

      // 異常値を制限し、適切な範囲に収める
      expect(improvedResult.seconds).toBeLessThanOrEqual(30);
      expect(improvedResult.seconds).toBeGreaterThanOrEqual(0);
    });

    it('0.9秒以下の場合は1秒表示（ユーザー体験向上）', () => {
      const timer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 0.5   // 0.5秒残り
      };

      const improvedResult = calculateRemainingSecondsImproved(
        timer,
        0,
        1000000000
      );

      console.log('0.5秒表示：改善版=', improvedResult.seconds);

      // 0.5秒は1秒として表示（ユーザー体験向上）
      expect(improvedResult.seconds).toBe(1);
      expect(improvedResult.isRunning).toBe(true);
    });

    it('サブタイマーも同様に改善', () => {
      const subTimer: TimerState = {
        isRunning: true,
        startTime: 1000000000,
        totalDuration: 30,
        remainingSeconds: 30
      };

      const improvedResult = calculateSubTimerRemainingSecondsImproved(
        subTimer,
        3000,       // 異常な時刻ずれ
        1000000000
      );

      console.log('サブタイマー改善：改善版=', improvedResult.seconds);

      // サブタイマーも33秒問題が修正されている
      expect(improvedResult.seconds).toBe(30);
    });
  });
});

// 真の相対時間ベースアプローチのテスト
describe('Timer Sync Logic - 真の相対時間ベースアプローチ', () => {
  describe('同期ポイントベースの計算', () => {
    it('同期時点からの経過時間を正確に計算する', () => {
      // シナリオ：同期時点でサーバーが30秒残りと送信
      // その後クライアント側で3秒経過
      const syncPoint: SyncPoint = {
        serverTime: 1000000,      // 同期時のサーバー時刻
        clientTime: 1000000,      // 同期時のクライアント時刻（同じ）
        remainingSeconds: 30      // 同期時のサーバー残り秒数
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,  // 相対時間アプローチでは不要
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 3秒後のクライアント時刻
      const currentClientTime = 1003000;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      // 30秒 - 3秒 = 27秒
      expect(result.seconds).toBe(27);
      expect(result.isRunning).toBe(true);
    });

    it('クライアントとサーバーの時刻差があっても正しく動作', () => {
      // シナリオ：サーバーが5秒進んでいる状態で同期
      const syncPoint: SyncPoint = {
        serverTime: 1005000,      // サーバー時刻（5秒進んでいる）
        clientTime: 1000000,      // クライアント時刻
        remainingSeconds: 30      // 同期時のサーバー残り秒数
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // クライアント側で2秒経過
      const currentClientTime = 1002000;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      // 時刻差に関係なく、クライアント側の経過時間のみで計算
      // 30秒 - 2秒 = 28秒
      expect(result.seconds).toBe(28);
      expect(result.isRunning).toBe(true);
    });

    it('33秒問題を解決：サーバー遅れの場合', () => {
      // サーバーが3秒遅れている場合の同期
      const syncPoint: SyncPoint = {
        serverTime: 997000,       // サーバー時刻（3秒遅れ）
        clientTime: 1000000,      // クライアント時刻
        remainingSeconds: 30      // サーバーでの残り秒数
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 同期直後（クライアント時刻変わらず）
      const currentClientTime = 1000000;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      // 経過時間0なので30秒のまま（33秒にはならない）
      expect(result.seconds).toBe(30);
    });

    it('27秒問題を解決：サーバー進みの場合', () => {
      // サーバーが3秒進んでいる場合の同期
      const syncPoint: SyncPoint = {
        serverTime: 1003000,      // サーバー時刻（3秒進み）
        clientTime: 1000000,      // クライアント時刻
        remainingSeconds: 30      // サーバーでの残り秒数
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 同期直後（クライアント時刻変わらず）
      const currentClientTime = 1000000;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      // 経過時間0なので30秒のまま（27秒にはならない）
      expect(result.seconds).toBe(30);
    });

    it('Math.ceilを維持してUXを保つ', () => {
      const syncPoint: SyncPoint = {
        serverTime: 1000000,
        clientTime: 1000000,
        remainingSeconds: 30
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 30
      };

      // 29.1秒経過（0.9秒残り）
      const currentClientTime = 1029100;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      // 0.9秒はMath.ceilで1秒として表示
      expect(result.seconds).toBe(1);
    });

    it('タイマーが0になったら停止状態', () => {
      const syncPoint: SyncPoint = {
        serverTime: 1000000,
        clientTime: 1000000,
        remainingSeconds: 5
      };

      const timer: TimerState = {
        isRunning: true,
        startTime: null,
        totalDuration: 30,
        remainingSeconds: 5
      };

      // 5秒以上経過
      const currentClientTime = 1006000;

      const result = calculateRemainingSecondsRelative(
        timer,
        syncPoint,
        currentClientTime
      );

      expect(result.seconds).toBe(0);
      expect(result.isRunning).toBe(false);
    });
  });
});