interface Props {
  onClick?: () => void;
  className?: string;
  displayFlipped?: boolean;
}

export function VersusIndicator({ onClick, className = '', displayFlipped = false }: Props) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const baseClassName = 'bg-gray-700 md:p-4 p-2 flex items-center justify-center relative';
  const interactiveClassName = onClick ? 'cursor-pointer hover:bg-gray-600 transition-colors duration-150' : '';
  const finalClassName = `${baseClassName} ${interactiveClassName} ${className}`.trim();

  return (
    <div className={finalClassName} onClick={handleClick}>
      <div className="md:text-3xl text-lg font-bold text-center text-white">vs</div>
      {/* 反転インジケーター */}
      {displayFlipped && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <svg className="w-6 h-3 text-gray-400" viewBox="0 0 24 12">
            <path d="M3 6L1 8L3 10 M21 6L23 8L21 10 M1 8H23" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
        </div>
      )}
    </div>
  );
}