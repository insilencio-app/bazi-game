// Temporary script: update lesson 5 steps and quiz banks
// Run: node tools/_update-lesson5-temp.js
// Then delete this file.

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ─────────────────────────────────────────────
// ANCHOR STRINGS (unique identifiers in file)
// ─────────────────────────────────────────────

// Steps: starts right after "level: 'intermediate'," within lesson 5 (identified by title_cn)
// We find lesson 5 title first, then narrow down.
// Handle both CRLF and LF
const eol = content.includes('\r\n') ? '\r\n' : '\n';

const lesson5Marker = "title_en: 'Ten Gods Explained'";
const lesson5Pos = content.indexOf(lesson5Marker);
if (lesson5Pos === -1) throw new Error('Cannot find lesson 5 marker');

// Steps block: from "    steps: [" to just before "    questionBank: ["
const stepsOpenStr = eol + '    steps: [';
const stepsOpenPos = content.indexOf(stepsOpenStr, lesson5Pos);
if (stepsOpenPos === -1) throw new Error('Cannot find steps open');

const qBankOpenStr = eol + '    questionBank: [';
const qBankOpenPos = content.indexOf(qBankOpenStr, stepsOpenPos);
if (qBankOpenPos === -1) throw new Error('Cannot find questionBank open after steps');

// trueFalseBank boundary
const tfBankOpenStr = eol + '    trueFalseBank: [';
const tfBankOpenPos = content.indexOf(tfBankOpenStr, qBankOpenPos);
if (tfBankOpenPos === -1) throw new Error('Cannot find trueFalseBank open');

// matchBank boundary
const matchBankOpenStr = eol + '    matchBank: [';
const matchBankOpenPos = content.indexOf(matchBankOpenStr, tfBankOpenPos);
if (matchBankOpenPos === -1) throw new Error('Cannot find matchBank open');

// End of matchBank: find the next top-level field after matchBank (content: `)
const contentFieldStr = eol + "    content: \`";
const contentFieldPos = content.indexOf(contentFieldStr, matchBankOpenPos);
if (contentFieldPos === -1) throw new Error('Cannot find content field after matchBank');

// ─────────────────────────────────────────────────────────────
// NEW STEPS (10 steps aligned to transcript teaching structure)
// ─────────────────────────────────────────────────────────────

