import React from 'react';
import { mockTenGods } from '../../data/mockData';

interface GodsViewProps {
  onBack: () => void;
}

export const GodsView: React.FC<GodsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-6 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">十神詳解</h1>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
          >
            🏠 返回菜單
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockTenGods.map((god) => (
            <div key={god.id} className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
              <h3 className="text-3xl font-bold mb-2">{god.name_cn}</h3>
              <p className="text-lg text-gray-600 mb-4 font-semibold">{god.name_en}</p>
              <p className="text-gray-700 mb-6 text-base leading-relaxed">{god.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="font-bold text-green-700 text-lg mb-4">✓ 優點 (Strengths)</p>
                  <ul className="space-y-2 text-gray-700">
                    {god.positive_traits.map((trait, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-3 mt-1">•</span>
                        <span>{trait}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <p className="font-bold text-red-700 text-lg mb-4">✗ 缺點 (Weaknesses)</p>
                  <ul className="space-y-2 text-gray-700">
                    {god.negative_traits.map((trait, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-600 mr-3 mt-1">•</span>
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
