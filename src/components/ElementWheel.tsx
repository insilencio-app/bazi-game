import React from 'react';

interface ElementWheelProps {
  onElementClick?: (element: string) => void;
}

export const ElementWheel: React.FC<ElementWheelProps> = ({ onElementClick }) => {
  const elements = [
    { name: '木', color: 'green', emoji: '🌳', en: 'Wood' },
    { name: '火', color: 'red', emoji: '🔥', en: 'Fire' },
    { name: '土', color: 'yellow', emoji: '🪨', en: 'Earth' },
    { name: '金', color: 'gray', emoji: '✨', en: 'Metal' },
    { name: '水', color: 'blue', emoji: '💧', en: 'Water' },
  ];

  const colorMap: { [key: string]: string } = {
    green: '#8bbd8f',
    red: '#d98b7c',
    yellow: '#d2b564',
    gray: '#b7bcc3',
    blue: '#7da8cf',
  };

  return (
    <div className="flex justify-center items-center py-6">
      <div className="relative w-80 h-80 sm:w-96 sm:h-96">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="30" fill="#102E4C" opacity="0.16" />
          {elements.map((el, idx) => {
            const angle = (idx * 72 - 90) * (Math.PI / 180);
            const radius = 140;
            const x = 200 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);

            return (
              <g key={idx}>
                <line x1="200" y1="200" x2={x} y2={y} stroke="#d9c4a1" strokeWidth="2" />
                <circle
                  cx={x}
                  cy={y}
                  r="44"
                  fill={colorMap[el.color]}
                  className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                  onClick={() => onElementClick?.(el.name)}
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dy="0.3em"
                  className="pointer-events-none text-2xl font-bold fill-white"
                >
                  {el.emoji}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center flex-wrap gap-2 sm:gap-4 text-sm mt-4">
          {elements.map((el) => (
            <div key={el.name} className="text-center px-1 py-1">
              <span className="text-2xl sm:text-3xl">{el.emoji}</span>
              <p className="font-bold text-sm sm:text-lg text-[#102E4C]">{el.name}</p>
              <p className="text-[#5d6975] text-xs sm:text-sm">{el.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
