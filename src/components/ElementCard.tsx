import React from 'react';

interface ElementProps {
  name: string;
  element: string;
  color: string;
  emoji: string;
}

const COLOR_CLASS_MAP: Record<'green' | 'red' | 'yellow' | 'gray' | 'blue', string> = {
  green: 'bazi-element-card green',
  red: 'bazi-element-card red',
  yellow: 'bazi-element-card yellow',
  gray: 'bazi-element-card gray',
  blue: 'bazi-element-card blue',
};

const getColorClassName = (color: string): string => {
  if (color in COLOR_CLASS_MAP) {
    return COLOR_CLASS_MAP[color as keyof typeof COLOR_CLASS_MAP];
  }

  return COLOR_CLASS_MAP.gray;
};

export const ElementCard: React.FC<ElementProps> = ({ name, element, color, emoji }) => {
  return (
    <div className={getColorClassName(color)}>
      <div className="bazi-element-emoji">{emoji}</div>
      <h3 className="bazi-element-name">{element}</h3>
      <p className="bazi-element-caption">{name}</p>
    </div>
  );
};
