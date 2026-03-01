import React from 'react';

type BadgeDefinition = {
  name: string;
  emoji: string;
  hintShort: string;
  hintLong: string;
};

interface BadgesViewProps {
  unlockedBadgeIds: string[];
  allBadgeIds: string[];
  badgeDefinitions: Record<string, BadgeDefinition>;
  onBack: () => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({
  unlockedBadgeIds,
  allBadgeIds,
  badgeDefinitions,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">徽章圖鑑</h1>
            <p className="text-sm sm:text-base opacity-95 mt-1">已解鎖 {unlockedBadgeIds.length}</p>
          </div>
          <button
            onClick={onBack}
            className="bg-red-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-red-600 font-bold text-sm sm:text-base lg:text-lg transition-all hover:scale-105 whitespace-nowrap"
          >
            🏠 返回菜單
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {allBadgeIds.map((badgeId) => {
            const badge = badgeDefinitions[badgeId];
            const unlocked = unlockedBadgeIds.includes(badgeId);

            return (
              <div
                key={badgeId}
                className={`rounded-xl border p-3 sm:p-4 transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow'
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <p className={`text-3xl sm:text-4xl shrink-0 ${unlocked ? '' : 'grayscale opacity-40'}`}>{badge.emoji}</p>
                  <div className="min-w-0">
                    <p className={`text-sm sm:text-base font-semibold ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                      {badge.name}
                    </p>
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {badge.hintLong}
                    </p>
                    <p className={`text-xs mt-2 ${unlocked ? 'text-amber-700 font-medium' : 'text-gray-400'}`}>
                      {unlocked ? '已解鎖' : `條件：${badge.hintShort}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
