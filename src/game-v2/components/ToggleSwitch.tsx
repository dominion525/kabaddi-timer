interface Props {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  labelPosition?: 'left' | 'right';
}

export function ToggleSwitch({ enabled, onToggle, label, labelPosition = 'right' }: Props) {
  return (
    <div className="flex items-center space-x-1">
      {labelPosition === 'left' && (
        <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
          {label}
        </span>
      )}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-3' : 'translate-x-0.5'
          }`}
        ></span>
      </button>
      {labelPosition === 'right' && (
        <span className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
          {label}
        </span>
      )}
    </div>
  );
}