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
    <div className="bg-gray-800 text-white p-2 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-all duration-300">
          {getConnectionDisplay()}
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <button
            onClick={onQRClick}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <i data-lucide="qr-code" className="w-4 h-4"></i>
            <span className="font-semibold">QR</span>
          </button>
          <span className="text-gray-500">|</span>
          <button onClick={onHomeClick} className="hover:text-white transition-colors cursor-pointer flex items-center">
            <i data-lucide="home" className="w-4 h-4"></i>
          </button>
          <span className="text-gray-500">|</span>
          <button onClick={onCreditsClick} className="hover:text-white transition-colors cursor-pointer flex items-center">
            <i data-lucide="hammer" className="w-4 h-4"></i>
          </button>
        </div>
      </div>
      <button
        onClick={onControlPanelClick}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
      >
        ▲ {controlPanelButtonText}
      </button>
    </div>
  );
}