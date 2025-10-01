import { useState, useEffect } from 'preact/hooks';
import { ScoreBoard } from './ScoreBoard';
import { MainTimer } from './Timer/MainTimer';
import { SubTimer } from './Timer/SubTimer';
import { StatusBar } from './StatusBar';
import { VersusIndicator } from './VersusIndicator';
import { CreditsModal } from './CreditsModal';
import { QRModal } from './QRModal';
import { TimeSyncModal } from './TimeSyncModal';
import { ControlPanel } from './ControlPanel';
import { LoadingModal } from './LoadingModal';
import { useGameState } from '../hooks/useGameState';
import { useTimerAnimation } from '../hooks/useTimerAnimation';

interface Props {
  gameId: string;
}

export function App({ gameId }: Props) {
  // ゲーム状態とWebSocket通信
  const {
    gameState,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    errorMessage,
    sendingData,
    receivingData,
    serverTimeOffset,
    lastRTT,
    timeSyncStatus,
    lastSyncTime,
    lastSyncClientTime,
    lastSyncServerTime,
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
    resetAll,
    reconnect,
    requestTimeSync
  } = useGameState({ gameId });

  // モーダルの状態管理
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTimeSyncModal, setShowTimeSyncModal] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);

  // ステータスバー表示制御
  const [showStatusBar, setShowStatusBar] = useState(true);

  // ローカル表示反転状態（サーバーとは独立）
  const [displayFlipped, setDisplayFlipped] = useState(() => {
    try {
      const stored = localStorage.getItem(`v2_kabaddi_display_flipped_${gameId}`);
      return stored === 'true';
    } catch (error) {
      console.error('Failed to read displayFlipped from localStorage:', error);
      return false;
    }
  });

  const handleOpenCreditsModal = () => {
    setShowCreditsModal(true);
  };

  const handleCloseCreditsModal = () => {
    setShowCreditsModal(false);
  };

  const handleOpenQRModal = () => {
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
  };

  const handleOpenTimeSyncModal = () => {
    setShowTimeSyncModal(true);
  };

  const handleCloseTimeSyncModal = () => {
    setShowTimeSyncModal(false);
  };

  const handleOpenControlPanel = () => {
    setShowControlPanel(true);
  };

  const handleCloseControlPanel = () => {
    setShowControlPanel(false);
  };

  const toggleStatusBar = () => {
    setShowStatusBar(prev => !prev);
  };

  const toggleDisplayFlip = () => {
    setDisplayFlipped(prev => !prev);
  };

  // displayFlippedをlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(`v2_kabaddi_display_flipped_${gameId}`, String(displayFlipped));
    } catch (error) {
      console.error('Failed to save displayFlipped to localStorage:', error);
    }
  }, [displayFlipped, gameId]);

  // ゲーム状態が読み込まれるまで、または接続中はLoadingModalを表示
  if (!gameState || connectionStatus !== 'connected') {
    return (
      <LoadingModal
        connectionStatus={connectionStatus}
        reconnectAttempts={reconnectAttempts}
        maxReconnectAttempts={maxReconnectAttempts}
        errorMessage={errorMessage}
        onRetry={reconnect}
      />
    );
  }

  // leftSideTeamに基づいて左右のチームを決定（サーバー状態ベース）
  const baseLeftTeam = gameState.leftSideTeam === 'teamA'
    ? { ...gameState.teamA, color: 'red' as const }
    : { ...gameState.teamB, color: 'blue' as const };

  const baseRightTeam = gameState.leftSideTeam === 'teamA'
    ? { ...gameState.teamB, color: 'blue' as const }
    : { ...gameState.teamA, color: 'red' as const };

  // チームIDも計算（サーバー状態ベース）
  const baseLeftTeamId: 'teamA' | 'teamB' = gameState.leftSideTeam;
  const baseRightTeamId: 'teamA' | 'teamB' = gameState.leftSideTeam === 'teamA' ? 'teamB' : 'teamA';

  // ローカル表示反転を適用
  const leftTeam = displayFlipped ? baseRightTeam : baseLeftTeam;
  const rightTeam = displayFlipped ? baseLeftTeam : baseRightTeam;
  const leftTeamId = displayFlipped ? baseRightTeamId : baseLeftTeamId;
  const rightTeamId = displayFlipped ? baseLeftTeamId : baseRightTeamId;

  // タイマーアニメーション: V1と同じrequestAnimationFrameループで毎フレーム更新
  const { mainTimerSeconds, subTimerSeconds, subTimerIsRunning } = useTimerAnimation(gameState, serverTimeOffset);

  return (
    <>
      {/* デスクトップ表示用 (md以上) */}
      <div className="hidden md:flex h-screen flex-col bg-gray-900">
        {/* ヘッダー */}
        <div className="text-white">
          <div className="grid w-full" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
            <div className={`p-4 ${leftTeam.color === 'red' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <h1 className="text-3xl font-bold text-center">{leftTeam.name}</h1>
            </div>
            <VersusIndicator onClick={toggleDisplayFlip} displayFlipped={displayFlipped} />
            <div className={`p-4 ${rightTeam.color === 'blue' ? 'bg-blue-600' : 'bg-red-600'}`}>
              <h1 className="text-3xl font-bold text-center">{rightTeam.name}</h1>
            </div>
          </div>
        </div>

        {/* メインスコア表示 */}
        <div className="flex-1 grid grid-cols-3 gap-0 pb-16 touch-none" style={{ gridTemplateRows: '1fr 1.5fr' }}>
          {/* 上段：左側チーム */}
          <ScoreBoard
            team={leftTeam}
            position="left"
          />

          {/* 上段：サブタイマー */}
          <div
            className="bg-gray-800 text-white flex flex-col items-center justify-center py-1 px-4 cursor-pointer"
            onClick={toggleStatusBar}
          >
            <SubTimer seconds={subTimerSeconds} isRunning={subTimerIsRunning} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={rightTeam}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-4 pb-4 pt-2">
            <MainTimer
              minutes={Math.floor(mainTimerSeconds / 60)}
              seconds={mainTimerSeconds % 60}
              isRunning={gameState.timer.isRunning}
            />
          </div>
        </div>

        {/* ステータスバー */}
        {showStatusBar && (
          <StatusBar gameId={gameId} connectionStatus={connectionStatus} timeSyncStatus={timeSyncStatus} sendingData={sendingData} receivingData={receivingData} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} onTimeSyncClick={handleOpenTimeSyncModal} onControlPanelClick={handleOpenControlPanel} />
        )}
      </div>

      {/* モバイル表示用 (md未満) */}
      <div className="md:hidden h-screen flex flex-col bg-gray-900 touch-manipulation overflow-hidden">
        {/* ヘッダー */}
        <div className="text-white">
          <div className="grid w-full" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
            <div className={`p-2 ${leftTeam.color === 'red' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <h1 className="text-lg font-bold text-center">{leftTeam.name}</h1>
            </div>
            <VersusIndicator onClick={toggleDisplayFlip} displayFlipped={displayFlipped} />
            <div className={`p-2 ${rightTeam.color === 'blue' ? 'bg-blue-600' : 'bg-red-600'}`}>
              <h1 className="text-lg font-bold text-center">{rightTeam.name}</h1>
            </div>
          </div>
        </div>

        {/* メインスコア表示 */}
        <div className="flex-1 grid grid-cols-3 gap-0 pb-16 touch-none" style={{ gridTemplateRows: '0.7fr 0.6fr', maxHeight: '45vh' }}>
          {/* 上段：左側チーム */}
          <ScoreBoard
            team={leftTeam}
            position="left"
          />

          {/* 上段：サブタイマー */}
          <div
            className="bg-gray-800 text-white flex flex-col items-center justify-center py-0.5 px-1 cursor-pointer"
            onClick={toggleStatusBar}
          >
            <SubTimer seconds={subTimerSeconds} isRunning={subTimerIsRunning} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={rightTeam}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-1 pt-8 pb-2">
            <MainTimer
              minutes={Math.floor(mainTimerSeconds / 60)}
              seconds={mainTimerSeconds % 60}
              isRunning={gameState.timer.isRunning}
            />
          </div>
        </div>

        {/* ステータスバー */}
        {showStatusBar && (
          <StatusBar gameId={gameId} connectionStatus={connectionStatus} timeSyncStatus={timeSyncStatus} sendingData={sendingData} receivingData={receivingData} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} onTimeSyncClick={handleOpenTimeSyncModal} onControlPanelClick={handleOpenControlPanel} />
        )}
      </div>

      {/* クレジットモーダル */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={handleCloseCreditsModal}
      />

      {/* QRモーダル */}
      <QRModal
        isOpen={showQRModal}
        onClose={handleCloseQRModal}
        gameId={gameId}
      />

      {/* 時刻同期モーダル */}
      <TimeSyncModal
        isOpen={showTimeSyncModal}
        onClose={handleCloseTimeSyncModal}
        timeSyncStatus={timeSyncStatus}
        serverTimeOffset={serverTimeOffset}
        lastRTT={lastRTT}
        lastSyncTime={lastSyncTime}
        lastSyncClientTime={lastSyncClientTime}
        lastSyncServerTime={lastSyncServerTime}
        onRequestTimeSync={requestTimeSync}
      />

      {/* コントロールパネル */}
      <ControlPanel
        isOpen={showControlPanel}
        onClose={handleCloseControlPanel}
        gameState={gameState}
        leftTeam={leftTeam}
        rightTeam={rightTeam}
        leftTeamId={leftTeamId}
        rightTeamId={rightTeamId}
        displayFlipped={displayFlipped}
        scoreUpdate={scoreUpdate}
        resetTeamScore={resetTeamScore}
        resetAllScores={resetAllScores}
        doOrDieUpdate={doOrDieUpdate}
        doOrDieReset={doOrDieReset}
        setTeamName={setTeamName}
        timerStart={timerStart}
        timerPause={timerPause}
        timerReset={timerReset}
        timerSet={timerSet}
        timerAdjust={timerAdjust}
        subTimerStart={subTimerStart}
        subTimerPause={subTimerPause}
        subTimerReset={subTimerReset}
        courtChange={courtChange}
        resetAll={resetAll}
      />
    </>
  );
}