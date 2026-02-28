import React from 'react';

interface QuizActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'muted';
  size?: 'compact' | 'default';
  stretch?: boolean;
  fullWidth?: boolean;
}

export const QuizActionButton: React.FC<QuizActionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'default',
  stretch = true,
  fullWidth = false,
}) => {
  const widthClassName = [stretch ? 'flex-1' : '', fullWidth ? 'w-full' : ''].filter(Boolean).join(' ');
  const sizeClassName =
    size === 'compact'
      ? 'py-2 px-4 text-sm sm:text-base'
      : 'py-3 sm:py-4 text-sm sm:text-lg lg:text-xl';
  const baseClassName = `font-bold rounded-lg transition-colors ${sizeClassName} ${widthClassName}`;

  const variantClassName =
    variant === 'secondary'
      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
      : variant === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : variant === 'muted'
      ? 'bg-gray-600 text-white hover:bg-gray-700'
      : variant === 'accent'
      ? 'bg-amber-500 text-white hover:bg-amber-600'
      : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClassName} ${variantClassName}`}>
      {label}
    </button>
  );
};