const newSteps = `
    steps: [
      {
        id: 1,
        type: 'content',
        title: '十神是什麼？（以日主為中心）',
        paragraphs: [
          '十神，是八字命理的核心分析工具，又稱「通變星」。以日柱天干（日干）為「我」，將四柱其餘干支，依五行生剋劃分為十種社會角色與心性模式。',
          '如果說五行是構成命運的基本元素，十神就是這些元素組合而成、活靈活現的人物與劇情。十神是連結抽象五行與具體人生的橋樑。',
        ],
      },
      {
        id: 2,
        type: 'content',
        title: '五類關係與十神判定',
        bullets: [
          '生我者：偏印（梟神）／正印（滋養與庇護）',
          '同我者：比肩／劫財（羊刃）（扶助與競爭）',
          '我生者：食神／傷官（輸出與表達）',
          '我剋者：偏財／正財（資源與掌控）',
          '剋我者：七殺（偏官）／正官（規則與壓力）',
          '判定流程固定：先看五行關係，再看陰陽定正偏（比劫為例外：同陰陽比肩、異陰陽劫財）。',
        ],
      },
      {
        id: 3,
        type: 'content',
        title: '十神的歷史意義：從神煞到十神',
        bullets: [
          '早期祿命法以年柱納音為核心，吉凶靠天乙貴人、驛馬等零散神煞符號。',
          '十神體系讓論命重心從零散神煞轉到日主為核心，透過五行生剋構建以「我」為中心的社會關係網絡。',
          '這使八字分析從「宿命論」邁向「關係論」與「心性論」，是命理史上一大飛躍。',
        ],
      },
      {
        id: 4,
        type: 'content',
        title: '十神是命運的角色扮演',
        bullets: [
          '官殺：內在的管理者與挑戰者，代表責任感、紀律與面對壓力的能力。',
          '印綬：內在的學者與守護者，代表學習力、內在安全感與慈悲心。',
          '財星：內在的實幹家與商人，代表對現實世界的掌控慾望與價值實現的追求。',
          '食傷：內在的藝術家與革命者，代表創造力、表現慾與對自由的渴望。',
          '比劫：內在的夥伴與競爭者，代表自我意識、獨立性與社交需求。',
          '一個人的命運，正是這十種內在角色彼此博弈、相互成就的過程。',
        ],
      },
      {
        id: 5,
        type: 'content',
        title: '十神關係速查表（十日主）怎麼用',
        bullets: [
          '找到你的日主所在橫排，再找目標天干所在縱列，交叉點即為十神。',
          '速查表只適用於天干十神判定，地支需先找藏干，再用同樣邏輯判十神。',
          '不要直接背表格結果，要理解背後的五行生剋邏輯，才能在大運流年靈活運用。',
          '速查表是工具，而非終點——判讀還需結合旺衰、透干、有根等要素。',
        ],
      },
      {
        id: 6,
        type: 'content',
        title: '五組十神核心意象（速讀版）',
        bullets: [
          '正印 & 偏印（梟神）：庇護、學識、慈悲、內在安全感',
          '比肩 & 劫財（羊刃）：自我、獨立、競爭、社交',
          '食神 & 傷官：才華、創造、自由、表現慾',
          '偏財 & 正財：掌控、務實、財富、佔有慾',
          '七殺（偏官）& 正官：責任、規則、壓力、權威',
        ],
      },
      {
        id: 7,
        type: 'content',
        title: '十神的應用：格局與用神',
        bullets: [
          '格局：月令藏干透出在天干的十神，通常決定命局的核心格局，如「正官格」、「食神格」等。格局的純粹與否，決定命主天生的成就層次。',
          '用神：分析全局十神力量對比與旺衰，找出能平衡全局、使命局流通有情的關鍵十神。',
          '大運流年若能生助用神，則運勢順遂；若剋損用神，則多有不順。',
        ],
      },
      {
        id: 8,
        type: 'content',
        title: '生剋制化：常見四組關鍵互動',
        bullets: [
          '傷官見官：為禍百端（傷官剋正官，是古籍最重要的忌諱之一）',
          '食神制殺：化殺為權（食神剋七殺，可將壓力轉為動力）',
          '財星壞印：貪財忘義（財星剋印星，削弱學識與貴人力量）',
          '官印相生：功成名就（正官生印星，形成良性循環）',
        ],
      },
      {
        id: 9,
        type: 'content',
        title: '判讀流程（避免一刀切）',
        bullets: [
          '第1步：先定日主，確認我是誰，強弱如何。',
          '第2步：對各天干套用五行生剋，定出五大類（比劫／食傷／財／官殺／印）。',
          '第3步：用陰陽細分正偏（比劫以同/異陰陽定比肩/劫財）。',
          '第4步：結合透干有根、旺衰、大運流年，分層判讀，避免只看本命靜盤就下定論。',
        ],
      },
      {
        id: 10,
        type: 'content',
        title: '一分鐘心法',
        bullets: [
          '十神本身無絕對吉凶，旺衰適當才是吉，過與不及皆為凶。',
          '判十神時，永遠以日主為中心——同一個天干，日主不同，十神就不同。',
          '先五行關係，後陰陽細分；先本命格局，後大運流年——層次分明，準確率最高。',
          '十神是人生劇情的角色，不是命運宣判書；理解角色互動，才能真正「趨吉避凶」。',
        ],
      },
    ],`;

// ─────────────────────────────────────────────────────────────
// NEW QUESTION BANK (18 concept-based MCQs)
// ─────────────────────────────────────────────────────────────

