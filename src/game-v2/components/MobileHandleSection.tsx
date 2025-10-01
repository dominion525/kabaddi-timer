interface Props {
  simpleMode: boolean;
  scrollLockEnabled: boolean;
  onClose: () => void;
  onToggleSimpleMode: () => void;
  onToggleScrollLock: () => void;
}

export function MobileHandleSection({
  simpleMode,
  scrollLockEnabled,
  onClose,
  onToggleSimpleMode,
  onToggleScrollLock,
}: Props) {
  return (
    <div data-testid="mobile-handle-section" className="bg-gray-200 p-3 relative">
      {/* 左側トグル */}
      {simpleMode && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <button
            data-testid="scroll-lock-toggle"
            onClick={onToggleScrollLock}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
              scrollLockEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                scrollLockEnabled ? 'translate-x-3' : 'translate-x-0.5'
              }`}
            ></span>
          </button>
          <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
            スクロールロック
          </span>
        </div>
      )}

      {/* 中央ハンドル（完全中央固定） */}
      <div data-testid="close-handle" className="flex justify-center items-center" onClick={onClose}>
        <div className="w-12 h-1 bg-gray-400 rounded-full cursor-pointer"></div>
      </div>

      {/* 右側トグル */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
        <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
          シンプル
        </span>
        <button
          data-testid="simple-mode-toggle"
          onClick={onToggleSimpleMode}
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
            simpleMode ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
              simpleMode ? 'translate-x-3' : 'translate-x-0.5'
            }`}
          ></span>
        </button>
      </div>
    </div>
  );
}
