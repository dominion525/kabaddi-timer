interface Props {
  connectionStatus: 'connecting' | 'reconnecting' | 'error' | 'connected';
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  errorMessage?: string;
  onRetry?: () => void;
}

export function LoadingModal({
  connectionStatus,
  reconnectAttempts = 0,
  maxReconnectAttempts = 10,
  errorMessage,
  onRetry
}: Props) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          message: '接続中...',
          description: 'サーバーに接続しています',
          showSpinner: true,
          showRetry: false
        };
      case 'reconnecting':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-400',
          message: '再接続中...',
          description: `サーバーに再接続中（${reconnectAttempts}/${maxReconnectAttempts}）`,
          showSpinner: true,
          showRetry: false
        };
      case 'error':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400',
          message: '接続エラー',
          description: errorMessage || 'サーバーへの接続に失敗しました',
          showSpinner: false,
          showRetry: true
        };
      default:
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-400',
          message: '読み込み中...',
          description: 'ゲームデータを読み込んでいます',
          showSpinner: true,
          showRetry: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* ステータスアイコン */}
        <div className="flex justify-center mb-6">
          {config.showSpinner ? (
            <div className="relative">
              <div className={`w-16 h-16 ${config.bgColor} rounded-full animate-pulse`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin`}></div>
              </div>
            </div>
          ) : (
            <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center`}>
              <span className="text-white text-2xl">⚠️</span>
            </div>
          )}
        </div>

        {/* メッセージ */}
        <h2 className={`text-2xl font-bold ${config.color} mb-2`}>
          {config.message}
        </h2>

        <p className="text-gray-300 mb-6">
          {config.description}
        </p>

        {/* 再接続の進捗表示 */}
        {connectionStatus === 'reconnecting' && (
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(reconnectAttempts / maxReconnectAttempts) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              再接続試行中... ({reconnectAttempts}/{maxReconnectAttempts})
            </p>
          </div>
        )}

        {/* リトライボタン */}
        {config.showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            再試行
          </button>
        )}

        {/* カバディロゴ（オプション） */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>カバディタイマー</p>
        </div>
      </div>
    </div>
  );
}