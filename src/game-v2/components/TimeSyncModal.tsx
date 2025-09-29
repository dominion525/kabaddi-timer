import { useEffect, useState, useRef } from 'preact/hooks';
import { JSX } from 'preact';

type TimeSyncStatus = 'good' | 'warning' | 'error' | 'unknown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timeSyncStatus: TimeSyncStatus;
  serverTimeOffset: number;
  lastRTT: number;
  lastSyncTime: Date | null;
  lastSyncClientTime: Date | null;
  lastSyncServerTime: Date | null;
  onRequestTimeSync: () => void;
}

export function TimeSyncModal({
  isOpen,
  onClose,
  timeSyncStatus,
  serverTimeOffset,
  lastRTT,
  lastSyncTime,
  lastSyncClientTime,
  lastSyncServerTime,
  onRequestTimeSync,
}: Props) {
  const [currentClientTime, setCurrentClientTime] = useState('');
  const [currentServerTime, setCurrentServerTime] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const handleBackgroundClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleRequestTimeSync = () => {
    if (isSyncing) return;

    setIsSyncing(true);
    onRequestTimeSync();

    // 2秒後に自動的に再有効化（レスポンスが来ない場合の保険）
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = window.setTimeout(() => {
      setIsSyncing(false);
      syncTimeoutRef.current = null;
    }, 2000);
  };

  const updateSyncTimeDisplay = () => {
    // 同期時の実際の時刻を表示
    if (lastSyncClientTime && lastSyncServerTime) {
      setCurrentClientTime(formatTime(lastSyncClientTime));
      setCurrentServerTime(formatTime(lastSyncServerTime));
    } else {
      // 同期データがない場合は空文字
      setCurrentClientTime('');
      setCurrentServerTime('');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const millis = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  };

  // モーダルが開いた時と同期データが更新された時に時刻を取得
  useEffect(() => {
    if (isOpen) {
      updateSyncTimeDisplay();
    }

    document.addEventListener('keydown', handleKeyDown);

    // Lucideアイコンの初期化
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // クリーンアップ時にタイムアウトをクリア
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [isOpen, lastSyncClientTime, lastSyncServerTime]);

  // 同期データが更新されたら同期中状態を解除
  useEffect(() => {
    if (lastSyncTime && isSyncing) {
      setIsSyncing(false);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    }
  }, [lastSyncTime]);

  const getTimeSyncStatusDisplay = () => {
    const statusConfig = {
      good: {
        emoji: '✅',
        title: '同期良好',
        description: 'タイマーは正確に動作しています',
        bgColor: 'bg-green-50 border-green-200',
        titleColor: 'text-green-800',
        descColor: 'text-green-600'
      },
      warning: {
        emoji: '⚠️',
        title: '同期注意',
        description: 'ネットワーク遅延が検出されています',
        bgColor: 'bg-yellow-50 border-yellow-200',
        titleColor: 'text-yellow-800',
        descColor: 'text-yellow-600'
      },
      error: {
        emoji: '❌',
        title: '同期問題',
        description: '大きな時刻ずれが発生しています',
        bgColor: 'bg-red-50 border-red-200',
        titleColor: 'text-red-800',
        descColor: 'text-red-600'
      },
      unknown: {
        emoji: '🔄',
        title: '同期確認中...',
        description: 'サーバーとの同期を確認中です',
        bgColor: 'bg-blue-50 border-blue-200',
        titleColor: 'text-blue-800',
        descColor: 'text-blue-600'
      }
    };

    return statusConfig[timeSyncStatus];
  };

  const statusDisplay = getTimeSyncStatusDisplay();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i data-lucide="clock" className="w-5 h-5"></i>
            <span>時刻同期状態</span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* 状態インジケーター */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${statusDisplay.bgColor}`}>
            <div className="text-2xl">
              <span>{statusDisplay.emoji}</span>
            </div>
            <div>
              <div className={`font-medium ${statusDisplay.titleColor}`}>
                {statusDisplay.title}
              </div>
              <div className={`text-sm ${statusDisplay.descColor}`}>
                {statusDisplay.description}
              </div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600 text-xs">時刻差:</span>
              <span className="font-mono font-medium text-xs">{serverTimeOffset}ms</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600 text-xs">RTT:</span>
              <span className="font-mono font-medium text-xs">{lastRTT}ms</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600 text-xs">クライアント:</span>
              <span className="font-mono font-medium text-xs">{currentClientTime}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600 text-xs">サーバー:</span>
              <span className="font-mono font-medium text-xs">{currentServerTime}</span>
            </div>
          </div>
          {/* 最終同期時刻 */}
          <div className="flex justify-center items-center p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-600 mr-2">最終同期:</span>
            <span className="font-mono font-medium text-xs">{lastSyncTime ? formatTime(lastSyncTime) : '未同期'}</span>
          </div>

          {/* 警告メッセージ */}
          {timeSyncStatus === 'warning' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">ネットワーク遅延が検出されています</p>
                  <p>タイマーに若干のずれが生じる可能性があります。重要な試合では手動同期をお試しください。</p>
                </div>
              </div>
            </div>
          )}

          {timeSyncStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">❌</span>
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">大きな時刻ずれが発生しています</p>
                  <p>タイマーの精度に問題が生じています。手動同期を実行するか、ネットワーク環境をご確認ください。</p>
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="pt-2">
            <button
              onClick={handleRequestTimeSync}
              disabled={isSyncing}
              className={`w-full px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                isSyncing
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <i data-lucide="refresh-cw" className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}></i>
              <span>{isSyncing ? '同期中...' : '今すぐ同期'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}