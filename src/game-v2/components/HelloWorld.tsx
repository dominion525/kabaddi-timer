import { useState } from 'preact/hooks';

interface Props {
  gameId: string;
}

export function HelloWorld({ gameId }: Props) {
  const [color, setColor] = useState('text-blue-500');

  const toggleColor = () => {
    setColor(prev =>
      prev === 'text-blue-500' ? 'text-red-500' : 'text-blue-500'
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1
          className={`text-4xl font-bold cursor-pointer ${color} transition-colors duration-300`}
          onClick={toggleColor}
        >
          Hello World from Game V2!
        </h1>
        <p className="mt-4 text-gray-600">
          Game ID: {gameId}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          クリックして色を変更
        </p>
        <div className="mt-6 space-y-2">
          <p className="text-xs text-gray-400">
            Powered by Preact + Vite
          </p>
          <p className="text-xs text-gray-400">
            Current color: {color === 'text-blue-500' ? 'Blue' : 'Red'}
          </p>
        </div>
      </div>
    </div>
  );
}