/* Design reminder — 五行研習桌：徽章牆以金屬外圈、五行琺瑯、統一線條圖示和羊皮紙抽屜呈現；解鎖是彩色收藏品，未解鎖是同圖形的壓印輪廓。 */
/* 五行研習桌設計提醒：琺瑯徽章是全站一致的收藏印記；圖鑑與即時解鎖彈窗共用圖形、分類與金屬琺瑯材質，不退回 emoji 樣式。 */
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

export type BadgeGroupId = 'milestone' | 'practice' | 'mastery' | 'continuity' | 'appendix';
export type BadgeIcon = 'footstep' | 'book' | 'pillar' | 'leaf' | 'spark' | 'target' | 'crown' | 'medal' | 'flame' | 'bolt' | 'calendar' | 'loop' | 'mountain' | 'chest' | 'star';

type BadgeGroup = {
  id: BadgeGroupId;
  serial: string;
  title: string;
  subtitle: string;
  badgeIds: readonly string[];
};

export const BADGE_GROUPS: readonly BadgeGroup[] = [
  {
    id: 'milestone',
    serial: '檔案一',
    title: '課程里程碑',
    subtitle: '完成主線、專題與階段性掌握。',
    badgeIds: ['first-step', 'lesson-master', 'wood-starter', 'stems-master', 'branches-master', 'season-calc-pro', 'gods-expert', 'hidden-stems-master', 'relations-master', 'all-courses-80', 'master-scholar', 'perfect-combo', 'late-bloomer'],
  },
  {
    id: 'practice',
    serial: '檔案二',
    title: '答題與連勝',
    subtitle: '累積判讀次數，建立穩定的解題節奏。',
    badgeIds: ['quiz-starter', 'ten-correct', 'twenty-correct', 'fifty-correct', 'seventy-five-correct', 'hundred-correct', 'one-fifty-correct', 'two-hundred-correct', 'two-fifty-correct', 'three-hundred-correct', 'four-hundred-correct', 'five-hundred-correct', 'streak-5', 'streak-10', 'speed-star'],
  },
  {
    id: 'mastery',
    serial: '檔案三',
    title: '總測與精熟',
    subtitle: '將分課所學收束成整體判讀能力。',
    badgeIds: ['perfect-lesson', 'total-quiz-80', 'total-quiz-100', 'total-quiz-finisher', 'total-quiz-finisher-5', 'quiz-warrior'],
  },
  {
    id: 'continuity',
    serial: '檔案四',
    title: '回訪與成長',
    subtitle: '由持續研習、重溫與經驗累積留下的印記。',
    badgeIds: ['daily-3', 'daily-7', 'replay-3', 'rising-star', 'ancient-sage', 'knowledge-hoarder'],
  },
];

export const BADGE_ICON_MAP: Record<string, BadgeIcon> = {
  'first-step': 'footstep', 'lesson-master': 'book', 'wood-starter': 'leaf', 'stems-master': 'pillar', 'branches-master': 'pillar', 'season-calc-pro': 'spark', 'gods-expert': 'book', 'hidden-stems-master': 'spark', 'relations-master': 'target', 'all-courses-80': 'medal', 'master-scholar': 'crown', 'perfect-combo': 'star', 'late-bloomer': 'mountain',
  'quiz-starter': 'target', 'ten-correct': 'target', 'twenty-correct': 'target', 'fifty-correct': 'medal', 'seventy-five-correct': 'medal', 'hundred-correct': 'crown', 'one-fifty-correct': 'star', 'two-hundred-correct': 'star', 'two-fifty-correct': 'mountain', 'three-hundred-correct': 'flame', 'four-hundred-correct': 'crown', 'five-hundred-correct': 'crown', 'streak-5': 'flame', 'streak-10': 'bolt', 'speed-star': 'bolt',
  'perfect-lesson': 'star', 'total-quiz-80': 'medal', 'total-quiz-100': 'crown', 'total-quiz-finisher': 'target', 'total-quiz-finisher-5': 'loop', 'quiz-warrior': 'bolt',
  'daily-3': 'calendar', 'daily-7': 'calendar', 'replay-3': 'loop', 'rising-star': 'star', 'ancient-sage': 'mountain', 'knowledge-hoarder': 'chest',
};

