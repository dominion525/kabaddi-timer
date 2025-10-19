import { useEffect, useState } from 'preact/hooks';
import { JSX } from 'preact';
import { DoOrDieIncrementButton, DoOrDieDecrementButton, DoOrDieResetButton } from './DoOrDieControl';
import { ScoreIncrementButton, ScoreDecrementButton, ScoreResetButton } from './ScoreControl';
import { TeamOperationGrid } from './TeamOperationGrid';
import { TeamNameSettings } from './TeamNameSettings';
import { OverallControlSection } from './OverallControlSection';
import { SubTimerControl } from './SubTimerControl';
import { TimerPresetButtons } from './TimerPresetButtons';
import { TimerInputField } from './TimerInputField';
import { TimerAdjustButtons } from './TimerAdjustButtons';
import { MainTimerControl } from './MainTimerControl';
import { SimpleTimerControl } from './SimpleTimerControl';
import { SimpleTimerPresetControl } from './SimpleTimerPresetControl';
import { MobileHandleSection } from './MobileHandleSection';
import type { GameState } from '../../types/game';

// localStorage キー
const STORAGE_KEY_SIMPLE_MODE = 'v2_kabaddi_simple_mode';
const STORAGE_KEY_SCROLL_LOCK = 'v2_kabaddi_scroll_lock';

// localStorageからboolean値を取得するヘルパー
const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultValue;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    return defaultValue;
  }
};

interface TeamData {
  name: string;
  score: number;
  doOrDieCount: number;
  color: 'red' | 'blue';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  leftTeam: TeamData;
  rightTeam: TeamData;
  leftTeamId: 'teamA' | 'teamB';
  rightTeamId: 'teamA' | 'teamB';
  displayFlipped: boolean;
  scoreUpdate: (team: 'teamA' | 'teamB', points: number) => void;
  resetTeamScore: (team: 'teamA' | 'teamB') => void;
  resetAllScores: () => void;
  doOrDieUpdate: (team: 'teamA' | 'teamB', delta: number) => void;
  doOrDieReset: () => void;
  setTeamName: (team: 'teamA' | 'teamB', name: string) => void;
  timerStart: () => void;
  timerPause: () => void;
  timerReset: () => void;
  timerSet: (minutes: number, seconds: number) => void;
  timerAdjust: (seconds: number) => void;
  subTimerStart: () => void;
  subTimerPause: () => void;
  subTimerReset: () => void;
  courtChange: () => void;
  resetAll: () => void;
}

