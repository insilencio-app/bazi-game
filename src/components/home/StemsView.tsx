import React from 'react';
import { mockEarthlyBranches, mockHeavenlySteams } from '../../data/mockData';

interface StemsViewProps {
  onBack: () => void;
}

export const StemsView: React.FC<StemsViewProps> = ({ onBack }) => {
  return (
    <div className="bazi-home-shell min-h-screen pb-12">
      <header className="bazi-home-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">天干地支</h1>
            <button
              onClick={onBack}
              className="bazi-home-cta bazi-home-cta-secondary max-w-max px-5 sm:px-6"
            >
              🏠 返回菜單
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="bazi-home-panel p-4 sm:p-8 mb-8">
          <h2 className="bazi-home-section-title mb-4 sm:mb-6">十天干 (Heavenly Stems)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {mockHeavenlySteams.map((stem) => (
              <div
                key={stem.id}
                className="bazi-reference-card blue"
              >
                <p className="bazi-reference-name">{stem.name_cn}</p>
                <p className="bazi-reference-label">{stem.name_en}</p>
                <p className="bazi-reference-tag">{stem.element}</p>
                <p className="bazi-reference-label">{stem.yin_yang === 'yang' ? '陽' : '陰'}</p>
                <p className="bazi-reference-copy">特質: {stem.personality_traits.join('、')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bazi-home-panel p-4 sm:p-8">
          <h2 className="bazi-home-section-title mb-4 sm:mb-6">十二地支 (Earthly Branches)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {mockEarthlyBranches.map((branch) => (
              <div
                key={branch.id}
                className="bazi-reference-card green"
              >
                <p className="bazi-reference-name">{branch.name_cn}</p>
                <p className="bazi-reference-label">{branch.zodiac_animal}</p>
                <p className="bazi-reference-tag">{branch.element}</p>
                <p className="bazi-reference-label">{branch.yin_yang === 'yang' ? '陽' : '陰'}</p>
                <p className="bazi-reference-copy">時辰: {branch.hour_range}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
