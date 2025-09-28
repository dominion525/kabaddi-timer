interface Props {
  gameId: string;
  connectionStatus?: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  timeSyncStatus?: 'good' | 'warning' | 'error' | 'unknown';
  sendingData?: boolean;
  receivingData?: boolean;
  onQRClick?: () => void;
  onHomeClick?: () => void;
  onCreditsClick?: () => void;
  onControlPanelClick?: () => void;
  controlPanelButtonText?: string;
}

export function StatusBar({
  gameId,
  connectionStatus = 'connected',
  timeSyncStatus = 'good',
  sendingData = false,
  receivingData = false,
  onQRClick,
  onHomeClick,
  onCreditsClick,
  onControlPanelClick,
  controlPanelButtonText = 'コントロール'
}: Props) {

  const getConnectionDisplay = () => {
    const dotClass = [
      sendingData ? 'text-yellow-300' : '',
      receivingData ? 'text-orange-400' : ''
    ].filter(Boolean).join(' ') || 'transition-colors duration-150';

    if (connectionStatus === 'connected') {
      if (timeSyncStatus === 'good') {
        return (
          <span className="text-green-400">
            <span className={dotClass}>●</span> 接続中
          </span>
        );
      } else if (timeSyncStatus === 'warning') {
        return (
          <span className="text-yellow-400">
            <span className={dotClass}>●</span> 接続中 (同期注意)
          </span>
        );
      } else if (timeSyncStatus === 'error') {
        return (
          <span className="text-orange-400">
            <span className={dotClass}>●</span> 接続中 (同期問題)
          </span>
        );
      } else if (timeSyncStatus === 'unknown') {
        return (
          <span className="text-blue-400">
            <span className={dotClass}>●</span> 接続中 (同期中...)
          </span>
        );
      }
    } else if (connectionStatus === 'connecting') {
      return (
        <span className="text-yellow-400">
          <span className={dotClass}>●</span> 接続中...
        </span>
      );
    } else if (connectionStatus === 'reconnecting') {
      return (
        <span className="text-orange-400 animate-pulse">
          <span className={dotClass}>●</span> 再接続中...
        </span>
      );
    } else if (connectionStatus === 'disconnected') {
      return (
        <span className="text-red-400">
          <span className={dotClass}>●</span> 切断
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-800 text-white md:p-2 p-3 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center md:space-x-4 space-x-3">
        <div className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-all duration-300">
          {getConnectionDisplay()}
        </div>
        <div className="flex items-center md:space-x-2 space-x-1.5 text-gray-300 md:text-base text-xs">
          <button
            onClick={onQRClick}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <i data-lucide="qr-code" className="md:w-4 md:h-4 w-3 h-3"></i>
            <span className="font-semibold">QR</span>
          </button>
          <span className="text-gray-500">|</span>
          <button onClick={onHomeClick} className="hover:text-white transition-colors cursor-pointer flex items-center">
            <i data-lucide="home" className="md:w-4 md:h-4 w-3 h-3"></i>
          </button>
          <span className="text-gray-500">|</span>
          <button onClick={onCreditsClick} className="hover:text-white transition-colors cursor-pointer flex items-center">
            <i data-lucide="hammer" className="md:w-4 md:h-4 w-3 h-3"></i>
          </button>
        </div>
      </div>
      <button
        onClick={onControlPanelClick}
        className="bg-blue-600 hover:bg-blue-700 md:px-4 px-6 py-2 md:rounded rounded-lg transition-colors"
      >
        ▲ {controlPanelButtonText}
      </button>
    </div>
  );
}