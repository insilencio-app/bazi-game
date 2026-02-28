import React from 'react';

interface UseRewardNoticesParams<TBadgeId extends string> {
  currentLevel: number;
  unlockedBadgeIds: TBadgeId[];
}

export const useRewardNotices = <TBadgeId extends string>({
  currentLevel,
  unlockedBadgeIds,
}: UseRewardNoticesParams<TBadgeId>) => {
  const [levelUpNotice, setLevelUpNotice] = React.useState<number | null>(null);
  const [pendingBadgeNotices, setPendingBadgeNotices] = React.useState<TBadgeId[]>([]);
  const [activeBadgeNotice, setActiveBadgeNotice] = React.useState<TBadgeId | null>(null);

  const previousLevelRef = React.useRef(currentLevel);
  const previousUnlockedBadgeIdsRef = React.useRef<Set<TBadgeId>>(new Set(unlockedBadgeIds));

  React.useEffect(() => {
    if (currentLevel > previousLevelRef.current) {
      setLevelUpNotice(currentLevel);
    }
    previousLevelRef.current = currentLevel;
  }, [currentLevel]);

  React.useEffect(() => {
    if (levelUpNotice === null) return;

    const timer = window.setTimeout(() => {
      setLevelUpNotice(null);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [levelUpNotice]);

  React.useEffect(() => {
    const prevUnlocked = previousUnlockedBadgeIdsRef.current;
    const newlyUnlocked = unlockedBadgeIds.filter((badgeId) => !prevUnlocked.has(badgeId));

    if (newlyUnlocked.length > 0) {
      setPendingBadgeNotices((prev) => [...prev, ...newlyUnlocked]);
    }

    previousUnlockedBadgeIdsRef.current = new Set(unlockedBadgeIds);
  }, [unlockedBadgeIds]);

  React.useEffect(() => {
    if (levelUpNotice !== null || activeBadgeNotice || pendingBadgeNotices.length === 0) return;

    const [nextBadgeId, ...rest] = pendingBadgeNotices;
    setActiveBadgeNotice(nextBadgeId);
    setPendingBadgeNotices(rest);
  }, [pendingBadgeNotices, activeBadgeNotice, levelUpNotice]);

  React.useEffect(() => {
    if (!activeBadgeNotice) return;

    const timer = window.setTimeout(() => {
      setActiveBadgeNotice(null);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [activeBadgeNotice]);

  return {
    levelUpNotice,
    activeBadgeNotice,
    dismissLevelUpNotice: () => setLevelUpNotice(null),
    dismissActiveBadgeNotice: () => setActiveBadgeNotice(null),
  };
};
