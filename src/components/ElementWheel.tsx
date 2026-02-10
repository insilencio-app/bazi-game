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
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    yellow: 'from-yellow-400 to-yellow-600',
    gray: 'from-gray-400 to-gray-600',
    blue: 'from-blue-400 to-blue-600',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative w-96 h-96">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          {/* Center circle */}
          <circle cx="200" cy="200" r="30" fill="#888" opacity="0.3" />
          
          {/* Element positions in circle */}
          {elements.map((el, idx) => {
            const angle = (idx * 72 - 90) * (Math.PI / 180);
            const radius = 140;
            const x = 200 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);

            return (
              <g key={idx}>
                {/* Connection line to center */}
                <line x1="200" y1="200" x2={x} y2={y} stroke="#ccc" strokeWidth="2" />
                
                {/* Element circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="45"
                  fill={colorMap[el.color]}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onElementClick?.(el.name)}
                />

                {/* Element text */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-2xl font-bold fill-white pointer-events-none"
                >
                  {el.emoji}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-sm mt-4">
          {elements.map((el) => (
            <div key={el.name} className="text-center">
              <span className="text-3xl">{el.emoji}</span>
              <p className="font-bold text-lg">{el.name}</p>
              <p className="text-gray-600 text-base">{el.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
