import React from 'react';

interface ElementProps {
  name: string;
  element: string;
  color: string;
  emoji: string;
}

const COLOR_CLASS_MAP: Record<'green' | 'red' | 'yellow' | 'gray' | 'blue', string> = {
  green: 'bg-green-50 border-green-300',
  red: 'bg-red-50 border-red-300',
  yellow: 'bg-yellow-50 border-yellow-300',
  gray: 'bg-gray-50 border-gray-300',
  blue: 'bg-blue-50 border-blue-300',
};

const getColorClassName = (color: string): string => {
  if (color in COLOR_CLASS_MAP) {
    return COLOR_CLASS_MAP[color as keyof typeof COLOR_CLASS_MAP];
  }

  return COLOR_CLASS_MAP.gray;
};

export const ElementCard: React.FC<ElementProps> = ({ name, element, color, emoji }) => {
  return (
    <div className={`p-6 rounded-lg shadow-lg border-2 text-center cursor-pointer hover:shadow-xl transition-shadow ${getColorClassName(color)}`}>
      <div className="text-6xl mb-2">{emoji}</div>
      <h3 className="text-4xl font-bold mb-2">{element}</h3>
      <p className="text-lg text-gray-700">{name}</p>
    </div>
  );
};
