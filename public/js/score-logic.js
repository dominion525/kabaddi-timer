"use strict";
// スコアロジックモジュール
// スコア表示とDo or Die関連のロジックを担当
// 責務の分離によりタイマーロジックから独立
(function (global) {
    'use strict';
    /**
     * Do or Die インジケーター配列を生成
     * @param count - 現在のカウント
     * @param max - 最大値（デフォルト3）
     * @returns インジケーター状態の配列
     */
    function generateDoOrDieIndicators(count, max = 3) {
        return Array(max).fill(0).map((_, i) => i < (count || 0));
    }
    /**
     * スコア表示のフォーマット
     * @param score - スコア値
     * @returns フォーマットされたスコア文字列
     */
    function formatScore(score) {
        return String(score || 0);
    }
    /**
     * スコアの妥当性検証
     * @param score - 検証するスコア値
     * @returns 有効なスコアの場合true
     */
    function isValidScore(score) {
        return Number.isInteger(score) && score >= 0 && score <= 999;
    }
    /**
     * Do or Dieカウントの妥当性検証
     * @param count - 検証するカウント値
     * @returns 有効なカウントの場合true
     */
    function isValidDoOrDieCount(count) {
        return Number.isInteger(count) && count >= 0 && count <= 3;
    }
    /**
     * チーム名の妥当性検証
     * @param name - 検証するチーム名
     * @returns 有効なチーム名の場合true
     */
    function isValidTeamName(name) {
        if (typeof name !== 'string')
            return false;
        const trimmed = name.trim();
        return trimmed.length > 0 && trimmed.length <= 20;
    }
    // グローバル名前空間に公開
    const ScoreLogic = {
        generateDoOrDieIndicators,
        formatScore,
        isValidScore,
        isValidDoOrDieCount,
        isValidTeamName
    };
    global.ScoreLogic = ScoreLogic;
})(window);
