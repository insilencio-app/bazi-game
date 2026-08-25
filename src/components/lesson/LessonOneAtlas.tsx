/**
 * Style: 「五行研習桌」— Lesson 1 uses an open parchment desk, a focused element file,
 * and a full-canvas relationship map. Teaching interactions remain local; quiz logic stays in LessonPage.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type LessonOneAtlasStage = 'intro' | 'elements' | 'sheng' | 'ke' | 'practice' | 'recap';

type ElementName = '木' | '火' | '土' | '金' | '水';
type MapMode = 'sheng' | 'ke';

const ELEMENTS: Array<{ name: ElementName; english: string; cue: string; direction: string; season: string; emotion: string; tone: string }> = [
  { name: '木', english: 'Wood', cue: '生發、向上', direction: '東', season: '春', emotion: '怒', tone: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { name: '火', english: 'Fire', cue: '發散、向外', direction: '南', season: '夏', emotion: '喜', tone: 'border-rose-300 bg-rose-50 text-rose-800' },
  { name: '土', english: 'Earth', cue: '承載、調和', direction: '中', season: '四季', emotion: '思', tone: 'border-amber-300 bg-amber-50 text-amber-800' },
  { name: '金', english: 'Metal', cue: '收斂、整理', direction: '西', season: '秋', emotion: '悲', tone: 'border-stone-300 bg-stone-50 text-stone-800' },
  { name: '水', english: 'Water', cue: '流動、滋養', direction: '北', season: '冬', emotion: '恐', tone: 'border-sky-300 bg-sky-50 text-sky-800' },
];

const RELATIONS: Record<MapMode, Array<{ id: string; from: ElementName; to: ElementName; path: string }>> = {
  sheng: [
    { id: 'wood-fire', from: '木', to: '火', path: 'M50 19 Q68 19 78 31' },
    { id: 'fire-earth', from: '火', to: '土', path: 'M83 41 Q82 61 70 71' },
    { id: 'earth-metal', from: '土', to: '金', path: 'M63 79 Q49 88 35 79' },
    { id: 'metal-water', from: '金', to: '水', path: 'M25 71 Q15 58 17 42' },
    { id: 'water-wood', from: '水', to: '木', path: 'M23 30 Q33 18 46 19' },
  ],
  ke: [
    { id: 'wood-earth', from: '木', to: '土', path: 'M54 21 L67 69' },
    { id: 'earth-water', from: '土', to: '水', path: 'M63 78 L24 40' },
    { id: 'water-fire', from: '水', to: '火', path: 'M27 35 L74 35' },
    { id: 'fire-metal', from: '火', to: '金', path: 'M77 42 L35 70' },
    { id: 'metal-wood', from: '金', to: '木', path: 'M34 70 L47 21' },
  ],
};

const NODE_POSITIONS: Array<{ name: ElementName; x: number; y: number }> = [
  { name: '木', x: 50, y: 14 },
  { name: '火', x: 84, y: 35 },
  { name: '土', x: 70, y: 77 },
  { name: '金', x: 30, y: 77 },
  { name: '水', x: 16, y: 35 },
];

function AtlasHeading({ number, eyebrow, title, children, inverse = false }: { number: string; eyebrow: string; title: ReactNode; children?: ReactNode; inverse?: boolean }) {
  return (
    <div className={`atlas-study-heading ${inverse ? 'atlas-study-heading--inverse' : ''}`}>
      <div className="atlas-study-kicker"><span>{number}</span>{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function RelationDiagram({ mode, activeRelation, onSelect, compact = false }: { mode: MapMode; activeRelation: string; onSelect: (id: string) => void; compact?: boolean }) {
  const relations = RELATIONS[mode];
  const accent = mode === 'sheng' ? '#E7C477' : '#EF9A86';
  const active = relations.find((relation) => relation.id === activeRelation) ?? relations[0];

  return (
    <div className={`atlas-relation-diagram ${compact ? 'atlas-relation-diagram--compact' : ''}`}>
      <svg viewBox="0 0 100 100" role="img" aria-label="五行關係互動圖解">
        <defs>
          <marker id="lesson-one-atlas-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="currentColor" />
          </marker>
        </defs>
        {relations.map((relation) => {
          const isActive = relation.id === active.id;
          return <path key={relation.id} d={relation.path} onClick={() => onSelect(relation.id)} markerEnd="url(#lesson-one-atlas-arrow)" className="cursor-pointer fill-none transition-all duration-300" stroke={isActive ? accent : 'rgba(231,196,119,.24)'} color={isActive ? accent : 'rgba(231,196,119,.24)'} strokeWidth={isActive ? 3.2 : 2} strokeDasharray={isActive ? '8 4' : undefined} />;
        })}
        {NODE_POSITIONS.map((node) => <g key={node.name}><circle cx={node.x} cy={node.y} r="10" fill="#FFFDF7" stroke="#E2C781" strokeWidth="1.3" /><text x={node.x} y={node.y + 4} textAnchor="middle" fill="#102E4C" fontSize="8" fontWeight="800">{node.name}</text></g>)}
      </svg>
      <div className="atlas-relation-caption" style={{ color: accent }}>{active.from} {mode === 'sheng' ? '生' : '剋'} {active.to}</div>
      <p>選擇任何一條關係，觀察它的方向。</p>
    </div>
  );
}

export function LessonOneAtlas({ stage }: { stage: LessonOneAtlasStage }) {
  const [selectedElement, setSelectedElement] = useState<ElementName>('木');
  const [activeRelation, setActiveRelation] = useState('wood-fire');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const selected = useMemo(() => ELEMENTS.find((element) => element.name === selectedElement) ?? ELEMENTS[0], [selectedElement]);

  useEffect(() => {
    if (stage === 'sheng') setActiveRelation(RELATIONS.sheng[0].id);
    if (stage === 'ke') setActiveRelation(RELATIONS.ke[0].id);
  }, [stage]);

  const answer = (question: 'waterWood' | 'waterFire', choice: '相生' | '相剋') => {
    const expected = question === 'waterWood' ? '相生' : '相剋';
    setAnswers((previous) => ({ ...previous, [question]: choice }));
    setFeedback(choice === expected ? (question === 'waterWood' ? '正確。水能滋養木，所以是水生木。' : '正確。水能制約火，所以是水剋火。') : (question === 'waterWood' ? '提示：水滋養木；這是相生關係。' : '提示：水制約火；這是相剋關係。'));
  };

  if (stage === 'intro') {
    return <section className="atlas-study-scene atlas-study-intro">
      <div className="atlas-intro-watermark" aria-hidden="true">五</div>
      <div className="atlas-intro-copy">
        <AtlasHeading number="01" eyebrow="課前定位" title="先睇方向，再談解讀。"><p>五行不是需要死背的名詞清單，而是一套用來觀察關係、變化與傾向的學習語言。今課會先建立一張可重複使用的關係地圖。</p></AtlasHeading>
      </div>
      <ol className="atlas-intro-observations">
        <li><span>01</span><div><b>先看方向</b><p>木、火、土、金、水，先不是性格標籤。</p></div></li>
        <li><span>02</span><div><b>再讀關係</b><p>相生與相剋，才是五行如何運作的線索。</p></div></li>
        <li><span>03</span><div><b>保持框架</b><p>本課聚焦文化與學習框架，不作個人吉凶判斷。</p></div></li>
      </ol>
    </section>;
  }

  if (stage === 'elements') {
    return <section className="atlas-study-scene atlas-elements-scene">
      <AtlasHeading number="02" eyebrow="五種方向" title="五行先不是性格，而是動態感。"><p>選一個元素，先從它的方向、季節和行動感認識它；五個元素不再是一排資料格，而是一份可以逐張翻閱的元素檔案。</p></AtlasHeading>
      <div className="atlas-elements-layout">
        <article className={`atlas-element-file ${selected.tone}`}>
          <div className="atlas-element-file-mark" aria-hidden="true">{selected.name}</div>
          <div className="atlas-element-file-title"><span>ELEMENT FILE</span><h3>{selected.name}</h3><p>{selected.english}</p></div>
          <dl>
            {[['方向', selected.direction], ['季節', selected.season], ['情感', selected.emotion], ['記憶', selected.cue]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </article>
        <div className="atlas-element-index" role="tablist" aria-label="五行元素">
          {ELEMENTS.map((element, index) => <button key={element.name} type="button" role="tab" aria-selected={selected.name === element.name} onClick={() => setSelectedElement(element.name)} className={`atlas-element-tab ${element.tone} ${selected.name === element.name ? 'is-active' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><b>{element.name}</b><em>{element.cue}</em></button>)}
        </div>
      </div>
    </section>;
  }

  if (stage === 'sheng' || stage === 'ke') {
    const mode: MapMode = stage === 'sheng' ? 'sheng' : 'ke';
    const relations = RELATIONS[mode];
    const isSheng = mode === 'sheng';
    return <section className={`atlas-study-scene atlas-relations-scene atlas-relations-scene--single ${isSheng ? 'is-sheng' : 'is-ke'}`}>
      <div className="atlas-relations-intro atlas-relations-intro--single">
        <AtlasHeading number={isSheng ? '03' : '04'} eyebrow={isSheng ? '五行相生' : '五行相剋'} inverse title={isSheng ? '相生：沿箭頭走一步。' : '相剋：找出制約方向。'}><p>{isSheng ? '每次只看一條「誰生誰」的線。' : '每次只看一條「誰剋誰」的線。'}</p></AtlasHeading>
      </div>
      <div className="atlas-relation-workbench atlas-relation-workbench--single">
        <RelationDiagram mode={mode} activeRelation={activeRelation} onSelect={setActiveRelation} compact />
        <div className="atlas-relation-chip-grid" role="group" aria-label={isSheng ? '五行相生關係' : '五行相剋關係'}>
          {relations.map((relation) => <button key={relation.id} type="button" onClick={() => setActiveRelation(relation.id)} aria-pressed={activeRelation === relation.id} className={activeRelation === relation.id ? 'is-active' : ''}><b>{relation.from}</b><span>{isSheng ? '生' : '剋'} →</span><b>{relation.to}</b></button>)}
        </div>
      </div>
      <p className="atlas-relation-micro-task">小任務：點選一條線，先讀「{isSheng ? '誰生誰' : '誰剋誰'}」，不用急著背完整循環。</p>
      <details className="atlas-relation-details"><summary>展開本頁記憶線索</summary><p>{isSheng ? '相生可先理解為支持與延續；相剋可先理解為制約與平衡。兩者都只是關係線索，不等於單獨的吉凶判決。' : '相剋可先理解為制約與平衡；它與相生一樣是關係線索，不等於單獨的吉凶判決。'}</p></details>
    </section>;
  }

  if (stage === 'practice') {
    const card = (id: 'waterWood' | 'waterFire', target: ElementName) => <article className="border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[6px_6px_0_#EEE2CE]"><div className="flex items-center gap-3"><span className="font-serif text-4xl text-sky-800">水</span><span className="text-xl text-[#B48A43]">→</span><span className={`font-serif text-4xl ${target === '木' ? 'text-emerald-800' : 'text-rose-800'}`}>{target}</span></div><h3 className="mt-3 font-serif text-[22px] font-bold text-[#183452]">水對{target}</h3><p className="mt-2 text-[15px] leading-6 text-slate-600">先判斷方向，再看導師解釋。</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => answer(id, '相生')} className={`min-h-11 border px-3 py-2 text-base font-bold transition-colors ${answers[id] === '相生' ? 'border-[#B48A43] bg-[#F2E6CC] text-[#765B2D]' : 'border-[#DDD2BF] bg-[#FBF8F1] text-slate-600 hover:border-[#B48A43]'}`}>相生</button><button onClick={() => answer(id, '相剋')} className={`min-h-11 border px-3 py-2 text-base font-bold transition-colors ${answers[id] === '相剋' ? 'border-[#C76756] bg-[#F5E4DF] text-[#8B4037]' : 'border-[#DDD2BF] bg-[#FBF8F1] text-slate-600 hover:border-[#C76756]'}`}>相剋</button></div></article>;
    return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="05" eyebrow="導師帶做" title="同一個「水」，對象不同，關係便不同。"><p>這兩題不計入最後分數；它們用來讓你在進入正式測驗前，先把方向看清楚。</p></AtlasHeading><div className="grid gap-4 sm:grid-cols-2">{card('waterWood', '木')}{card('waterFire', '火')}</div>{feedback && <div className="mt-5 border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-800">{feedback}</div>}</div>;
  }

  return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="06" eyebrow="重點回顧" title="把這三句帶走，然後進入正式測驗。"><p>以下重點卡是進入原有測驗前的最後一次快速整理。下一步開始後，題庫、分數、提示與完成流程仍會完全沿用你現有的系統。</p></AtlasHeading><div className="grid gap-3 sm:grid-cols-3"><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-sm text-[#B48A43]">一</span><b className="mt-2 block font-serif text-[28px] text-[#102E4C]">五行</b><span className="mt-2 block text-[15px] font-semibold text-slate-600">木・火・土・金・水</span></div><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-sm text-[#B48A43]">二</span><b className="mt-2 block font-serif text-[28px] text-[#102E4C]">相生</b><span className="mt-2 block text-[15px] font-semibold text-slate-600">支持與延續</span></div><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-sm text-[#B48A43]">三</span><b className="mt-2 block font-serif text-[28px] text-[#102E4C]">相剋</b><span className="mt-2 block text-[15px] font-semibold text-slate-600">制約與平衡</span></div></div></div>;
}
