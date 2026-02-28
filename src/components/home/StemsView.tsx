import React from 'react';
import { mockEarthlyBranches, mockHeavenlySteams } from '../../data/mockData';

interface StemsViewProps {
  onBack: () => void;
}

export const StemsView: React.FC<StemsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 sm:p-6 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">天干地支</h1>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
          >
            🏠 返回菜單
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">十天干 (Heavenly Stems)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {mockHeavenlySteams.map((stem) => (
              <div
                key={stem.id}
                className="p-2 sm:p-4 bg-blue-100 rounded text-center cursor-pointer hover:bg-blue-200 transition-colors"
              >
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stem.name_cn}</p>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">{stem.name_en}</p>
                <p className="text-xs sm:text-sm font-semibold text-blue-700 mt-1">{stem.element}</p>
                <p className="text-xs text-gray-700 mt-1">{stem.yin_yang === 'yang' ? '陽' : '陰'}</p>
                <p className="text-xs text-gray-600 mt-1">特質: {stem.personality_traits.join('、')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">十二地支 (Earthly Branches)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {mockEarthlyBranches.map((branch) => (
              <div
                key={branch.id}
                className="p-2 sm:p-4 bg-green-100 rounded text-center cursor-pointer hover:bg-green-200 transition-colors"
              >
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{branch.name_cn}</p>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">{branch.zodiac_animal}</p>
                <p className="text-xs sm:text-sm font-semibold text-green-700 mt-1">{branch.element}</p>
                <p className="text-xs text-gray-700 mt-1">{branch.yin_yang === 'yang' ? '陽' : '陰'}</p>
                <p className="text-xs text-gray-600 mt-1">時辰: {branch.hour_range}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
