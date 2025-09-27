// アクション作成ヘルパーモジュール
// WebSocketアクションの生成とバリデーションを担当
// タイプセーフで一貫性のあるアクション作成を支援

(function(global: any) {
  'use strict';

  /**
   * アクション作成ファクトリーの初期化
   * 依存性注入でConstants モジュールを受け取る
   * @param {Object} constants - 定数管理オブジェクト
   * @returns {Object} アクション作成関数群
   */
  function createActionCreators(constants: any) {
    const { ACTIONS, VALIDATION_CONSTRAINTS } = constants;

    /**
     * 基本アクションの作成
     * @param {string} type - アクションタイプ
     * @param {Object} payload - アクションのペイロード（省略可能）
     * @returns {Object} アクションオブジェクト
     */
    function createBaseAction(type: string, payload: any = {}): any {
      const action = { type };

      // ペイロードがある場合は追加
      if (Object.keys(payload).length > 0) {
        Object.assign(action, payload);
      }

      return action;
    }

    /**
     * タイマー関連アクションの作成
     */
    const TimerActions = {
      /**
       * タイマー開始アクション
       * @returns {Object} TIMER_START アクション
       */
      start() {
        return ACTIONS.TIMER_START;
      },

      /**
       * タイマー一時停止アクション
       * @returns {Object} TIMER_PAUSE アクション
       */
      pause() {
        return ACTIONS.TIMER_PAUSE;
      },

      /**
       * タイマーリセットアクション
       * @returns {Object} TIMER_RESET アクション
       */
      reset() {
        return ACTIONS.TIMER_RESET;
      },

      /**
       * タイマー設定アクション
       * @param {number} minutes - 分
       * @param {number} seconds - 秒
       * @returns {Object} TIMER_SET アクション
       */
      set(minutes: number, seconds: number) {
        // バリデーション
        if (!Number.isInteger(minutes) || minutes < 0) {
          throw new Error('分は0以上の整数である必要があります');
        }
        if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
          throw new Error('秒は0以上59以下の整数である必要があります');
        }

        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds < VALIDATION_CONSTRAINTS.timer.minTotalSeconds) {
          throw new Error('タイマーは1秒以上設定してください');
        }

        return createBaseAction(ACTIONS.TIMER_SET, {
          minutes,
          seconds,
          duration: totalSeconds
        });
      },

      /**
       * タイマー調整アクション
       * @param {number} seconds - 調整する秒数（正負どちらも可）
       * @returns {Object} TIMER_ADJUST アクション
       */
      adjust(seconds: number) {
        if (!Number.isInteger(seconds)) {
          throw new Error('調整する秒数は整数である必要があります');
        }

        return createBaseAction(ACTIONS.TIMER_ADJUST, { seconds });
      }
    };

    /**
     * サブタイマー関連アクションの作成
     */
    const SubTimerActions = {
      /**
       * サブタイマー開始アクション
       * @returns {Object} SUB_TIMER_START アクション
       */
      start() {
        return createBaseAction(ACTIONS.SUB_TIMER_START);
      },

      /**
       * サブタイマー一時停止アクション
       * @returns {Object} SUB_TIMER_PAUSE アクション
       */
      pause() {
        return createBaseAction(ACTIONS.SUB_TIMER_PAUSE);
      },

      /**
       * サブタイマーリセットアクション
       * @returns {Object} SUB_TIMER_RESET アクション
       */
      reset() {
        return createBaseAction(ACTIONS.SUB_TIMER_RESET);
      }
    };

    /**
     * スコア関連アクションの作成
     */
    const ScoreActions = {
      /**
       * スコア更新アクション
       * @param {string} team - チーム識別子（'teamA' または 'teamB'）
       * @param {number} points - 変更するポイント数
       * @returns {Object} SCORE_UPDATE アクション
       */
      update(team: string, points: number) {
        // チーム識別子のバリデーション
        if (team !== 'teamA' && team !== 'teamB') {
          throw new Error('チーム識別子は "teamA" または "teamB" である必要があります');
        }

        // ポイントのバリデーション
        if (!Number.isInteger(points)) {
          throw new Error('ポイントは整数である必要があります');
        }

        return createBaseAction(ACTIONS.SCORE_UPDATE, { team, points });
      },

      /**
       * スコアリセットアクション
       * @returns {Object} RESET_SCORES アクション
       */
      reset() {
        return ACTIONS.RESET_SCORES;
      }
    };

    /**
     * Do or Die 関連アクションの作成
     */
    const DoOrDieActions = {
      /**
       * Do or Die カウント更新アクション
       * @param {string} team - チーム識別子（'teamA' または 'teamB'）
       * @param {number} delta - 変更量（通常 +1 または -1）
       * @returns {Object} DO_OR_DIE_UPDATE アクション
       */
      update(team: string, delta: number) {
        // チーム識別子のバリデーション
        if (team !== 'teamA' && team !== 'teamB') {
          throw new Error('チーム識別子は "teamA" または "teamB" である必要があります');
        }

        // デルタのバリデーション
        if (!Number.isInteger(delta)) {
          throw new Error('変更量は整数である必要があります');
        }

        return createBaseAction(ACTIONS.DO_OR_DIE_UPDATE, { team, delta });
      },

      /**
       * Do or Die リセットアクション
       * @returns {Object} DO_OR_DIE_RESET アクション
       */
      reset() {
        return ACTIONS.DO_OR_DIE_RESET;
      }
    };

    /**
     * チーム関連アクションの作成
     */
    const TeamActions = {
      /**
       * チーム名設定アクション
       * @param {string} team - チーム識別子（'teamA' または 'teamB'）
       * @param {string} name - チーム名
       * @returns {Object} SET_TEAM_NAME アクション
       */
      setName(team: string, name: string) {
        // チーム識別子のバリデーション
        if (team !== 'teamA' && team !== 'teamB') {
          throw new Error('チーム識別子は "teamA" または "teamB" である必要があります');
        }

        // チーム名のバリデーション
        if (typeof name !== 'string') {
          throw new Error('チーム名は文字列である必要があります');
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
          throw new Error('チーム名を入力してください');
        }

        if (name.length > VALIDATION_CONSTRAINTS.teamName.maxLength) {
          throw new Error(`チーム名は${VALIDATION_CONSTRAINTS.teamName.maxLength}文字以内で入力してください`);
        }

        if (!VALIDATION_CONSTRAINTS.teamName.pattern.test(name)) {
          throw new Error('チーム名の先頭・末尾に空白文字は使用できません');
        }

        return createBaseAction(ACTIONS.SET_TEAM_NAME, { team, name });
      },

      /**
       * コートチェンジアクション
       * @returns {Object} COURT_CHANGE アクション
       */
      courtChange() {
        return createBaseAction(ACTIONS.COURT_CHANGE);
      }
    };

    /**
     * システム関連アクションの作成
     */
    const SystemActions = {
      /**
       * 全体リセットアクション
       * @returns {Object} RESET_ALL アクション
       */
      resetAll() {
        return createBaseAction(ACTIONS.RESET_ALL);
      },

      /**
       * ゲーム状態取得リクエストアクション
       * @returns {Object} GET_GAME_STATE アクション
       */
      getGameState() {
        return createBaseAction(ACTIONS.GET_GAME_STATE);
      }
    };

    /**
     * アクションオブジェクトのバリデーション
     * @param {Object} action - 検証するアクションオブジェクト
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    function validateAction(action: any): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];

      // 基本構造のチェック
      if (!action || typeof action !== 'object') {
        errors.push('アクションはオブジェクトである必要があります');
        return { isValid: false, errors };
      }

      // typeフィールドのチェック
      if (!action.type || typeof action.type !== 'string') {
        errors.push('アクションにはtypeフィールド（文字列）が必要です');
      } else if (!constants.isValidActionType(action.type)) {
        errors.push(`不正なアクションタイプ: ${action.type}`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }

    /**
     * 便利なアクション作成関数
     * よく使用されるアクションパターンの短縮形
     */
    const QuickActions = {
      /**
       * スコア増加アクション（+1）
       * @param {string} team - チーム識別子
       * @returns {Object} スコア+1アクション
       */
      incrementScore(team: string) {
        return ScoreActions.update(team, 1);
      },

      /**
       * スコア減少アクション（-1）
       * @param {string} team - チーム識別子
       * @returns {Object} スコア-1アクション
       */
      decrementScore(team: string) {
        return ScoreActions.update(team, -1);
      },

      /**
       * Do or Die 増加アクション（+1）
       * @param {string} team - チーム識別子
       * @returns {Object} Do or Die +1アクション
       */
      incrementDoOrDie(team: string) {
        return DoOrDieActions.update(team, 1);
      },

      /**
       * Do or Die 減少アクション（-1）
       * @param {string} team - チーム識別子
       * @returns {Object} Do or Die -1アクション
       */
      decrementDoOrDie(team: string) {
        return DoOrDieActions.update(team, -1);
      }
    };

    /**
     * デバッグ用の情報取得
     * @returns {Object} 利用可能なアクション一覧とその詳細
     */
    function debug() {
      return {
        availableActionTypes: Object.keys(ACTIONS),
        actionCategories: {
          timer: Object.keys(TimerActions),
          subTimer: Object.keys(SubTimerActions),
          score: Object.keys(ScoreActions),
          doOrDie: Object.keys(DoOrDieActions),
          team: Object.keys(TeamActions),
          system: Object.keys(SystemActions),
          quick: Object.keys(QuickActions)
        },
        validationConstraints: VALIDATION_CONSTRAINTS
      };
    }

    // 公開API
    return {
      // カテゴリ別アクション作成
      timer: TimerActions,
      subTimer: SubTimerActions,
      score: ScoreActions,
      doOrDie: DoOrDieActions,
      team: TeamActions,
      system: SystemActions,

      // 便利関数
      quick: QuickActions,

      // 基本関数
      create: createBaseAction,
      validate: validateAction,

      // デバッグ
      debug
    };
  }

  // グローバルに公開
  global.createActionCreators = createActionCreators;

})(window);