const iconPaths: Record<BadgeIcon, React.ReactNode> = {
  footstep: <><path d="M10 28c0-6 4-11 9-11s8 5 7 11c-1 5-5 9-10 9-4 0-6-4-6-9Z"/><path d="M30 40c0-6 4-11 9-11s8 5 7 11c-1 5-5 9-10 9-4 0-6-4-6-9Z"/></>,
  book: <><path d="M8 15c10-5 18-3 24 5v29c-7-7-15-9-24-4Z"/><path d="M56 15c-10-5-18-3-24 5v29c7-7 15-9 24-4Z"/><path d="M32 20v29M15 27h10M15 36h10M39 27h10M39 36h10"/></>,
  pillar: <><path d="M12 52h48M17 47h38M21 16h30M18 21h36M24 21v26M40 21v26M30 21v26M46 21v26"/><path d="M27 11h18"/></>,
  leaf: <><path d="M15 48C16 24 30 12 55 11c-2 24-14 39-39 40Z"/><path d="M18 49c12-13 22-22 34-31"/></>,
  spark: <><path d="m34 8 5 18 17 6-17 6-5 18-6-18-17-6 17-6Z"/><path d="m15 13 2 7 7 2-7 3-2 7-3-7-7-3 7-2ZM53 45l2 7 7 2-7 3-2 7-3-7-7-3 7-2Z"/></>,
  target: <><circle cx="34" cy="34" r="22"/><circle cx="34" cy="34" r="12"/><circle cx="34" cy="34" r="3"/><path d="m48 20 13-13M51 8h10v10"/></>,
  crown: <><path d="m11 47 4-26 13 12 6-20 7 20 13-12 4 26Z"/><path d="M14 54h40"/></>,
  medal: <><path d="m21 9 8 16h10l8-16 7 5-9 18H23l-9-18Z"/><circle cx="34" cy="44" r="17"/><path d="m28 44 4 4 8-9"/></>,
  flame: <><path d="M36 8c4 13-6 16-2 25 3-4 8-7 9-14 11 12 10 34-8 39-17-4-22-24-11-37 0 9 4 12 8 14-2-11 3-18 4-27Z"/></>,
  bolt: <path d="M38 7 15 37h16l-4 20 24-32H35Z"/>,
  calendar: <><rect x="12" y="16" width="44" height="39" rx="3"/><path d="M12 28h44M23 10v12M45 10v12M22 37h7M38 37h7M22 46h7M38 46h7"/></>,
  loop: <><path d="M53 26a21 21 0 0 0-36-7l-5 5"/><path d="M12 14v10h10M15 42a21 21 0 0 0 36 7l5-5"/><path d="M56 54V44H46"/></>,
  mountain: <><path d="m8 54 18-29 10 15 8-11 16 25Z"/><path d="m26 25 5 8 5-5M44 29l5 7 4-4"/></>,
  chest: <><path d="M12 26h44v28H12Z"/><path d="M9 21h50v10H9ZM34 26v28M29 37h10"/><path d="M17 15h34v6H17Z"/></>,
  star: <path d="m34 8 7 18 19 1-15 12 5 19-16-10-16 10 5-19L8 27l19-1Z"/>,
};

const BadgeIconGlyph: React.FC<{ icon: BadgeIcon }> = ({ icon }) => (
  <svg viewBox="0 0 68 68" aria-hidden="true" className="enamel-badge__glyph" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    {iconPaths[icon]}
  </svg>
);

export const EnamelBadge: React.FC<{ icon: BadgeIcon; unlocked: boolean; groupId: BadgeGroupId; number: number }> = ({ icon, unlocked, groupId, number }) => (
  <div className={`enamel-badge enamel-badge--${groupId} ${unlocked ? 'is-unlocked' : 'is-locked'}`} aria-hidden="true">
    <div className="enamel-badge__rim"><span /><span /><span /><span /><span /></div>
    <div className="enamel-badge__face"><BadgeIconGlyph icon={icon} /></div>
    {!unlocked && <div className="enamel-badge__lock"><i /></div>}
    <small>{String(number).padStart(2, '0')}</small>
  </div>
);

