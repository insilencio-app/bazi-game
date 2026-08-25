/* 五行研習桌設計提醒：第 2 課每頁以一個結構圖、一張焦點卡與一個不計分任務，取代十天干的縱向資料堆疊。 */
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

export type LessonTwoAtlasStage = 'positioning' | 'families' | 'polarity' | 'combines' | 'reading';

type ElementName = '木' | '火' | '土' | '金' | '水';
type StemPair = {
  element: ElementName;
  yang: string;
  yin: string;
  yangImage: string;
  yinImage: string;
  cue: string;
  direction: string;
  season: string;
};

const STEM_PAIRS: StemPair[] = [
  { element: '木', yang: '甲', yin: '乙', yangImage: '大樹', yinImage: '花草', cue: '生長、舒展', direction: '東', season: '春' },
  { element: '火', yang: '丙', yin: '丁', yangImage: '太陽', yinImage: '燭火', cue: '外放、溫暖', direction: '南', season: '夏' },
  { element: '土', yang: '戊', yin: '己', yangImage: '高山', yinImage: '田園', cue: '承載、調和', direction: '中', season: '四季' },
  { element: '金', yang: '庚', yin: '辛', yangImage: '鋼鐵', yinImage: '珠寶', cue: '收斂、整理', direction: '西', season: '秋' },
  { element: '水', yang: '壬', yin: '癸', yangImage: '江河', yinImage: '雨露', cue: '流動、滋養', direction: '北', season: '冬' },
];

const WU_HE = [
  { id: 'jia-ji', left: '甲', right: '己', cue: '穩定與承載的牽引' },
  { id: 'yi-geng', left: '乙', right: '庚', cue: '柔和與剛斷的平衡' },
  { id: 'bing-xin', left: '丙', right: '辛', cue: '熱情與收斂的相遇' },
  { id: 'ding-ren', left: '丁', right: '壬', cue: '內斂與流動的相遇' },
  { id: 'wu-gui', left: '戊', right: '癸', cue: '承載與滋養的牽引' },
] as const;

const READING_STARTS = [
  { id: 'day-master', label: '日主', caption: '自己', question: '自己是甚麼元素？', note: '判讀先從日柱天干開始。' },
  { id: 'season', label: '月令', caption: '環境', question: '當下哪一季的氣最強？', note: '月令提供最重要的季節環境。' },
  { id: 'root', label: '根氣', caption: '立足點', question: '有沒有支持與立足？', note: '根氣幫助理解力量是否有依靠。' },
  { id: 'visible', label: '透干', caption: '表面力量', question: '哪種力量浮到表面？', note: '透干讓力量更容易被觀察。' },
] as const;

function AtlasHeading({ number, eyebrow, title, children, inverse = false }: { number: string; eyebrow: string; title: string; children?: ReactNode; inverse?: boolean }) {
  return <div className={`atlas-study-heading ${inverse ? 'atlas-study-heading--inverse' : ''}`}><div className="atlas-study-kicker"><span>{number}</span>{eyebrow}</div><h2>{title}</h2>{children}</div>;
}

function ElementFocus({ pair }: { pair: StemPair }) {
  return <article className={`lesson-two-focus lesson-two-tone--${pair.element}`}><p>目前聚焦</p><h3>{pair.element}</h3><strong>{pair.cue}</strong><div><span>方向 <b>{pair.direction}</b></span><span>季節 <b>{pair.season}</b></span></div></article>;
}

