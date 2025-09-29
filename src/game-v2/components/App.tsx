import { useState } from 'preact/hooks';
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
    serverTimeOffset,
    lastRTT,
    timeSyncStatus,
    lastSyncTime,
    lastSyncClientTime,
    lastSyncServerTime,
    scoreUpdate,
    resetTeamScore,
    resetAllScores,
    reconnect,
    requestTimeSync
  } = useGameState({ gameId });

  // モーダルの状態管理
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTimeSyncModal, setShowTimeSyncModal] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);

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

  const teamA = { ...gameState.teamA, color: 'red' };
  const teamB = { ...gameState.teamB, color: 'blue' };

  return (
    <>
      {/* デスクトップ表示用 (md以上) */}
      <div className="hidden md:flex h-screen flex-col bg-gray-900">
        {/* ヘッダー */}
        <div className="text-white">
          <div className="grid w-full" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
            <div className="p-4 bg-red-600">
              <h1 className="text-3xl font-bold text-center">{teamA.name}</h1>
            </div>
            <VersusIndicator />
            <div className="p-4 bg-blue-600">
              <h1 className="text-3xl font-bold text-center">{teamB.name}</h1>
            </div>
          </div>
        </div>

        {/* メインスコア表示 */}
        <div className="flex-1 grid grid-cols-3 gap-0 pb-16" style={{ gridTemplateRows: '1fr 1.5fr' }}>
          {/* 上段：左側チーム */}
          <ScoreBoard
            team={teamA}
            position="left"
          />

          {/* 上段：サブタイマー */}
          <div className="bg-gray-800 text-white flex flex-col items-center justify-center py-1 px-4">
            <SubTimer seconds={gameState.subTimer?.remainingSeconds || 30} isRunning={gameState.subTimer?.isRunning || false} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={teamB}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-4 pb-4 pt-2">
            <MainTimer
              minutes={Math.floor(gameState.timer.remainingSeconds / 60)}
              seconds={gameState.timer.remainingSeconds % 60}
              isRunning={gameState.timer.isRunning}
            />
          </div>
        </div>

        {/* ステータスバー */}
        <StatusBar gameId={gameId} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} onTimeSyncClick={handleOpenTimeSyncModal} onControlPanelClick={handleOpenControlPanel} />
      </div>

      {/* モバイル表示用 (md未満) */}
      <div className="md:hidden h-screen flex flex-col bg-gray-900 touch-manipulation overflow-hidden fixed inset-0">
        {/* ヘッダー */}
        <div className="text-white">
          <div className="grid w-full" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
            <div className="p-2 bg-red-600">
              <h1 className="text-lg font-bold text-center">{teamA.name}</h1>
            </div>
            <VersusIndicator />
            <div className="p-2 bg-blue-600">
              <h1 className="text-lg font-bold text-center">{teamB.name}</h1>
            </div>
          </div>
        </div>

        {/* メインスコア表示 */}
        <div className="flex-1 grid grid-cols-3 gap-0 pb-16" style={{ gridTemplateRows: '0.7fr 0.6fr', maxHeight: '45vh' }}>
          {/* 上段：左側チーム */}
          <ScoreBoard
            team={teamA}
            position="left"
          />

          {/* 上段：サブタイマー */}
          <div className="bg-gray-800 text-white flex flex-col items-center justify-center py-0.5 px-1">
            <SubTimer seconds={gameState.subTimer?.remainingSeconds || 30} isRunning={gameState.subTimer?.isRunning || false} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={teamB}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-1 pt-8 pb-2">
            <MainTimer
              minutes={Math.floor(gameState.timer.remainingSeconds / 60)}
              seconds={gameState.timer.remainingSeconds % 60}
              isRunning={gameState.timer.isRunning}
            />
          </div>
        </div>

        {/* ステータスバー */}
        <StatusBar gameId={gameId} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} onTimeSyncClick={handleOpenTimeSyncModal} onControlPanelClick={handleOpenControlPanel} />
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
        scoreUpdate={scoreUpdate}
        resetTeamScore={resetTeamScore}
        resetAllScores={resetAllScores}
      />
    </>
  );
}