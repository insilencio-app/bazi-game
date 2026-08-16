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
    <div className="bazi-home-shell min-h-screen">
      <header className="bazi-home-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">五行基礎</h1>
              <p className="bazi-home-subtitle mt-1">Five Elements: Wood, Fire, Earth, Metal, Water</p>
            </div>
            <button
              onClick={onBack}
              className="bazi-home-cta bazi-home-cta-secondary max-w-max px-5 sm:px-6"
            >
              🏠 返回菜單
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bazi-home-panel p-5 sm:p-6 mb-8">
          <h2 className="bazi-home-section-title mb-4">五行循環圖</h2>
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
          <div className="bazi-home-panel p-4 sm:p-6">
            <h2 className="bazi-home-section-title mb-4">
              {selectedElement.symbol} {selectedElement.name_cn} ({selectedElement.name_en})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bazi-lite-stat-box">
                <p className="bazi-lite-stat-label">方向</p>
                <p className="bazi-lite-stat-value">{selectedElement.direction}</p>
              </div>
              <div className="bazi-lite-stat-box">
                <p className="bazi-lite-stat-label">季節</p>
                <p className="bazi-lite-stat-value">{selectedElement.season}</p>
              </div>
              <div className="bazi-lite-stat-box">
                <p className="bazi-lite-stat-label">情感</p>
                <p className="bazi-lite-stat-value">{selectedElement.emotion}</p>
              </div>
              <div className="bazi-lite-stat-box">
                <p className="bazi-lite-stat-label">顏色</p>
                <p className="bazi-lite-stat-value">{selectedElement.color}</p>
              </div>
            </div>
            <p className="bazi-home-section-copy">{selectedElement.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