export function ControlPanel({
  isOpen,
  onClose,
  gameState,
  leftTeam,
  rightTeam,
  leftTeamId,
  rightTeamId,
  displayFlipped,
  scoreUpdate,
  resetTeamScore,
  resetAllScores,
  doOrDieUpdate,
  doOrDieReset,
  setTeamName,
  timerStart,
  timerPause,
  timerReset,
  timerSet,
  timerAdjust,
  subTimerStart,
  subTimerPause,
  subTimerReset,
  courtChange,
  resetAll
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [simpleMode, setSimpleMode] = useState(() => getStoredBoolean(STORAGE_KEY_SIMPLE_MODE, true));
  const [scrollLockEnabled, setScrollLockEnabled] = useState(() => getStoredBoolean(STORAGE_KEY_SCROLL_LOCK, true));

  // チーム名のローカルstate
  const [teamAName, setTeamAName] = useState('チームA');
  const [teamBName, setTeamBName] = useState('チームB');

  // タイマー入力のローカルstate
  const [timerInputMinutes, setTimerInputMinutes] = useState(15);
  const [timerInputSeconds, setTimerInputSeconds] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackgroundClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleSimpleMode = () => {
    setSimpleMode(!simpleMode);
  };

  const toggleScrollLock = () => {
    setScrollLockEnabled(!scrollLockEnabled);
  };

  // localStorageへの保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIMPLE_MODE, String(simpleMode));
    } catch (error) {
      console.error('Failed to save simpleMode to localStorage:', error);
    }
  }, [simpleMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCROLL_LOCK, String(scrollLockEnabled));
    } catch (error) {
      console.error('Failed to save scrollLockEnabled to localStorage:', error);
    }
  }, [scrollLockEnabled]);

  // アニメーション制御
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 少し遅延してからスライドアップ開始
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // アニメーション完了後に非表示
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [isOpen]);

  // エスケープキーのリスナーを追加とLucideアイコンの初期化
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Lucideアイコンの初期化
    if (window.lucide) {
      window.lucide.createIcons();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // サーバー状態とチーム名の同期（フォーカスチェック付き）
  useEffect(() => {
    if (!gameState) return;

    // チームAの入力フィールドがフォーカス中か確認
    const teamAInput = document.querySelector('input[data-team="teamA"]');
    if (teamAInput !== document.activeElement && gameState.teamA?.name) {
      setTeamAName(gameState.teamA.name);
    }

    // チームBの入力フィールドがフォーカス中か確認
    const teamBInput = document.querySelector('input[data-team="teamB"]');
    if (teamBInput !== document.activeElement && gameState.teamB?.name) {
      setTeamBName(gameState.teamB.name);
    }
  }, [gameState?.teamA?.name, gameState?.teamB?.name]);

  // サーバー状態とタイマー入力値の同期
  // totalDuration（リセット時の戻り値）を表示
  // totalDurationはTIMER_SETでのみ変更される
  // TIMER_ADJUSTではremainingSecondsのみ変更され、totalDurationは変わらないため、入力欄は更新されない
  useEffect(() => {
    if (!gameState?.timer) return;

    // totalDurationを表示（リセット時の戻り値）
    const totalSeconds = gameState.timer.totalDuration;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setTimerInputMinutes(minutes);
    setTimerInputSeconds(seconds);
  }, [gameState?.timer?.totalDuration]);

  return (
    <>
      {/* デスクトップ版オーバーレイ背景 */}
      {isVisible && (
        <div
          className={`hidden md:block fixed inset-0 bg-black z-40 transition-opacity duration-100 ${
            isAnimating ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={handleBackgroundClick}
        />
      )}

      {/* デスクトップ版コントロールパネル */}
      {isVisible && (
        <div
          className={`hidden md:block fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 transition-transform duration-200 ease-in-out touch-manipulation ${
            isAnimating ? 'transform translate-y-0' : 'transform translate-y-full'
          }`}
          style={{ height: '50vh' }}
        >
          {/* パネル内容 */}
          <div className="relative z-50 h-full flex flex-col">
            {/* ハンドル */}
            <div className="bg-gray-200 p-2 text-center cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto"></div>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: '#7F7F7F' }}>
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* チーム名設定 */}
                <TeamNameSettings
                  size="desktop"
                  teamAName={teamAName}
                  teamBName={teamBName}
                  onTeamNameChange={(team, name) => {
                    if (team === 'teamA') {
                      setTeamAName(name);
                    } else {
                      setTeamBName(name);
                    }
                    setTeamName(team, name);
                  }}
                />

            {/* タイマー操作 */}
            <MainTimerControl
              size="desktop"
              timerInputMinutes={timerInputMinutes}
              timerInputSeconds={timerInputSeconds}
              onTimerInputMinutesChange={setTimerInputMinutes}
              onTimerInputSecondsChange={setTimerInputSeconds}
              onTimerSet={timerSet}
              onTimerStart={timerStart}
              onTimerPause={timerPause}
              onTimerReset={timerReset}
              onTimerAdjust={timerAdjust}
            />

            {/* サブタイマー操作 */}
            <SubTimerControl
              size="desktop"
              onStart={subTimerStart}
              onPause={subTimerPause}
              onReset={subTimerReset}
            />

            {/* チーム操作グリッド */}
            <TeamOperationGrid
              size="desktop"
              leftTeam={leftTeam}
              rightTeam={rightTeam}
              leftTeamId={leftTeamId}
              rightTeamId={rightTeamId}
              gameState={gameState}
              scoreUpdate={scoreUpdate}
              doOrDieUpdate={doOrDieUpdate}
              resetTeamScore={resetTeamScore}
            />

            {/* 全体コントロール */}
            <OverallControlSection
              size="desktop"
              onCourtChange={courtChange}
              onResetAll={resetAll}
            />

              </div>
            </div>
          </div>
        </div>
      )}

      {/* モバイル版オーバーレイ背景 */}
      {isOpen && (
        <div
          className={`md:hidden fixed inset-0 bg-black z-40 transition-opacity duration-100 ${
            isAnimating ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={handleBackgroundClick}
        />
      )}

      {/* モバイル版コントロールパネル */}
      {isOpen && (
        <div
          className={`md:hidden fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 transition-transform duration-200 ease-in-out touch-manipulation ${
            isAnimating ? 'transform translate-y-0' : 'transform translate-y-full'
          }`}
          style={{ height: '50vh' }}
        >
        {/* パネル内容 */}
        <div className="relative z-50 h-full flex flex-col">
          {/* ハンドル */}
          <MobileHandleSection
            simpleMode={simpleMode}
            scrollLockEnabled={scrollLockEnabled}
            onClose={onClose}
            onToggleSimpleMode={toggleSimpleMode}
            onToggleScrollLock={toggleScrollLock}
          />

          {/* コンテンツエリア - 通常モード */}
          {!simpleMode && (
            <div className="flex-1 p-3 overflow-y-auto space-y-3" style={{ backgroundColor: '#7F7F7F' }}>
              {/* 全体コントロール */}
              <OverallControlSection
                size="mobile"
                onCourtChange={courtChange}
                onResetAll={resetAll}
              />

              {/* チーム名設定 */}
              <TeamNameSettings
                size="mobile"
                teamAName={teamAName}
                teamBName={teamBName}
                onTeamNameChange={(team, name) => {
                  if (team === 'teamA') {
                    setTeamAName(name);
                  } else {
                    setTeamBName(name);
                  }
                  setTeamName(team, name);
                }}
              />

              {/* タイマー操作 */}
              <MainTimerControl
                size="mobile"
                timerInputMinutes={timerInputMinutes}
                timerInputSeconds={timerInputSeconds}
                onTimerInputMinutesChange={setTimerInputMinutes}
                onTimerInputSecondsChange={setTimerInputSeconds}
                onTimerSet={timerSet}
                onTimerStart={timerStart}
                onTimerPause={timerPause}
                onTimerReset={timerReset}
                onTimerAdjust={timerAdjust}
              />

              {/* サブタイマー操作 */}
              <SubTimerControl
                size="mobile"
                onStart={subTimerStart}
                onPause={subTimerPause}
                onReset={subTimerReset}
              />

              {/* チーム操作グリッド */}
              <TeamOperationGrid
                size="mobile-basic"
                leftTeam={leftTeam}
                rightTeam={rightTeam}
                leftTeamId={leftTeamId}
                rightTeamId={rightTeamId}
                gameState={gameState}
                scoreUpdate={scoreUpdate}
                doOrDieUpdate={doOrDieUpdate}
                resetTeamScore={resetTeamScore}
              />

            </div>
          )}

          {/* コンテンツエリア - シンプルモード */}
          {simpleMode && (
            <div
              className={`flex-1 p-3 space-y-3 ${
                scrollLockEnabled ? '' : 'overflow-y-auto'
              }`}
              style={{ backgroundColor: '#7F7F7F' }}
            >
              {/* タイマー制御 */}
              <SimpleTimerControl
                onTimerStart={timerStart}
                onTimerPause={timerPause}
                onTimerReset={timerReset}
                onSubTimerStart={subTimerStart}
                onSubTimerPause={subTimerPause}
                onSubTimerReset={subTimerReset}
              />

              {/* チーム操作グリッド */}
              <TeamOperationGrid
                size="mobile-simple"
                leftTeam={leftTeam}
                rightTeam={rightTeam}
                leftTeamId={leftTeamId}
                rightTeamId={rightTeamId}
                gameState={gameState}
                scoreUpdate={scoreUpdate}
                doOrDieUpdate={doOrDieUpdate}
                resetTeamScore={resetTeamScore}
              />

              {/* タイマープリセット */}
              <SimpleTimerPresetControl
                onTimerSet={timerSet}
                onTimerAdjust={timerAdjust}
                onCourtChange={courtChange}
              />
            </div>
          )}
        </div>
        </div>
      )}
    </>
  );
}