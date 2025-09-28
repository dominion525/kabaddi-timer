interface Props {
  onClick?: () => void;
  className?: string;
}

export function VersusIndicator({ onClick, className = '' }: Props) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const baseClassName = 'bg-gray-700 md:p-4 p-2 flex items-center justify-center';
  const interactiveClassName = onClick ? 'cursor-pointer hover:bg-gray-600 transition-colors duration-150' : '';
  const finalClassName = `${baseClassName} ${interactiveClassName} ${className}`.trim();

  return (
    <div className={finalClassName} onClick={handleClick}>
      <div className="md:text-3xl text-lg font-bold text-center text-white">vs</div>
    </div>
  );
}