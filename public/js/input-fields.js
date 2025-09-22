"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputFieldsScript = void 0;
// input-fields.jsの内容を読み込んでエクスポート
exports.inputFieldsScript = `
// 入力フィールド管理モジュール
// タイマー・チーム名入力値を管理する純粋関数群
// バリデーション機能とプリセット管理を含む

(function(global) {
  'use strict';

  /**
   * 入力フィールド管理のファクトリー関数
   * 依存性注入に対応し、テスタブルな設計
   * @param {Object} apis - ブラウザAPI抽象化オブジェクト
   * @param {Object} defaultValues - デフォルト値設定
   * @returns {Object} 入力フィールド管理オブジェクト
   */
  function createInputFields(apis, defaultValues) {
    // 内部状態
    let state = {
      // タイマー入力値
      timerInputMinutes: defaultValues.timer.presetMinutes.short,
      timerInputSeconds: 0,

      // チーム名入力値
      teamANameInput: defaultValues.teamNames.teamA,
      teamBNameInput: defaultValues.teamNames.teamB
    };

    // バリデーション設定
    const VALIDATION_RULES = {
      timer: {
        minutes: { min: 0, max: 999 },
        seconds: { min: 0, max: 59 }
      },
      teamName: {
        maxLength: 20,
        pattern: /^[^\\s].*[^\\s]$|^[^\\s]$/ // 先頭末尾空白文字なし
      }
    };

    /**
     * タイマー入力値のバリデーション
     * @param {number} minutes - 分
     * @param {number} seconds - 秒
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    function validateTimerInput(minutes, seconds) {
      const errors = [];

      // 数値チェック
      if (!Number.isInteger(minutes) || minutes < 0) {
        errors.push('分は0以上の整数で入力してください');
      } else if (minutes > VALIDATION_RULES.timer.minutes.max) {
        errors.push(\`分は\${VALIDATION_RULES.timer.minutes.max}以下で入力してください\`);
      }

      if (!Number.isInteger(seconds) || seconds < 0) {
        errors.push('秒は0以上の整数で入力してください');
      } else if (seconds > VALIDATION_RULES.timer.seconds.max) {
        errors.push(\`秒は\${VALIDATION_RULES.timer.seconds.max}以下で入力してください\`);
      }

      // 合計時間チェック（0秒は無効）
      if (errors.length === 0 && minutes === 0 && seconds === 0) {
        errors.push('タイマーは1秒以上設定してください');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    /**
     * チーム名のバリデーション
     * @param {string} teamName - チーム名
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    function validateTeamName(teamName) {
      const errors = [];

      // 文字列チェック
      if (typeof teamName !== 'string') {
        errors.push('チーム名は文字列で入力してください');
        return { isValid: false, errors: errors };
      }

      // 長さチェック
      if (teamName.trim().length === 0) {
        errors.push('チーム名を入力してください');
      } else if (teamName.length > VALIDATION_RULES.teamName.maxLength) {
        errors.push(\`チーム名は\${VALIDATION_RULES.teamName.maxLength}文字以内で入力してください\`);
      }

      // パターンチェック（先頭末尾の空白文字）
      if (teamName.length > 0 && !VALIDATION_RULES.teamName.pattern.test(teamName)) {
        errors.push('チーム名の先頭・末尾に空白文字は使用できません');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    /**
     * タイマー入力値を設定
     * @param {number} minutes - 分
     * @param {number} seconds - 秒
     * @returns {Object} { success: boolean, errors?: string[] }
     */
    function setTimerInput(minutes, seconds) {
      const validation = validateTimerInput(minutes, seconds);

      if (validation.isValid) {
        state.timerInputMinutes = minutes;
        state.timerInputSeconds = seconds;
        return { success: true };
      } else {
        return { success: false, errors: validation.errors };
      }
    }

    /**
     * タイマープリセットを設定
     * @param {string} presetKey - プリセットキー（short, medium, long）
     * @returns {Object} { success: boolean, minutes: number, errors?: string[] }
     */
    function setTimerPreset(presetKey) {
      const presetMinutes = defaultValues.timer.presetMinutes[presetKey];

      if (presetMinutes === undefined) {
        return {
          success: false,
          errors: [\`不正なプリセットキー: \${presetKey}\`]
        };
      }

      const result = setTimerInput(presetMinutes, 0);
      return {
        ...result,
        minutes: presetMinutes
      };
    }

    /**
     * チーム名入力値を設定
     * @param {string} team - チーム識別子（teamA, teamB）
     * @param {string} name - チーム名
     * @returns {Object} { success: boolean, errors?: string[] }
     */
    function setTeamNameInput(team, name) {
      const validation = validateTeamName(name);

      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      if (team === 'teamA') {
        state.teamANameInput = name;
      } else if (team === 'teamB') {
        state.teamBNameInput = name;
      } else {
        return {
          success: false,
          errors: [\`不正なチーム識別子: \${team}\`]
        };
      }

      return { success: true };
    }

    /**
     * サーバー状態との同期
     * サーバーからゲーム状態を受信した際の入力値更新
     * @param {Object} gameState - サーバーから受信したゲーム状態
     */
    function syncWithGameState(gameState) {
      if (gameState.teamA && gameState.teamA.name) {
        state.teamANameInput = gameState.teamA.name;
      }

      if (gameState.teamB && gameState.teamB.name) {
        state.teamBNameInput = gameState.teamB.name;
      }

      // タイマーが停止中の場合のみ入力値を同期
      if (gameState.timer && !gameState.timer.isRunning && gameState.timer.remainingSeconds) {
        const totalSeconds = Math.floor(gameState.timer.remainingSeconds);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // バリデーションは行わず直接設定（サーバー値は信頼）
        state.timerInputMinutes = minutes;
        state.timerInputSeconds = seconds;
      }
    }

    /**
     * 現在の入力値を取得
     * @returns {Object} 現在の入力値のコピー
     */
    function getInputValues() {
      return {
        timerInputMinutes: state.timerInputMinutes,
        timerInputSeconds: state.timerInputSeconds,
        teamANameInput: state.teamANameInput,
        teamBNameInput: state.teamBNameInput
      };
    }

    /**
     * 特定の入力値を取得
     * @param {string} key - 入力値のキー名
     * @returns {*} 指定された入力値
     */
    function get(key) {
      return state[key];
    }

    /**
     * タイマー総秒数を計算
     * @returns {number} 分と秒を合計した総秒数
     */
    function getTimerTotalSeconds() {
      return (state.timerInputMinutes * 60) + state.timerInputSeconds;
    }

    /**
     * 利用可能なプリセット一覧を取得
     * @returns {Array} プリセット情報の配列
     */
    function getAvailablePresets() {
      return Object.keys(defaultValues.timer.presetMinutes).map(key => ({
        key: key,
        minutes: defaultValues.timer.presetMinutes[key],
        displayName: \`\${defaultValues.timer.presetMinutes[key]}分\`
      }));
    }

    /**
     * 状態を直接設定（テスト用）
     * @param {string} key - 設定するキー
     * @param {*} value - 設定する値
     */
    function setState(key, value) {
      if (key in state) {
        state[key] = value;
      } else {
        apis.console.warn('Unknown input field key:', key);
      }
    }

    /**
     * 入力値をデフォルト値にリセット
     */
    function resetToDefaults() {
      state.timerInputMinutes = defaultValues.timer.presetMinutes.short;
      state.timerInputSeconds = 0;
      state.teamANameInput = defaultValues.teamNames.teamA;
      state.teamBNameInput = defaultValues.teamNames.teamB;
    }

    /**
     * デバッグ用の状態ダンプ
     * @returns {Object} 現在の内部状態とバリデーション設定
     */
    function debug() {
      return {
        state: getInputValues(),
        validationRules: VALIDATION_RULES,
        timerTotalSeconds: getTimerTotalSeconds(),
        availablePresets: getAvailablePresets()
      };
    }

    // 公開API
    return {
      // 入力値設定
      setTimerInput,
      setTimerPreset,
      setTeamNameInput,

      // バリデーション
      validateTimerInput,
      validateTeamName,

      // 同期・取得
      syncWithGameState,
      getInputValues,
      get,
      getTimerTotalSeconds,
      getAvailablePresets,

      // ユーティリティ
      resetToDefaults,

      // テスト・デバッグ用
      setState,
      debug
    };
  }

  // グローバルに公開
  global.createInputFields = createInputFields;

  // CommonJS対応
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createInputFields };
  }

})(typeof window !== 'undefined' ? window : global);
`;
