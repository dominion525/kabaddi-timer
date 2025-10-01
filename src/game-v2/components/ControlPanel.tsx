import { useEffect, useState } from 'preact/hooks';
import { JSX } from 'preact';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: any;
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
}

export function ControlPanel({
  isOpen,
  onClose,
  gameState,
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
  courtChange
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [scrollLockEnabled, setScrollLockEnabled] = useState(false);

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
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
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
          className={`hidden md:block fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 transition-transform duration-200 ease-in-out ${
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
                <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">チーム名設定</h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    data-team="teamA"
                    value={teamAName}
                    onInput={(e) => {
                      const value = e.currentTarget.value;
                      setTeamAName(value);
                      setTeamName('teamA', value);
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    maxLength={20}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    data-team="teamB"
                    value={teamBName}
                    onInput={(e) => {
                      const value = e.currentTarget.value;
                      setTeamBName(value);
                      setTeamName('teamB', value);
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* タイマー操作 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">タイマー操作</h3>

              {/* 時間設定 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">時間設定</label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={timerInputMinutes}
                    onInput={(e) => setTimerInputMinutes(Number(e.currentTarget.value))}
                    className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="flex items-center text-sm">分</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={String(timerInputSeconds).padStart(2, '0')}
                    onInput={(e) => setTimerInputSeconds(Number(e.currentTarget.value))}
                    className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="flex items-center text-sm">秒</span>
                  <button onClick={() => timerSet(timerInputMinutes, timerInputSeconds)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors text-sm">
                    設定
                  </button>
                </div>
                {/* プリセット */}
                <div className="flex space-x-1">
                  <button onClick={() => timerSet(20, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    20分
                  </button>
                  <button onClick={() => timerSet(15, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    15分
                  </button>
                  <button onClick={() => timerSet(3, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    3分
                  </button>
                </div>
              </div>

              {/* スタート/ストップ/リセット */}
              <div className="mb-4 flex space-x-2">
                <button onClick={timerStart} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button onClick={timerPause} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button onClick={timerReset} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>

              {/* 時間調整ボタン */}
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <button onClick={() => timerAdjust(60)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1分
                  </button>
                  <button onClick={() => timerAdjust(10)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +10秒
                  </button>
                  <button onClick={() => timerAdjust(1)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1秒
                  </button>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => timerAdjust(-60)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1分
                  </button>
                  <button onClick={() => timerAdjust(-10)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -10秒
                  </button>
                  <button onClick={() => timerAdjust(-1)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1秒
                  </button>
                </div>
              </div>
            </div>

            {/* サブタイマー操作 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">サブタイマー操作 (30秒レイドタイマー)</h3>

              {/* スタート/ストップ/リセット */}
              <div className="flex space-x-2">
                <button onClick={subTimerStart} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button onClick={subTimerPause} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button onClick={subTimerReset} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>
            </div>

            {/* チーム操作グリッド */}
            <div className="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 relative">
              {/* 中央セパレーター */}
              <div className="absolute inset-y-4 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>

              {/* ヘッダー行 */}
              <div className="mb-4 relative z-10">
                {/* チーム名行 */}
                <div className="flex justify-between gap-x-8 mb-2">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-red-600">チームA</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-blue-600">チームB</div>
                  </div>
                </div>
                {/* カテゴリー行 */}
                <div className="flex justify-between gap-x-8">
                  <div className="flex-1 grid grid-cols-2 gap-x-2">
                    <div className="text-center">
                      <div className="text-xs text-red-600">得点</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-orange-600">Do or Die</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-2">
                    <div className="text-center">
                      <div className="text-xs text-orange-600">Do or Die</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-blue-600">得点</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ボタングリッド */}
              <div className="flex justify-between gap-x-8 relative z-10">
                {/* 左側表示チーム */}
                <div className="flex-1 space-y-3">
                  {/* +1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => scoreUpdate('teamA', 1)}
                      className="aspect-square bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button
                      onClick={() => doOrDieUpdate('teamA', 1)}
                      className="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  {/* -1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => scoreUpdate('teamA', -1)}
                      className="aspect-square bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button
                      onClick={() => doOrDieUpdate('teamA', -1)}
                      className="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  {/* リセットボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => resetTeamScore('teamA')}
                      className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br />リセット
                    </button>
                    <button
                      onClick={() => doOrDieUpdate('teamA', -3)}
                      className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                  </div>
                </div>

                {/* 右側表示チーム */}
                <div className="flex-1 space-y-3">
                  {/* +1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => doOrDieUpdate('teamB', 1)}
                      className="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button
                      onClick={() => scoreUpdate('teamB', 1)}
                      className="aspect-square bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  {/* -1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => doOrDieUpdate('teamB', -1)}
                      className="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button
                      onClick={() => scoreUpdate('teamB', -1)}
                      className="aspect-square bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  {/* リセットボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button
                      onClick={() => doOrDieUpdate('teamB', -3)}
                      className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                    <button
                      onClick={() => resetTeamScore('teamB')}
                      className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br />リセット
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 全体コントロール */}
            <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
              <h3 className="font-bold text-lg mb-4">全体コントロール</h3>
              <div className="flex space-x-4 justify-center">
                <button onClick={courtChange} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-bold text-lg transition-colors">
                  コートチェンジ
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold text-lg transition-colors">
                  全リセット
                </button>
              </div>
            </div>

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
          className={`md:hidden fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 transition-transform duration-200 ease-in-out ${
            isAnimating ? 'transform translate-y-0' : 'transform translate-y-full'
          }`}
          style={{ height: '50vh' }}
        >
        {/* パネル内容 */}
        <div className="relative z-50 h-full flex flex-col">
          {/* ハンドル */}
          <div className="bg-gray-200 p-3 relative">
            {/* 左側トグル */}
            {simpleMode && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <button
                  onClick={toggleScrollLock}
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
            <div className="flex justify-center items-center" onClick={onClose}>
              <div className="w-12 h-1 bg-gray-400 rounded-full cursor-pointer"></div>
            </div>

            {/* 右側トグル */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
                シンプル
              </span>
              <button
                onClick={toggleSimpleMode}
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

          {/* コンテンツエリア - 通常モード */}
          {!simpleMode && (
            <div className="flex-1 p-3 overflow-y-auto space-y-3" style={{ backgroundColor: '#7F7F7F' }}>
              {/* チーム名設定 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-bold text-base mb-3">チーム名設定</h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      data-team="teamA"
                      value={teamAName}
                      onInput={(e) => {
                        const value = e.currentTarget.value;
                        setTeamAName(value);
                        setTeamName('teamA', value);
                      }}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      style={{ fontSize: '16px' }}
                      placeholder="チームA"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      data-team="teamB"
                      value={teamBName}
                      onInput={(e) => {
                        const value = e.currentTarget.value;
                        setTeamBName(value);
                        setTeamName('teamB', value);
                      }}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontSize: '16px' }}
                      placeholder="チームB"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              {/* タイマー操作 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-bold text-base mb-3">タイマー操作</h3>

                {/* 時間設定 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">時間設定</label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={timerInputMinutes}
                      onInput={(e) => setTimerInputMinutes(Number(e.currentTarget.value))}
                      className="w-18 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                      style={{ fontSize: '16px' }}
                      placeholder="60"
                    />
                    <span className="flex items-center">分</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={String(timerInputSeconds).padStart(2, '0')}
                      onInput={(e) => setTimerInputSeconds(Number(e.currentTarget.value))}
                      className="w-18 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                      style={{ fontSize: '16px' }}
                      placeholder="00"
                    />
                    <span className="flex items-center">秒</span>
                    <button onClick={() => timerSet(timerInputMinutes, timerInputSeconds)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors">
                      設定
                    </button>
                  </div>
                  {/* プリセット */}
                  <div className="flex space-x-2">
                    <button onClick={() => timerSet(20, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                      20分
                    </button>
                    <button onClick={() => timerSet(15, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                      15分
                    </button>
                    <button onClick={() => timerSet(3, 0)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                      3分
                    </button>
                  </div>
                </div>

                {/* スタート/ストップ/リセット */}
                <div className="mb-4 flex space-x-2">
                  <button onClick={timerStart} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    スタート
                  </button>
                  <button onClick={timerPause} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    ストップ
                  </button>
                  <button onClick={timerReset} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    リセット
                  </button>
                </div>

                {/* 時間調整ボタン */}
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <button onClick={() => timerAdjust(60)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                      +1分
                    </button>
                    <button onClick={() => timerAdjust(10)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                      +10秒
                    </button>
                    <button onClick={() => timerAdjust(1)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                      +1秒
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => timerAdjust(-60)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                      -1分
                    </button>
                    <button onClick={() => timerAdjust(-10)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                      -10秒
                    </button>
                    <button onClick={() => timerAdjust(-1)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                      -1秒
                    </button>
                  </div>
                </div>
              </div>

              {/* サブタイマー操作 */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-bold text-lg mb-4 text-yellow-800">サブタイマー操作 (30秒レイドタイマー)</h3>

                {/* スタート/ストップ/リセット */}
                <div className="flex space-x-2">
                  <button onClick={subTimerStart} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    スタート
                  </button>
                  <button onClick={subTimerPause} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    ストップ
                  </button>
                  <button onClick={subTimerReset} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                    リセット
                  </button>
                </div>
              </div>

              {/* チーム操作グリッド */}
              <div className="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 relative">
                {/* 中央セパレーター */}
                <div className="absolute inset-y-4 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>

                {/* ヘッダー行 */}
                <div className="mb-4 relative z-10">
                  {/* チーム名行 */}
                  <div className="flex justify-between gap-x-6 mb-2">
                    <div className="text-center flex-1">
                      <div className="text-base font-bold text-red-700">チームA</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-base font-bold text-blue-700">チームB</div>
                    </div>
                  </div>
                  {/* カテゴリー行 */}
                  <div className="flex justify-between gap-x-6">
                    <div className="flex-1 grid grid-cols-2 gap-x-1">
                      <div className="text-center">
                        <div className="text-xs text-red-600">得点</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-orange-600">Do or Die</div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-1">
                      <div className="text-center">
                        <div className="text-xs text-orange-600">Do or Die</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-600">得点</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ボタングリッド */}
                <div className="flex justify-between gap-x-6 relative z-10">
                  {/* 左側表示チーム */}
                  <div className="flex-1 space-y-2">
                    {/* +1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => scoreUpdate('teamA', 1)}
                        className="h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                        +1
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', 1)}
                        className="h-12 bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                        +1
                      </button>
                    </div>
                    {/* -1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => scoreUpdate('teamA', -1)}
                        className="h-12 bg-red-300 hover:bg-red-400 text-red-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                        -1
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', -1)}
                        className="h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                        -1
                      </button>
                    </div>
                    {/* リセットボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => resetTeamScore('teamA')}
                        className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                        スコア<br />リセット
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', -3)}
                        className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                        リセット
                      </button>
                    </div>
                  </div>

                  {/* 右側表示チーム */}
                  <div className="flex-1 space-y-2">
                    {/* +1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', 1)}
                        className="h-12 bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                        +1
                      </button>
                      <button
                        onClick={() => scoreUpdate('teamB', 1)}
                        className="h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                        +1
                      </button>
                    </div>
                    {/* -1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', -1)}
                        className="h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                        -1
                      </button>
                      <button
                        onClick={() => scoreUpdate('teamB', -1)}
                        className="h-12 bg-blue-300 hover:bg-blue-400 text-blue-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                        -1
                      </button>
                    </div>
                    {/* リセットボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', -3)}
                        className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                        リセット
                      </button>
                      <button
                        onClick={() => resetTeamScore('teamB')}
                        className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                        スコア<br />リセット
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 全体コントロール */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-bold text-base mb-3">全体コントロール</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={courtChange} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-lg font-bold text-base transition-colors">
                    コートチェンジ
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg font-bold text-base transition-colors">
                    全リセット
                  </button>
                </div>
              </div>

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
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="flex gap-1">
                  {/* メインタイマー */}
                  <div className="flex gap-1 flex-1">
                    <button onClick={timerStart} className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      開始
                    </button>
                    <button onClick={timerPause} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      停止
                    </button>
                    <button onClick={timerReset} className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1 whitespace-nowrap">
                      リセット
                    </button>
                  </div>

                  {/* セパレーター */}
                  <div className="w-px bg-gray-300 mx-1"></div>

                  {/* サブタイマー */}
                  <div className="flex gap-1 flex-1">
                    <button onClick={subTimerStart} className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      30秒<br />開始
                    </button>
                    <button onClick={subTimerPause} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      30秒<br />停止
                    </button>
                    <button onClick={subTimerReset} className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      30秒<br />リセット
                    </button>
                  </div>
                </div>
              </div>

              {/* チーム操作グリッド */}
              <div className="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-2 rounded-lg border border-gray-200 relative">
                {/* 中央セパレーター */}
                <div className="absolute inset-y-2 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>

                {/* ヘッダー行 */}
                <div className="mb-2 relative z-10">
                  {/* カテゴリー行 */}
                  <div className="flex justify-between gap-x-3">
                    <div className="flex-1 grid grid-cols-2 gap-x-1">
                      <div className="text-center">
                        <div className="text-xs text-red-600">得点</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-orange-600">Do or Die</div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-1">
                      <div className="text-center">
                        <div className="text-xs text-orange-600">Do or Die</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-600">得点</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ボタングリッド */}
                <div className="flex justify-between gap-x-3 relative z-10">
                  {/* 左側 */}
                  <div className="flex-1 space-y-1">
                    {/* +1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => scoreUpdate('teamA', 1)}
                        className="h-8 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        +1
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', 1)}
                        className="h-8 bg-orange-400 hover:bg-orange-500 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        +1
                      </button>
                    </div>
                    {/* -1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => scoreUpdate('teamA', -1)}
                        className="h-8 bg-red-300 hover:bg-red-400 text-red-800 rounded text-xs font-bold transition-colors active:scale-95">
                        -1
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', -1)}
                        className="h-8 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded text-xs font-bold transition-colors active:scale-95">
                        -1
                      </button>
                    </div>
                    {/* リセットボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => resetTeamScore('teamA')}
                        className="h-8 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        スコア<br />リセット
                      </button>
                      <button
                        onClick={() => doOrDieUpdate('teamA', -3)}
                        className="h-8 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        リセット
                      </button>
                    </div>
                  </div>

                  {/* 右側表示チーム */}
                  <div className="flex-1 space-y-1">
                    {/* +1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', 1)}
                        className="h-8 bg-orange-400 hover:bg-orange-500 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        +1
                      </button>
                      <button
                        onClick={() => scoreUpdate('teamB', 1)}
                        className="h-8 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        +1
                      </button>
                    </div>
                    {/* -1ボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', -1)}
                        className="h-8 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded text-xs font-bold transition-colors active:scale-95">
                        -1
                      </button>
                      <button
                        onClick={() => scoreUpdate('teamB', -1)}
                        className="h-8 bg-blue-300 hover:bg-blue-400 text-blue-800 rounded text-xs font-bold transition-colors active:scale-95">
                        -1
                      </button>
                    </div>
                    {/* リセットボタン行 */}
                    <div className="grid grid-cols-2 gap-x-1">
                      <button
                        onClick={() => doOrDieUpdate('teamB', -3)}
                        className="h-8 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        リセット
                      </button>
                      <button
                        onClick={() => resetTeamScore('teamB')}
                        className="h-8 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors active:scale-95">
                        スコア<br />リセット
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* タイマープリセット */}
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                <div className="flex gap-1">
                  {/* 左側プリセット */}
                  <div className="flex gap-1 flex-1">
                    <button onClick={() => timerSet(20, 0)} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      20分
                    </button>
                    <button onClick={() => timerSet(15, 0)} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      15分
                    </button>
                    <button onClick={() => timerSet(3, 0)} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      3分
                    </button>
                  </div>

                  {/* セパレーター */}
                  <div className="w-px bg-blue-300 mx-1"></div>

                  {/* 右側操作ボタン */}
                  <div className="flex gap-1 flex-1">
                    <button onClick={() => timerAdjust(1)} className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      +1秒
                    </button>
                    <button onClick={() => timerAdjust(-1)} className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      -1秒
                    </button>
                    <button className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1">
                      コート<br />チェンジ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      )}
    </>
  );
}