/* Design reminder — 五行研習桌：徽章不是混雜 emoji 清單，而是羊皮紙檔案中的研習印記；以固定印章結構、章節色帶與完成度，呈現可收藏的學習歷程。 */
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

type BadgeGroupId = 'milestone' | 'practice' | 'mastery' | 'continuity' | 'appendix';

type BadgeGroup = {
  id: BadgeGroupId;
  serial: string;
  mark: string;
  title: string;
  subtitle: string;
  badgeIds: readonly string[];
};

const BADGE_GROUPS: readonly BadgeGroup[] = [
  {
    id: 'milestone',
    serial: '檔案一',
    mark: '柱',
    title: '課程里程碑',
    subtitle: '完成主線、專題與階段性掌握。',
    badgeIds: ['first-step', 'lesson-master', 'wood-starter', 'stems-master', 'branches-master', 'season-calc-pro', 'gods-expert', 'hidden-stems-master', 'relations-master', 'all-courses-80', 'master-scholar', 'perfect-combo', 'late-bloomer'],
  },
  {
    id: 'practice',
    serial: '檔案二',
    mark: '答',
    title: '答題與連勝',
    subtitle: '累積判讀次數，建立穩定的解題節奏。',
    badgeIds: ['quiz-starter', 'ten-correct', 'twenty-correct', 'fifty-correct', 'seventy-five-correct', 'hundred-correct', 'one-fifty-correct', 'two-hundred-correct', 'two-fifty-correct', 'three-hundred-correct', 'four-hundred-correct', 'five-hundred-correct', 'streak-5', 'streak-10', 'speed-star'],
  },
  {
    id: 'mastery',
    serial: '檔案三',
    mark: '測',
    title: '總測與精熟',
    subtitle: '將分課所學收束成整體判讀能力。',
    badgeIds: ['perfect-lesson', 'total-quiz-80', 'total-quiz-100', 'total-quiz-finisher', 'total-quiz-finisher-5', 'quiz-warrior'],
  },
  {
    id: 'continuity',
    serial: '檔案四',
    mark: '修',
    title: '回訪與成長',
    subtitle: '由持續研習、重溫與經驗累積留下的印記。',
    badgeIds: ['daily-3', 'daily-7', 'replay-3', 'rising-star', 'ancient-sage', 'knowledge-hoarder'],
  },
];

export const BadgesView: React.FC<BadgesViewProps> = ({
  unlockedBadgeIds,
  allBadgeIds,
  badgeDefinitions,
  onBack,
}) => {
  const knownBadgeIds = new Set(allBadgeIds);
  const groupedBadgeIds = new Set(BADGE_GROUPS.flatMap((group) => group.badgeIds));
  const groups: Array<Omit<BadgeGroup, 'badgeIds'> & { badgeIds: string[] }> = BADGE_GROUPS
    .map((group) => ({ ...group, badgeIds: group.badgeIds.filter((badgeId) => knownBadgeIds.has(badgeId)) }))
    .filter((group) => group.badgeIds.length > 0);
  const ungroupedBadgeIds = allBadgeIds.filter((badgeId) => !groupedBadgeIds.has(badgeId));

  if (ungroupedBadgeIds.length > 0) {
    groups.push({
      id: 'appendix',
      serial: '附錄',
      mark: '錄',
      title: '補充紀錄',
      subtitle: '尚未歸類的研習印記。',
      badgeIds: ungroupedBadgeIds,
    });
  }

  return (
    <div className="bazi-home-shell badge-compendium min-h-screen">
      <header className="bazi-home-header badge-compendium__header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="badge-compendium__header-row">
            <div className="badge-compendium__title-block">
              <p className="badge-compendium__eyebrow">BAZI LEARNING ATLAS・RESEARCH MARKS</p>
              <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">徽章圖鑑</h1>
              <p className="bazi-home-subtitle mt-1">把每一次完成、練習與回訪，收錄為你的研習印記。</p>
            </div>
            <button onClick={onBack} className="bazi-home-cta bazi-home-cta-secondary badge-compendium__back">
              返回研習桌
            </button>
          </div>
        </div>
      </header>

      <main className="badge-compendium__main max-w-6xl mx-auto p-4 sm:p-6">
        <section className="badge-compendium__summary" aria-label="研習印記總覽">
          <div>
            <p>研習檔案總覽</p>
            <h2>已收錄 <b>{unlockedBadgeIds.length}</b> / {allBadgeIds.length} 枚印記</h2>
            <span>每一枚印記都對應既有的課程、答題、總測或回訪條件。</span>
          </div>
          <div className="badge-compendium__summary-seal" aria-hidden="true"><span>印</span><small>{String(unlockedBadgeIds.length).padStart(2, '0')}</small></div>
        </section>

        <nav className="badge-compendium__index" aria-label="徽章分類索引">
          {groups.map((group) => {
            const unlockedCount = group.badgeIds.filter((badgeId) => unlockedBadgeIds.includes(badgeId)).length;
            return <a key={group.id} href={`#badge-group-${group.id}`} className={`badge-compendium__index-item badge-compendium__index-item--${group.id}`}><span>{group.mark}</span><b>{group.title}</b><small>{unlockedCount}/{group.badgeIds.length}</small></a>;
          })}
        </nav>

        <div className="badge-compendium__groups">
          {groups.map((group) => {
            const unlockedCount = group.badgeIds.filter((badgeId) => unlockedBadgeIds.includes(badgeId)).length;
            const groupPercent = group.badgeIds.length > 0 ? (unlockedCount / group.badgeIds.length) * 100 : 0;
            return (
              <section key={group.id} id={`badge-group-${group.id}`} className={`badge-compendium__group badge-compendium__group--${group.id}`}>
                <header className="badge-compendium__group-header">
                  <div className="badge-compendium__group-seal" aria-hidden="true"><span>{group.mark}</span><small>{group.serial}</small></div>
                  <div><p>{group.serial}</p><h2>{group.title}</h2><span>{group.subtitle}</span></div>
                  <div className="badge-compendium__group-progress"><b>{unlockedCount} <small>/ {group.badgeIds.length}</small></b><span>已收錄</span><div><i style={{ width: `${groupPercent}%` }} /></div></div>
                </header>
                <div className="badge-compendium__grid">
                  {group.badgeIds.map((badgeId, index) => {
                    const badge = badgeDefinitions[badgeId];
                    const unlocked = unlockedBadgeIds.includes(badgeId);
                    return (
                      <article key={badgeId} className={`badge-record ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
                        <div className="badge-record__seal" aria-hidden="true"><span>{group.mark}</span><small>{String(index + 1).padStart(2, '0')}</small></div>
                        <div className="badge-record__body">
                          <p className="badge-record__name">{badge.name}</p>
                          <p className="badge-record__hint">{badge.hintLong}</p>
                          <span className="badge-record__status">{unlocked ? '已收錄' : `收錄條件：${badge.hintShort}`}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};
