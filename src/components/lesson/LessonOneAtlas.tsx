/**
 * Style: 「藏書樓圖譜」— a local lesson-one module using indigo folios, gold paths, and one concept per interaction.
 * This component deliberately owns only the pre-quiz teaching layer; scoring and final assessment remain in LessonPage.
 */
import { useMemo, useState, type ReactNode } from 'react';

export type LessonOneAtlasStage = 'intro' | 'elements' | 'relations' | 'practice' | 'recap';

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

function AtlasHeading({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#9B7330]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#B48A43] font-serif text-[11px]">{number}</span>
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl font-bold leading-tight text-[#102B48] sm:text-4xl">{title}</h2>
      {children}
    </div>
  );
}

function RelationDiagram({ mode, activeRelation, onSelect }: { mode: MapMode; activeRelation: string; onSelect: (id: string) => void }) {
  const relations = RELATIONS[mode];
  const accent = mode === 'sheng' ? '#E7C477' : '#D56D59';
  const active = relations.find((relation) => relation.id === activeRelation) ?? relations[0];

  return (
    <div className="overflow-hidden border border-[#1A4264] bg-[#0D2A4A] p-3 shadow-[9px_9px_0_#E8DCC6] sm:p-5">
      <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[#E5C57E]">
        <span>五行關係圖</span>
        <span className="text-[#DCE4E7]">{mode === 'sheng' ? '相生：支持與延續' : '相剋：制約與平衡'}</span>
      </div>
      <svg viewBox="0 0 100 100" className="mx-auto block h-[280px] max-w-full overflow-visible sm:h-[330px]" role="img" aria-label="五行關係互動圖解">
        <defs>
          <marker id="lesson-one-atlas-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="currentColor" />
          </marker>
        </defs>
        {relations.map((relation) => {
          const isActive = relation.id === active.id;
          return <path key={relation.id} d={relation.path} onClick={() => onSelect(relation.id)} markerEnd="url(#lesson-one-atlas-arrow)" className="cursor-pointer fill-none transition-all duration-300" stroke={isActive ? accent : 'rgba(231,196,119,.25)'} color={isActive ? accent : 'rgba(231,196,119,.25)'} strokeWidth={isActive ? 3.2 : 2} strokeDasharray={isActive ? '8 4' : undefined} />;
        })}
        {NODE_POSITIONS.map((node) => <g key={node.name}><circle cx={node.x} cy={node.y} r="10" fill="#FFFDF7" stroke="#E2C781" strokeWidth="1.3" /><text x={node.x} y={node.y + 4} textAnchor="middle" fill="#102E4C" fontSize="8" fontWeight="800">{node.name}</text></g>)}
      </svg>
      <div className="mb-1 text-center text-sm font-bold tracking-[0.16em]" style={{ color: accent }}>{active.from} {mode === 'sheng' ? '生' : '剋'} {active.to}</div>
      <p className="text-center text-xs text-slate-300">選擇任何一條關係，觀察它的方向。</p>
    </div>
  );
}

export function LessonOneAtlas({ stage }: { stage: LessonOneAtlasStage }) {
  const [selectedElement, setSelectedElement] = useState<ElementName>('木');
  const [mapMode, setMapMode] = useState<MapMode>('sheng');
  const [activeRelation, setActiveRelation] = useState('wood-fire');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const selected = useMemo(() => ELEMENTS.find((element) => element.name === selectedElement) ?? ELEMENTS[0], [selectedElement]);

  const chooseMode = (mode: MapMode) => {
    setMapMode(mode);
    setActiveRelation(RELATIONS[mode][0].id);
  };

  const answer = (question: 'waterWood' | 'waterFire', choice: '相生' | '相剋') => {
    const expected = question === 'waterWood' ? '相生' : '相剋';
    setAnswers((previous) => ({ ...previous, [question]: choice }));
    setFeedback(choice === expected ? (question === 'waterWood' ? '正確。水能滋養木，所以是水生木。' : '正確。水能制約火，所以是水剋火。') : (question === 'waterWood' ? '提示：水滋養木；這是相生關係。' : '提示：水制約火；這是相剋關係。'));
  };

  if (stage === 'intro') {
    return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="01" eyebrow="由結構開始" title={<>先睇方向，<br />再談解讀。</>}><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">五行不是需要死背的名詞清單，而是一套用來觀察關係、變化與傾向的學習語言。今課會先建立一張可重複使用的關係地圖。</p></AtlasHeading><div className="grid gap-3 sm:grid-cols-3"><div className="border-l-4 border-[#B48A43] bg-[#F7F1E6] p-4 text-sm text-[#665E51]"><b className="block text-[#89692C]">觀察一</b>先辨認五行的方向感。</div><div className="border-l-4 border-[#B48A43] bg-[#F7F1E6] p-4 text-sm text-[#665E51]"><b className="block text-[#89692C]">觀察二</b>再看相生與相剋的箭頭。</div><div className="border-l-4 border-[#B48A43] bg-[#F7F1E6] p-4 text-sm text-[#665E51]"><b className="block text-[#89692C]">導師註記</b>本課聚焦文化與學習框架，不作個人吉凶判斷。</div></div></div>;
  }

  if (stage === 'elements') {
    return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="02" eyebrow="五種方向" title={<>五行先不是性格，<br />而是動態感。</>}><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">點擊任一張典籍卡，先以簡潔的方向感認識木、火、土、金、水；你原有的方向、季節與情感資料都保留在此。</p></AtlasHeading><div className="grid grid-cols-5 gap-2 sm:gap-3">{ELEMENTS.map((element) => <button key={element.name} type="button" onClick={() => setSelectedElement(element.name)} className={`min-h-[126px] border p-3 text-left transition-all ${element.tone} ${selected.name === element.name ? 'scale-[1.03] ring-2 ring-[#D9B76E] ring-offset-2 shadow-lg' : 'hover:-translate-y-1 hover:shadow-md'}`}><span className="block font-serif text-3xl font-black sm:text-4xl">{element.name}</span><span className="mt-3 block text-[10px] font-bold tracking-wider opacity-80 sm:text-xs">{element.cue}</span></button>)}</div><div className={`mt-5 grid gap-4 border p-4 sm:grid-cols-[120px_1fr] ${selected.tone}`}><div><span className="font-serif text-5xl font-black">{selected.name}</span><p className="mt-1 text-xs font-semibold opacity-70">{selected.english}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['方向', selected.direction], ['季節', selected.season], ['情感', selected.emotion], ['記憶', selected.cue]].map(([label, value]) => <div key={label} className="bg-white/70 p-2"><span className="block text-[10px] font-bold opacity-60">{label}</span><span className="mt-1 block text-sm font-bold">{value}</span></div>)}</div></div></div>;
  }

  if (stage === 'relations') {
    const relations = RELATIONS[mapMode];
    return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="03" eyebrow="關係圖譜" title={mapMode === 'sheng' ? <>相生，是支持與延續。</> : <>相剋，是制約與平衡。</>}><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">一次只看一條線。你可以切換相生與相剋，再點擊關係標籤或圖中的箭頭，確認每一個方向。</p></AtlasHeading><div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => chooseMode('sheng')} className={`rounded-full border px-4 py-2 text-sm font-bold ${mapMode === 'sheng' ? 'border-[#0D2A4A] bg-[#0D2A4A] text-white' : 'border-[#D8C8AB] bg-white text-[#40516A]'}`}>相生：支持與延續</button><button type="button" onClick={() => chooseMode('ke')} className={`rounded-full border px-4 py-2 text-sm font-bold ${mapMode === 'ke' ? 'border-[#8B4037] bg-[#8B4037] text-white' : 'border-[#D8C8AB] bg-white text-[#40516A]'}`}>相剋：制約與平衡</button></div><div className="grid items-center gap-6 lg:grid-cols-[1fr_1.15fr]"><div className="flex flex-wrap gap-2">{relations.map((relation) => <button key={relation.id} type="button" onClick={() => setActiveRelation(relation.id)} className={`rounded-full border px-3 py-2 text-sm font-bold transition-colors ${activeRelation === relation.id ? (mapMode === 'sheng' ? 'border-[#B48A43] bg-[#F3E8CF] text-[#775A29]' : 'border-[#C76756] bg-[#F5E4DF] text-[#8B4037]') : 'border-[#DED5C3] bg-[#FBF8F1] text-slate-600 hover:border-[#B48A43]'}`}>{relation.from}{mapMode === 'sheng' ? '生' : '剋'}{relation.to}</button>)}</div><RelationDiagram mode={mapMode} activeRelation={activeRelation} onSelect={setActiveRelation} /></div></div>;
  }

  if (stage === 'practice') {
    const card = (id: 'waterWood' | 'waterFire', target: ElementName) => <article className="border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[6px_6px_0_#EEE2CE]"><div className="flex items-center gap-3"><span className="font-serif text-4xl text-sky-800">水</span><span className="text-[#B48A43]">→</span><span className={`font-serif text-4xl ${target === '木' ? 'text-emerald-800' : 'text-rose-800'}`}>{target}</span></div><h3 className="mt-3 font-serif text-xl font-bold text-[#183452]">水對{target}</h3><p className="mt-1 text-sm text-slate-500">先判斷方向，再看導師解釋。</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => answer(id, '相生')} className={`border p-2 text-sm font-bold ${answers[id] === '相生' ? 'border-[#B48A43] bg-[#F2E6CC] text-[#765B2D]' : 'border-[#DDD2BF] bg-[#FBF8F1] text-slate-600'}`}>相生</button><button onClick={() => answer(id, '相剋')} className={`border p-2 text-sm font-bold ${answers[id] === '相剋' ? 'border-[#C76756] bg-[#F5E4DF] text-[#8B4037]' : 'border-[#DDD2BF] bg-[#FBF8F1] text-slate-600'}`}>相剋</button></div></article>;
    return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="04" eyebrow="導師帶做" title={<>同一個「水」，<br />對象不同，關係便不同。</>}><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">這兩題不計入最後分數；它們用來讓你在進入正式測驗前，先把方向看清楚。</p></AtlasHeading><div className="grid gap-4 sm:grid-cols-2">{card('waterWood', '木')}{card('waterFire', '火')}</div>{feedback && <div className="mt-5 border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{feedback}</div>}</div>;
  }

  return <div className="rounded-[1.35rem] border border-[#DDD2BF] bg-[#FFFDF7] p-5 shadow-[8px_8px_0_#EEE2CE] sm:p-7"><AtlasHeading number="05" eyebrow="重點回顧" title={<>把這三句帶走，<br />然後進入正式測驗。</>}><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">以下重點卡是進入原有測驗前的最後一次快速整理。下一步開始後，題庫、分數、提示與完成流程仍會完全沿用你現有的系統。</p></AtlasHeading><div className="grid gap-3 sm:grid-cols-3"><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-xs text-[#B48A43]">一</span><b className="mt-2 block font-serif text-2xl text-[#102E4C]">五行</b><span className="mt-2 block text-sm font-semibold text-slate-600">木・火・土・金・水</span></div><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-xs text-[#B48A43]">二</span><b className="mt-2 block font-serif text-2xl text-[#102E4C]">相生</b><span className="mt-2 block text-sm font-semibold text-slate-600">支持與延續</span></div><div className="border border-[#DCCFB8] bg-[#FBF7EE] p-5"><span className="font-serif text-xs text-[#B48A43]">三</span><b className="mt-2 block font-serif text-2xl text-[#102E4C]">相剋</b><span className="mt-2 block text-sm font-semibold text-slate-600">制約與平衡</span></div></div></div>;
}