const newQuestionBank = `
    questionBank: [
      {
        id: 1,
        question: '十神判定的出發點（參照中心）是哪個？',
        options: ['年柱天干', '日柱天干（日主）', '月柱天干', '時柱天干'],
        correct: 1,
        explanation: '十神以日柱天干（日主）為「我」，所有十神關係都是相對於日主而定義的。',
      },
      {
        id: 2,
        question: '判定十神的正確步驟是什麼？',
        options: ['先看陰陽，再看五行', '先看五行關係，再用陰陽定正偏', '先背速查表，再反推邏輯', '直接查納音，不需五行'],
        correct: 1,
        explanation: '標準流程：先判五行關係（屬哪一類），再用陰陽細分正偏；比劫是唯一例外（同陰陽=比肩，異陰陽=劫財）。',
      },
      {
        id: 3,
        question: '「同我者」在十神中對應哪一組？',
        options: ['食神 / 傷官', '偏財 / 正財', '比肩 / 劫財', '七殺 / 正官'],
        correct: 2,
        explanation: '「同我者」是與日主同五行的天干，同陰陽為比肩，異陰陽為劫財。',
      },
      {
        id: 4,
        question: '十神體系最重要的歷史意義是什麼？',
        options: ['把論命重心從日主轉移到年柱', '把論命重心從零散神煞轉移到以日主為核心', '取代了所有其他命理方法', '讓五行不再重要'],
        correct: 1,
        explanation: '十神體系讓論命從零散神煞（天乙貴人、驛馬等）轉到以日主為中心的五行生剋，是命理學的一大進步。',
      },
      {
        id: 5,
        question: '在十神的「角色扮演框架」中，哪一組象徵「內在的藝術家與革命者」？',
        options: ['官殺', '印綬', '食傷', '比劫'],
        correct: 2,
        explanation: '食傷（食神與傷官）代表創造力、表現慾與對自由的渴望，是內在的藝術家與革命者。',
      },
      {
        id: 6,
        question: '「傷官見官」在古籍中的傳統評語是什麼？',
        options: ['化殺為權', '功成名就', '為禍百端', '貪財忘義'],
        correct: 2,
        explanation: '「傷官見官，為禍百端」是古籍中最重要的忌諱之一，傷官剋正官，破壞官星的力量。',
      },
      {
        id: 7,
        question: '「食神制殺」的核心意義是什麼？',
        options: ['食神生印，增加學識', '食神剋七殺，化壓力為動力', '食神生財，增加財富', '食神剋正官，破壞規則'],
        correct: 1,
        explanation: '食神制殺（食神剋七殺），能將七殺帶來的壓力轉化為動力，即「化殺為權」。',
      },
      {
        id: 8,
        question: '「官印相生」是指什麼？',
        options: ['正官剋印星，形成對立', '正官生印星，形成良性循環', '七殺剋印星，破壞學識', '印星剋正官，降低地位'],
        correct: 1,
        explanation: '正官生印星（官生印），形成良性循環，古有「官印相生，功成名就」之說。',
      },
      {
        id: 9,
        question: '八字「格局」的核心通常由哪個位置的十神決定？',
        options: ['年支藏干透出的天干', '日主本身的五行', '月令藏干透出在天干的十神', '時干的五行'],
        correct: 2,
        explanation: '月令（月支藏干）透出在天干的十神，通常決定命局的核心格局，如「正官格」、「食神格」等。',
      },
      {
        id: 10,
        question: '判讀某顆十神時，「有透有根」代表什麼狀態？',
        options: ['最弱，幾乎無法發揮', '顯現但不穩定', '隱藏但有續航力', '最穩，表現直接且有承載力'],
        correct: 3,
        explanation: '有透（天干顯現）有根（地支有根氣），是四種狀態中最穩的，表現直接且續航力強。',
      },
      {
        id: 11,
        question: '分層判讀八字時，正確的優先次序是什麼？',
        options: ['先流年，再大運，最後本命', '先大運，再本命，最後流年', '先本命格局，再大運，最後流年', '三層同時看，不分先後'],
        correct: 2,
        explanation: '正確次序：先看本命格局（靜盤），再看大運走向，最後看流年觸發——層次分明才能準確。',
      },
      {
        id: 12,
        question: '十神的吉凶觀，最接近以下哪個描述？',
        options: ['固定吉凶：正官永遠吉，七殺永遠凶', '以旺衰為準：適當旺衰才是吉，過與不及皆凶', '只要五行旺就是吉', '以出生年份決定吉凶'],
        correct: 1,
        explanation: '十神本身沒有絕對吉凶，要看日主旺衰與整體命局—適當旺衰才是吉，過與不及皆可為凶。',
      },
      {
        id: 13,
        question: '比劫在陰陽判定上的「例外規則」是什麼？',
        options: ['同陰陽為劫財，異陰陽為比肩', '同陰陽為比肩，異陰陽為劫財', '同陰陽為正財，異陰陽為偏財', '比劫不看陰陽，只看五行'],
        correct: 1,
        explanation: '比劫是唯一例外：同陰陽判為比肩、異陰陽判為劫財（其他四類反之，同為偏，異為正）。',
      },
      {
        id: 14,
        question: '速查表的主要用途是什麼？',
        options: ['直接套用結果，不需理解邏輯', '快速查閱天干十神對應，輔助學習五行邏輯', '判斷地支藏干', '計算大運起始年份'],
        correct: 1,
        explanation: '速查表輔助快速查閱天干十神，但要理解背後的五行生剋邏輯，才能靈活應用於大運流年。',
      },
      {
        id: 15,
        question: '偏印的別稱是什麼？',
        options: ['羊刃', '梟神', '七殺', '食神'],
        correct: 1,
        explanation: '偏印又稱「梟神」，象徵深刻、獨特的思維，是術數玄學家或藝術家的特質。',
      },
      {
        id: 16,
        question: '劫財的別稱是什麼？',
        options: ['梟神', '七殺', '羊刃', '正印'],
        correct: 2,
        explanation: '劫財又稱「羊刃」，象徵競爭、果敢，也帶有衝動、好鬥的一面。',
      },
      {
        id: 17,
        question: '「財星壞印」是指什麼關係？',
        options: ['財星生印星，增強學識', '財星剋印星，削弱貴人與學識力量', '印星剋財星，影響財運', '財星與印星無直接關係'],
        correct: 1,
        explanation: '財星剋印星（財壞印），削弱印星代表的學識與貴人力量，古有「貪財忘義」之說。',
      },
      {
        id: 18,
        question: '以下哪項最能總結十神學習的核心心法？',
        options: ['十神有固定吉凶，背熟就能論命', '十神是角色，需看旺衰組合，以日主為中心，分層判讀', '只需看七殺和正官，其他不重要', '速查表結果就是最終判斷，無需進一步分析'],
        correct: 1,
        explanation: '十神無絕對吉凶，需以日主為中心，先五行後陰陽，結合旺衰與層次，才能準確判讀。',
      },
    ],`;

