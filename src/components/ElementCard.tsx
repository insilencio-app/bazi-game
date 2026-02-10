import React from 'react';

interface ElementProps {
  name: string;
  element: string;
  color: string;
  emoji: string;
}

export const ElementCard: React.FC<ElementProps> = ({ name, element, color, emoji }) => {
  return (
    <div className={`p-6 rounded-lg shadow-lg bg-${color}-50 border-2 border-${color}-300 text-center cursor-pointer hover:shadow-xl transition-shadow`}>
      <div className="text-6xl mb-2">{emoji}</div>
      <h3 className="text-4xl font-bold mb-2">{element}</h3>
      <p className="text-lg text-gray-700">{name}</p>
    </div>
  );
};