export const BadgesView: React.FC<BadgesViewProps> = ({ unlockedBadgeIds, allBadgeIds, badgeDefinitions, onBack }) => {
  const knownBadgeIds = new Set(allBadgeIds);
  const groupedBadgeIds = new Set(BADGE_GROUPS.flatMap((group) => group.badgeIds));
  const groups: Array<Omit<BadgeGroup, 'badgeIds'> & { badgeIds: string[] }> = BADGE_GROUPS
    .map((group) => ({ ...group, badgeIds: group.badgeIds.filter((badgeId) => knownBadgeIds.has(badgeId)) }))
    .filter((group) => group.badgeIds.length > 0);
  const ungroupedBadgeIds = allBadgeIds.filter((badgeId) => !groupedBadgeIds.has(badgeId));

  if (ungroupedBadgeIds.length > 0) {
    groups.push({ id: 'appendix', serial: '附錄', title: '補充紀錄', subtitle: '尚未歸類的研習印記。', badgeIds: ungroupedBadgeIds });
  }

  return (
    <div className="bazi-home-shell badge-vault min-h-screen">
      <header className="bazi-home-header badge-vault__header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="badge-vault__header-row">
            <div>
              <p className="badge-vault__eyebrow">BAZI LEARNING ATLAS · ENAMEL BADGE STUDY</p>
              <h1 className="bazi-home-title text-3xl sm:text-4xl lg:text-5xl">徽章圖鑑</h1>
              <p className="bazi-home-subtitle mt-1">完成、練習與回訪，都值得收錄成一枚實體般的研習徽章。</p>
            </div>
            <button onClick={onBack} className="bazi-home-cta bazi-home-cta-secondary badge-vault__back">返回研習桌</button>
          </div>
        </div>
      </header>

      <main className="badge-vault__main max-w-6xl mx-auto p-4 sm:p-6">
        <section className="badge-vault__hero" aria-label="徽章收錄總覽">
          <div>
            <p>徽章收藏櫃</p>
            <h2>已收錄 <b>{unlockedBadgeIds.length}</b> / {allBadgeIds.length} 枚研習徽章</h2>
            <span>解鎖後會呈現五行琺瑯與金屬邊圈；未解鎖亦保留同一枚徽章的壓印輪廓。</span>
          </div>
          <EnamelBadge icon="book" unlocked={unlockedBadgeIds.length > 0} groupId="mastery" number={unlockedBadgeIds.length} />
        </section>

        <nav className="badge-vault__index" aria-label="徽章分類索引">
          {groups.map((group) => {
            const unlockedCount = group.badgeIds.filter((badgeId) => unlockedBadgeIds.includes(badgeId)).length;
            return <a key={group.id} href={`#badge-group-${group.id}`} className={`badge-vault__index-link badge-vault__index-link--${group.id}`}><EnamelBadge icon={group.id === 'milestone' ? 'pillar' : group.id === 'practice' ? 'target' : group.id === 'mastery' ? 'medal' : 'loop'} unlocked={unlockedCount > 0} groupId={group.id} number={unlockedCount} /><span><b>{group.title}</b><small>{unlockedCount}/{group.badgeIds.length} 已收錄</small></span></a>;
          })}
        </nav>

        <div className="badge-vault__groups">
          {groups.map((group) => {
            const unlockedCount = group.badgeIds.filter((badgeId) => unlockedBadgeIds.includes(badgeId)).length;
            const groupPercent = group.badgeIds.length > 0 ? (unlockedCount / group.badgeIds.length) * 100 : 0;
            return (
              <section key={group.id} id={`badge-group-${group.id}`} className={`badge-vault__group badge-vault__group--${group.id}`}>
                <header className="badge-vault__group-header">
                  <EnamelBadge icon={group.id === 'milestone' ? 'pillar' : group.id === 'practice' ? 'target' : group.id === 'mastery' ? 'medal' : 'loop'} unlocked={unlockedCount > 0} groupId={group.id} number={unlockedCount} />
                  <div><p>{group.serial}</p><h2>{group.title}</h2><span>{group.subtitle}</span></div>
                  <div className="badge-vault__group-progress"><b>{unlockedCount}<small> / {group.badgeIds.length}</small></b><span>已收錄</span><div><i style={{ width: `${groupPercent}%` }} /></div></div>
                </header>
                <div className="badge-vault__grid">
                  {group.badgeIds.map((badgeId, index) => {
                    const badge = badgeDefinitions[badgeId];
                    const unlocked = unlockedBadgeIds.includes(badgeId);
                    const icon = BADGE_ICON_MAP[badgeId] ?? 'star';
                    return (
                      <article key={badgeId} className={`badge-medallion-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
                        <EnamelBadge icon={icon} unlocked={unlocked} groupId={group.id} number={index + 1} />
                        <div className="badge-medallion-card__body"><h3>{badge.name}</h3><p>{badge.hintLong}</p><span>{unlocked ? '已收錄' : `收錄條件：${badge.hintShort}`}</span></div>
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
