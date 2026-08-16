// Lesson 1 callers may append archival navigation classes without changing the default quiz appearance elsewhere.
import React from 'react';

interface QuizActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'muted';
  size?: 'compact' | 'default';
  stretch?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const QuizActionButton: React.FC<QuizActionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'default',
  stretch = true,
  fullWidth = false,
  className,
}) => {
  const widthClassName = [stretch ? 'flex-1' : '', fullWidth ? 'w-full' : ''].filter(Boolean).join(' ');
  const sizeClassName =
    size === 'compact'
      ? 'py-2 px-4 text-sm sm:text-base'
      : 'py-3 sm:py-4 text-sm sm:text-lg lg:text-xl';

  const variantClassName =
    variant === 'secondary'
      ? 'bazi-lesson-nav-button bazi-lesson-nav-button--secondary'
      : variant === 'danger'
      ? 'bazi-lesson-nav-button bazi-lesson-nav-button--danger'
      : variant === 'muted'
      ? 'bazi-lesson-nav-button bazi-lesson-nav-button--muted'
      : variant === 'accent'
      ? 'bazi-lesson-nav-button bazi-lesson-nav-button--accent'
      : 'bazi-lesson-nav-button bazi-lesson-nav-button--primary';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClassName} ${widthClassName} ${variantClassName} ${className ?? ''}`.trim()}
    >
      {label}
    </button>
  );
};
