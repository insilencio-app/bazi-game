import React from 'react';
import { mockTenGods } from '../../data/mockData';

interface GodsViewProps {
  onBack: () => void;
}

export const GodsView: React.FC<GodsViewProps> = ({ onBack }) => {
  return (
    <div className="bazi-home-shell min-h-screen pb-12">
      <header className="bazi-home-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">十神詳解</h1>
            <button
              onClick={onBack}
              className="bazi-home-cta bazi-home-cta-secondary max-w-max px-5 sm:px-6"
            >
              🏠 返回菜單
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTenGods.map((god) => (
            <div key={god.id} className="bazi-god-card">
              <h3 className="bazi-god-name">{god.name_cn}</h3>
              <p className="bazi-god-english">{god.name_en}</p>
              <p className="bazi-god-description">{god.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bazi-god-list good">
                  <p className="bazi-god-list-title">✓ 優點 (Strengths)</p>
                  <ul className="bazi-god-list-items">
                    {god.positive_traits.map((trait, index) => (
                      <li key={index}>
                        <span>•</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bazi-god-list bad">
                  <p className="bazi-god-list-title">✗ 缺點 (Weaknesses)</p>
                  <ul className="bazi-god-list-items">
                    {god.negative_traits.map((trait, index) => (
                      <li key={index}>
                        <span>•</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
