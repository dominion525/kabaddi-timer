import { useState } from 'preact/hooks';
import { ScoreBoard } from './ScoreBoard';
import { MainTimer } from './Timer/MainTimer';
import { SubTimer } from './Timer/SubTimer';
import { StatusBar } from './StatusBar';
import { VersusIndicator } from './VersusIndicator';
import { CreditsModal } from './CreditsModal';
import { QRModal } from './QRModal';

interface Props {
  gameId: string;
}

export function App({ gameId }: Props) {
  // モーダルの状態管理
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

  // ダミーデータ
  const teamA = {
    name: 'チームA',
    score: 10,
    doOrDieCount: 2,
    color: 'red'
  };

  const teamB = {
    name: 'チームB',
    score: 8,
    doOrDieCount: 1,
    color: 'blue'
  };

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
            <SubTimer seconds={30} isRunning={false} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={teamB}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-4 pb-4 pt-2">
            <MainTimer minutes={60} seconds={0} isRunning={false} />
          </div>
        </div>

        {/* ステータスバー */}
        <StatusBar gameId={gameId} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} />
      </div>

      {/* モバイル表示用 (md未満) */}
      <div className="md:hidden min-h-screen flex flex-col bg-gray-900 touch-manipulation">
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
            <SubTimer seconds={30} isRunning={false} />
          </div>

          {/* 上段：右側チーム */}
          <ScoreBoard
            team={teamB}
            position="right"
          />

          {/* 下段：メインタイマー（3列全体を使用） */}
          <div className="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-1 pt-8 pb-2">
            <MainTimer minutes={60} seconds={0} isRunning={false} />
          </div>
        </div>

        {/* ステータスバー */}
        <StatusBar gameId={gameId} onCreditsClick={handleOpenCreditsModal} onQRClick={handleOpenQRModal} />
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
    </>
  );
}