// ─────────────────────────────────────────────────────────────
// NEW TRUE/FALSE BANK (10 concept-based items)
// ─────────────────────────────────────────────────────────────

const newTrueFalseBank = `
    trueFalseBank: [
      {
        id: 1,
        question: '十神的判定，永遠以日柱天干（日主）為中心。',
        correct: true,
        explanation: '正確！日主代表「我」，所有十神都是相對於日主的五行生剋關係而定義的。',
      },
      {
        id: 2,
        question: '判定十神的正確流程是：先看陰陽，再看五行關係。',
        correct: false,
        explanation: '錯誤！應先看五行關係（定五大類），再用陰陽細分正偏，順序相反。',
      },
      {
        id: 3,
        question: '比劫是唯一在陰陽判定上有例外的十神組：同陰陽為比肩，異陰陽為劫財。',
        correct: true,
        explanation: '正確！其他四類（食傷/財/官殺/印）同陰陽為偏、異陰陽為正；只有比劫相反。',
      },
      {
        id: 4,
        question: '十神速查表可以直接判定地支的十神，無需先查藏干。',
        correct: false,
        explanation: '錯誤！速查表只適用於天干，地支需先找出藏干，再對藏干套用十神邏輯。',
      },
      {
        id: 5,
        question: '「傷官見官，為禍百端」是一個不可改變的絕對定論，任何命局都適用。',
        correct: false,
        explanation: '錯誤！這是古籍傳統說法，但實際上需視命局旺衰與組合而定，不宜一刀切。',
      },
      {
        id: 6,
        question: '「官印相生」是指正官生印星，形成良性循環，有助於功成名就。',
        correct: true,
        explanation: '正確！正官生印（官生印），是十神之間最經典的良性互動之一。',
      },
      {
        id: 7,
        question: '古籍中的「用神」一詞，與現代八字學的「用神」有完全相同的含義。',
        correct: false,
        explanation: '錯誤！古籍的「用神」偏指格局的核心十神（用事之神），現代用法已延伸為平衡命局的關鍵十神，語境不同。',
      },
      {
        id: 8,
        question: '分析一個八字，應先看本命格局，再看大運，最後看流年。',
        correct: true,
        explanation: '正確！層次分明的判讀順序：本命格局→大運走向→流年觸發，避免只看流年就下結論。',
      },
      {
        id: 9,
        question: '十神本身有固定的吉凶屬性，正官永遠吉，七殺永遠凶。',
        correct: false,
        explanation: '錯誤！十神無絕對吉凶，以旺衰適當為吉；七殺制化得宜可化殺為權，正官過旺亦可成負擔。',
      },
      {
        id: 10,
        question: '十神體系的建立，標誌著八字命理從宿命論向關係論與心性論的進化。',
        correct: true,
        explanation: '正確！十神體系讓論命從散漫神煞轉到以日主為核心的動態社會關係分析，是命理學的重大進步。',
      },
    ],`;

// ─────────────────────────────────────────────────────────────
// NEW MATCH BANK (6 concept-based sets)
// ─────────────────────────────────────────────────────────────

