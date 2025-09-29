interface Props {
  // 将来的にチーム名の値や変更ハンドラーを props として受け取る予定
}

export function TeamNameSettings({}: Props) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <h3 className="font-bold text-base mb-3">チーム名設定</h3>
      <div className="space-y-3">
        <div>
          <input
            type="text"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            style={{ fontSize: '16px' }}
            placeholder="チームA"
          />
        </div>
        <div>
          <input
            type="text"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ fontSize: '16px' }}
            placeholder="チームB"
          />
        </div>
      </div>
    </div>
  );
}