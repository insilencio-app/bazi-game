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
    <div className="bazi-home-shell min-h-screen">
      <header className="bazi-home-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">徽章圖鑑</h1>
              <p className="bazi-home-subtitle mt-1">已解鎖 {unlockedBadgeIds.length}</p>
            </div>
            <button
              onClick={onBack}
              className="bazi-home-cta bazi-home-cta-secondary max-w-max px-5 sm:px-6"
            >
              🏠 返回主頁
            </button>
          </div>
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
                className={`bazi-badge-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <p className={`bazi-badge-emoji ${unlocked ? '' : 'is-locked-emoji'}`}>{badge.emoji}</p>
                  <div className="min-w-0">
                    <p className={`bazi-badge-name ${unlocked ? 'is-unlocked-text' : 'is-locked-text'}`}>
                      {badge.name}
                    </p>
                    <p className={`bazi-badge-hint ${unlocked ? 'is-unlocked-text' : 'is-locked-text'}`}>
                      {badge.hintLong}
                    </p>
                    <p className={`bazi-badge-status ${unlocked ? 'is-unlocked-status' : 'is-locked-status'}`}>
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