const newMatchBank = `
    matchBank: [
      {
        id: 1,
        prompt: '五類關係配對：「我」與天干的關係→十神組別',
        pairs: [
          { left: '同我者', right: '比肩 / 劫財' },
          { left: '我生者', right: '食神 / 傷官' },
          { left: '我剋者', right: '偏財 / 正財' },
          { left: '剋我者', right: '七殺 / 正官' },
          { left: '生我者', right: '偏印 / 正印' },
        ],
      },
      {
        id: 2,
        prompt: '五組十神核心意象配對',
        pairs: [
          { left: '官殺', right: '責任、規則、壓力、權威' },
          { left: '印綬', right: '庇護、學識、慈悲、安全感' },
          { left: '財星', right: '掌控、務實、財富、佔有慾' },
          { left: '食傷', right: '才華、創造、自由、表現慾' },
          { left: '比劫', right: '自我、獨立、競爭、社交' },
        ],
      },
      {
        id: 3,
        prompt: '常見制化關係配對',
        pairs: [
          { left: '傷官見官', right: '為禍百端' },
          { left: '食神制殺', right: '化殺為權' },
          { left: '財星壞印', right: '貪財忘義' },
          { left: '官印相生', right: '功成名就' },
        ],
      },
      {
        id: 4,
        prompt: '判讀層次配對：層次→分析重點',
        pairs: [
          { left: '本命格局', right: '天生成就層次與性格底色' },
          { left: '大運', right: '人生各階段走向與環境變化' },
          { left: '流年', right: '當年事件觸發與短期變動' },
          { left: '流月 / 流日', right: '具體事件的精確時間節點' },
        ],
      },
      {
        id: 5,
        prompt: '透根四象配對：狀態→含義',
        pairs: [
          { left: '有透有根', right: '最穩，表現直接且有承載力' },
          { left: '有透無根', right: '顯而不穩，易一觸即散' },
          { left: '無透有根', right: '內在有力，表現不直接' },
          { left: '無透無根', right: '弱象，力量薄弱' },
        ],
      },
      {
        id: 6,
        prompt: '常見誤區配對：誤區→正確修正',
        pairs: [
          { left: '只背十神名稱，不看五行邏輯', right: '先理解五行生剋，再記名稱' },
          { left: '給十神貼固定吉凶標籤', right: '以旺衰組合判吉凶，無絕對好壞' },
          { left: '只看流年，忽略本命與大運', right: '先本命，再大運，最後流年' },
          { left: '速查表結果直接當定論', right: '速查表是輔助工具，需結合旺衰判讀' },
        ],
      },
    ],`;

// ─────────────────────────────────────────────────────────────
// APPLY REPLACEMENTS
// ─────────────────────────────────────────────────────────────

// 1. Replace steps block
const beforeSteps = content.substring(0, stepsOpenPos);
const afterSteps = content.substring(qBankOpenPos); // starts with \n    questionBank: [
content = beforeSteps + newSteps + afterSteps;

// After replacement 1, recalculate positions since content changed
const l5pos2 = content.indexOf(lesson5Marker);
const qBankPos2 = content.indexOf(qBankOpenStr, l5pos2);
const tfBankPos2 = content.indexOf(tfBankOpenStr, qBankPos2);
const matchBankPos2 = content.indexOf(matchBankOpenStr, tfBankPos2);
const contentFieldPos2 = content.indexOf(contentFieldStr, matchBankPos2);

// 2. Replace questionBank
const beforeQBank = content.substring(0, qBankPos2);
const afterQBank = content.substring(tfBankPos2); // starts with \n    trueFalseBank: [
content = beforeQBank + newQuestionBank + afterQBank;

// Recalculate after questionBank replacement
const l5pos3 = content.indexOf(lesson5Marker);
const tfBankPos3 = content.indexOf(tfBankOpenStr, l5pos3);
const matchBankPos3 = content.indexOf(matchBankOpenStr, tfBankPos3);
const contentFieldPos3 = content.indexOf(contentFieldStr, matchBankPos3);

// 3. Replace trueFalseBank
const beforeTFBank = content.substring(0, tfBankPos3);
const afterTFBank = content.substring(matchBankPos3); // starts with \n    matchBank: [
content = beforeTFBank + newTrueFalseBank + afterTFBank;

// Recalculate after trueFalseBank replacement
const l5pos4 = content.indexOf(lesson5Marker);
const matchBankPos4 = content.indexOf(matchBankOpenStr, l5pos4);
const contentFieldPos4 = content.indexOf(contentFieldStr, matchBankPos4);

// 4. Replace matchBank
const beforeMatchBank = content.substring(0, matchBankPos4);
const afterMatchBank = content.substring(contentFieldPos4); // starts with \n    content: `
content = beforeMatchBank + newMatchBank + afterMatchBank;

// ─────────────────────────────────────────────────────────────
// WRITE OUTPUT
// ─────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! Lesson 5 updated successfully.');
console.log('Steps: 10 (was 7)');
console.log('questionBank: 18 (was 35)');
console.log('trueFalseBank: 10 (was 20)');
console.log('matchBank: 6 (was 12)');
