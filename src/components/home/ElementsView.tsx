import React from 'react';
import { mockElements } from '../../data/mockData';
import { ElementCard } from '../ElementCard';
import { ElementWheel } from '../ElementWheel';
import type { ElementItem } from '../../types/domain';

interface ElementsViewProps {
  selectedElement: ElementItem | null;
  onElementClick: (element: string) => void;
  onBack: () => void;
}

export const ElementsView: React.FC<ElementsViewProps> = ({ selectedElement, onElementClick, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">五行基礎</h1>
            <p className="text-xs sm:text-sm lg:text-base opacity-90 mt-1 sm:mt-2">Five Elements: Wood, Fire, Earth, Metal, Water</p>
          </div>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
          >
            🏠 返回菜單
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">五行循環圖</h2>
          <ElementWheel onElementClick={onElementClick} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
          {mockElements.map((el) => (
            <ElementCard
              key={el.id}
              name={el.name_en}
              element={el.name_cn}
              color={el.color}
              emoji={el.symbol}
            />
          ))}
        </div>

        {selectedElement && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
              {selectedElement.symbol} {selectedElement.name_cn} ({selectedElement.name_en})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">方向</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.direction}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">季節</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.season}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">情感</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.emotion}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">顏色</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{selectedElement.color}</p>
              </div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">{selectedElement.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