export function LessonTwoAtlas({ stage }: { stage: LessonTwoAtlasStage }) {
  const [selectedElement, setSelectedElement] = useState<ElementName>('木');
  const [selectedPair, setSelectedPair] = useState('木');
  const [selectedCombine, setSelectedCombine] = useState('jia-ji');
  const [selectedReading, setSelectedReading] = useState('day-master');
  const [feedback, setFeedback] = useState<string | null>(null);
  const selected = useMemo(() => STEM_PAIRS.find((pair) => pair.element === selectedElement) ?? STEM_PAIRS[0], [selectedElement]);
  const activeCombine = WU_HE.find((pair) => pair.id === selectedCombine) ?? WU_HE[0];
  const activeReading = READING_STARTS.find((item) => item.id === selectedReading) ?? READING_STARTS[0];

  const selectElement = (element: ElementName, target?: ElementName) => {
    setSelectedElement(element);
    if (!target) return;
    setFeedback(element === target ? `✓ 對，${element}對應${STEM_PAIRS.find((pair) => pair.element === element)?.season}。` : `提示：${element}對應${STEM_PAIRS.find((pair) => pair.element === element)?.season}；再找找「${STEM_PAIRS.find((pair) => pair.element === target)?.season}」。`);
  };

  if (stage === 'positioning') {
    return <section className="lesson-two-atlas lesson-two-atlas--light">
      <AtlasHeading number="01" eyebrow="十天干定位" title="先辨五行家族，再辨陰陽一對。"><p>十天干不必先背順序；先看它們如何分成五個五行家族，每一行各有一陽一陰。</p></AtlasHeading>
      <div className="lesson-two-pair-map">
        {STEM_PAIRS.map((pair) => <button key={pair.element} type="button" onClick={() => selectElement(pair.element, '木')} className={`lesson-two-pair-row lesson-two-tone--${pair.element} ${selected.element === pair.element ? 'is-active' : ''}`} aria-pressed={selected.element === pair.element}><span className="lesson-two-pair-row__element">{pair.element}</span><span><b>{pair.yang}</b><em>陽・{pair.yangImage}</em></span><span><b>{pair.yin}</b><em>陰・{pair.yinImage}</em></span></button>)}
      </div>
      <div className="lesson-two-positioning-foot"><ElementFocus pair={selected} /><div className="lesson-two-task"><p>不計分小任務</p><b>找出代表「向上生長」的天干。</b><span>點選木組，先找甲。</span>{feedback && <em className={feedback.startsWith('✓') ? 'is-correct' : ''}>{feedback}</em>}</div></div>
    </section>;
  }

  if (stage === 'families') {
    return <section className="lesson-two-atlas lesson-two-atlas--light">
      <AtlasHeading number="02" eyebrow="五行雙干環" title="五行各有一陽一陰。"><p>點選圓環的一瓣，中央只比較同一五行的兩個天干。</p></AtlasHeading>
      <div className="lesson-two-dual-ring-layout">
        <div className="lesson-two-dual-ring" role="tablist" aria-label="五行雙干環">{STEM_PAIRS.map((pair, index) => <button key={pair.element} type="button" role="tab" onClick={() => setSelectedElement(pair.element)} aria-selected={selected.element === pair.element} className={`lesson-two-dual-ring__node lesson-two-tone--${pair.element} ${selected.element === pair.element ? 'is-active' : ''}`} style={{ '--ring-angle': `${index * 72 - 90}deg` } as CSSProperties}><span>{pair.element}</span><b>{pair.yang}・{pair.yin}</b></button>)}<ElementFocus pair={selected} /></div>
        <div className="lesson-two-task lesson-two-task--ring"><p>不計分小任務</p><b>哪一組對應「秋」？</b><span>點選圓環上的金；焦點卡會同時顯示庚與辛。</span><button type="button" onClick={() => selectElement('金', '金')}>我選金</button>{feedback && <em className={feedback.startsWith('✓') ? 'is-correct' : ''}>{feedback}</em>}<details><summary>展開更多線索</summary><p>首屏只記「五行＋一陽一陰」；自然意象與延伸性格只在需要時閱讀。</p></details></div>
      </div>
    </section>;
  }

  if (stage === 'polarity') {
    const current = STEM_PAIRS.find((pair) => pair.element === selectedPair) ?? STEM_PAIRS[0];
    return <section className="lesson-two-atlas lesson-two-atlas--tracks">
      <AtlasHeading number="03" eyebrow="陰陽雙軌" inverse title="陰陽是發力方向，不是好壞評分。"><p>上軌看陽干的外顯與主動；下軌看陰干的內藏與細緻。選一組看看它們如何同屬五行、方向不同。</p></AtlasHeading>
      <div className="lesson-two-tracks"><div className="lesson-two-track lesson-two-track--yang"><div className="lesson-two-track__label"><b>陽干</b><span>外顯・主動</span></div>{STEM_PAIRS.map((pair) => <button key={pair.yang} type="button" onClick={() => setSelectedPair(pair.element)} className={selectedPair === pair.element ? 'is-active' : ''}><b>{pair.yang}</b><span>{pair.element}</span></button>)}</div><div className="lesson-two-track lesson-two-track--yin"><div className="lesson-two-track__label"><b>陰干</b><span>內藏・細緻</span></div>{STEM_PAIRS.map((pair) => <button key={pair.yin} type="button" onClick={() => setSelectedPair(pair.element)} className={selectedPair === pair.element ? 'is-active' : ''}><b>{pair.yin}</b><span>{pair.element}</span></button>)}</div></div>
      <div className="lesson-two-track-focus"><b>{current.yang} ↔ {current.yin}・同屬{current.element}</b><span>{current.yang}像{current.yangImage}，{current.yin}像{current.yinImage}；同元素，不同表現方向。</span><button type="button" onClick={() => { setSelectedPair('火'); setFeedback('✓ 對，丁是陰火；丙與丁同屬火。'); }}>找陰火・丁</button>{feedback && <em className={feedback.startsWith('✓') ? 'is-correct' : ''}>{feedback}</em>}</div>
    </section>;
  }

  if (stage === 'combines') {
    return <section className="lesson-two-atlas lesson-two-atlas--combines">
      <AtlasHeading number="04" eyebrow="五合牽引盤" inverse title="五組關係完整可見；一次只讀一條線。"><p>點選一組配對，先看它們互相牽引；詳細化象與例外條件放在下一層。</p></AtlasHeading>
      <div className="lesson-two-combine-board">{WU_HE.map((pair) => <button key={pair.id} type="button" onClick={() => setSelectedCombine(pair.id)} className={selectedCombine === pair.id ? 'is-active' : ''} aria-pressed={selectedCombine === pair.id}><b>{pair.left}</b><span>牽引</span><b>{pair.right}</b></button>)}</div>
      <div className="lesson-two-combine-focus"><span>目前聚焦：{activeCombine.left}{activeCombine.right}</span><b>{activeCombine.cue}</b><p>見合不等於必然化；仍要回到全局、月令與日主。</p><details><summary>展開條件提示</summary><p>五合是關係線索，不是單獨下吉凶結論的捷徑。</p></details></div>
    </section>;
  }

  return <section className="lesson-two-atlas lesson-two-atlas--light">
    <AtlasHeading number="05" eyebrow="判讀起點" title="先問四個問題，再談身強弱。"><p>點選任何一格，先回答一條觀察問題；初學者不需要在這一頁立刻下結論。</p></AtlasHeading>
    <div className="lesson-two-reading-grid">{READING_STARTS.map((item) => <button key={item.id} type="button" onClick={() => setSelectedReading(item.id)} className={`${selectedReading === item.id ? 'is-active' : ''} lesson-two-reading-grid__item`} aria-pressed={selectedReading === item.id}><span>{item.caption}</span><b>{item.label}</b><em>{item.question}</em></button>)}<div className="lesson-two-reading-core"><span>先問四個問題</span><b>再談<br />強／弱</b></div></div>
    <div className="lesson-two-reading-focus"><b>{activeReading.label}：{activeReading.question}</b><span>{activeReading.note}</span><p>不計分小任務：選一格，說出它在判讀時想回答的問題。</p></div>
  </section>;
}
