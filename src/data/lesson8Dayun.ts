/**
 * Lesson 8 content contract: a privacy-preserving Da Yun calculation lesson.
 * It uses only anonymous teaching cases and teaches time coordinates, not life predictions.
 */

export const lesson8Dayun = {
  id: 8,
  title_cn: '第8課：排大運——由月柱推演時間節奏',
  title_en: 'Luck Pillar Calculation: Direction, Start Date & Ten-Year Sequence',
  learning_objectives_cn: '以月柱判斷大運順逆，換算起運間隔並加回出生時刻，排出第一柱及後續十年時間軸。',
  level: 'advanced',
  steps: [
    {
      id: 1,
      type: 'content',
      title: '大運不是預言，是十年一段的時間座標',
      paragraphs: [
        '原局是出生時的結構；大運則把出生後的時間切成十年一段，讓我們知道每一段會遇到哪一組干支。',
        '本課只教「怎樣排出時間座標」，不為個人貼上好壞標籤，也不作人生預測。',
      ],
    },
    {
      id: 2,
      type: 'content',
      title: '第一步：月柱是起點，不是第一柱大運',
      bullets: [
        '大運由月柱推出，但月柱本身不計入第一柱大運。',
        '順排時，月柱丙寅的第一柱是丁卯；逆排時，第一柱是乙丑。',
        '天干與地支必須同步移動一位，不能只推其中一半。',
      ],
    },
    {
      id: 3,
      type: 'content',
      title: '第二步：先看年干陰陽，再判順排或逆排',
      paragraphs: [
        '本課採用常見子平口訣：陽男陰女順排；陰男陽女逆排。',
        '甲、丙、戊、庚、壬為陽年干；乙、丁、己、辛、癸為陰年干。先定年干陰陽，再配合命例性別，就能決定往前還是往後推。',
      ],
      bullets: ['陽年男、陰年女：順排。', '陽年女、陰年男：逆排。'],
    },
    {
      id: 4,
      type: 'content',
      title: '第三步：每柱十年，先排柱序再放時間',
      paragraphs: [
        '排出第一柱後，每一柱都代表十年，因此先把干支序列排好，再把實際起運日期時間放進時間軸。',
        '例如順排月柱丙寅：丁卯、戊辰、己巳、庚午、辛未、壬申。',
      ],
    },
    {
      id: 5,
      type: 'content',
      title: '第四步：換算起運間隔，再加回出生時刻',
      paragraphs: [
        '順排由出生時刻量至下一個「節」；逆排則量至上一個「節」。本課採用三日作一年、一日作四個月、一個時辰作十日的換算口徑。',
        '換算結果是「起運間隔」，不是固定整歲。第一柱的實際開始點，必須把這段間隔加回出生日期與時間。',
      ],
      bullets: ['出生時間 + 起運間隔 = 第一柱實際起運日期時間。', '第一柱起運後，每滿十年才交入下一柱。'],
    },
    {
      id: 6,
      type: 'content',
      title: '導師帶做：由間隔到實際起運點',
      paragraphs: [
        '假設匿名教學命例出生於 2000-01-12 09:30，已換算得起運間隔為 4 年 8 個月。第一柱不是在四歲生日開始，而是在 2004-09-12 09:30 起運。',
        '第二柱由 2014-09-12 09:30 開始。排出大運只是建立時間座標；是否有何象義，要留待後續課程再按整體結構討論。',
      ],
    },
  ],
  questionBank: [
    { id: 1, question: '排大運時，哪一柱是推出大運的起點？', options: ['年柱', '月柱', '日柱', '時柱'], correct: 1, explanation: '大運由月柱推出，但月柱本身不計入第一柱大運。' },
    { id: 2, question: '月柱丙寅順排時，第一柱大運是甚麼？', options: ['乙丑', '丁卯', '戊辰', '丙寅'], correct: 1, explanation: '順排要讓天干與地支各向後推一位：丙→丁、寅→卯。' },
    { id: 3, question: '月柱丙寅逆排時，第一柱大運是甚麼？', options: ['乙丑', '丁卯', '丙寅', '甲子'], correct: 0, explanation: '逆排要讓天干與地支各向前推一位：丙→乙、寅→丑。' },
    { id: 4, question: '甲年男命按本課口徑應怎樣排大運？', options: ['順排', '逆排', '不需排大運', '只排地支'], correct: 0, explanation: '甲為陽年干；陽男採順排。' },
    { id: 5, question: '乙年女命按本課口徑應怎樣排大運？', options: ['順排', '逆排', '只看月令', '由日柱推出'], correct: 0, explanation: '乙為陰年干；陰女採順排。' },
    { id: 6, question: '順排計算起運間隔時，應由出生時刻量至哪裡？', options: ['上一個節', '下一個節', '下一個氣', '下一個生日'], correct: 1, explanation: '本課採用以「節」為準的口徑：順排量至下一個節，逆排量至上一個節。' },
    { id: 7, question: '以三日作一年換算，15 日的起運間隔約為多少？', options: ['3 年', '4 年', '5 年', '15 年'], correct: 2, explanation: '15 ÷ 3 = 5，所以換算為約 5 年的起運間隔。' },
    { id: 8, question: '出生於 2000-01-12 09:30，起運間隔為 4 年 8 個月；第一柱何時開始？', options: ['2004-01-12 09:30', '2004-09-12 09:30', '2005-01-12 09:30', '2000-09-12 09:30'], correct: 1, explanation: '要把換算後的起運間隔加回出生日期時間，不能只把它看作某個整歲生日。' },
    { id: 9, question: '第一柱於 2004-09-12 09:30 開始，第二柱約何時開始？', options: ['2008-09-12 09:30', '2010-09-12 09:30', '2014-09-12 09:30', '2024-09-12 09:30'], correct: 2, explanation: '本課每一柱代表十年，因此第二柱由第一柱起運點十年後開始。' },
    { id: 10, question: '以下哪句最符合第 8 課的學習邊界？', options: ['排出大運便可直接判定人生吉凶', '大運只需按整歲生日開始', '排大運先建立時間座標，象義需回到整體結構再談', '每個人都在同一歲數起運'], correct: 2, explanation: '本課先教可驗證的排法與時間座標；個別象義不能脫離全局而直接下結論。' },
  ],
  trueFalseBank: [
    { id: 1, question: '大運由月柱推出，但月柱本身不計入第一柱大運。', correct: true, explanation: '正確。月柱是起點，第一柱由月柱按順逆移動一位後得出。' },
    { id: 2, question: '陽年男命與陽年女命都一定順排。', correct: false, explanation: '錯誤。陽男順排，陽女逆排；還要配合性別判斷。' },
    { id: 3, question: '順排或逆排時，天干與地支都要同步移動。', correct: true, explanation: '正確。大運柱是完整干支，不能只推天干或只推地支。' },
    { id: 4, question: '三日一歲代表每個人都會在整歲生日當天起運。', correct: false, explanation: '錯誤。它是把出生至相關節的時間差換成間隔；間隔要加回出生日期時間才得出實際起運點。' },
    { id: 5, question: '按本課口徑，一柱大運代表十年。', correct: true, explanation: '正確。第一柱的實際起運點確定後，後續各柱每十年交替。' },
    { id: 6, question: '順排找下一個節；逆排找上一個節。', correct: true, explanation: '正確。方向決定要量向未來還是向過去的節氣距離。' },
    { id: 7, question: '排出大運時間柱後，就不必再看原局結構。', correct: false, explanation: '錯誤。排運只建立時間座標；後續判讀仍須回到原局與整體結構。' },
  ],
  matchBank: [
    { id: 1, prompt: '配對年干與陰陽', pairs: [{ left: '甲', right: '陽干' }, { left: '乙', right: '陰干' }, { left: '戊', right: '陽干' }, { left: '辛', right: '陰干' }] },
    { id: 2, prompt: '配對命例組合與排法', pairs: [{ left: '陽男', right: '順排' }, { left: '陽女', right: '逆排' }, { left: '陰男', right: '逆排' }, { left: '陰女', right: '順排' }] },
    { id: 3, prompt: '配對排大運流程', pairs: [{ left: '月柱', right: '推出第一柱的起點' }, { left: '相關節的時間差', right: '換算起運間隔' }, { left: '出生日期時間 + 起運間隔', right: '第一柱實際起運點' }, { left: '第一柱起運點 + 10 年', right: '第二柱開始時間' }] },
  ],
  content: `
    <h2>排大運：由月柱推演時間節奏</h2>
    <p>大運是把出生後時間切成十年一段的干支座標。本課先學排法，暫不為任何個人判吉凶。</p>
    <h3>四步工作流</h3>
    <ul>
      <li><strong>月柱作起點：</strong>月柱不計入第一柱，按順逆推得下一柱或上一柱。</li>
      <li><strong>判順逆：</strong>陽男陰女順排；陰男陽女逆排。</li>
      <li><strong>算間隔：</strong>依出生時刻至相關「節」的距離，以三日作一年換算。</li>
      <li><strong>定日期：</strong>把起運間隔加回出生日期時間，才得到第一柱實際起運點。</li>
    </ul>
    <h3>一分鐘心法</h3>
    <ul>
      <li>先定月柱，後判順逆。</li>
      <li>先算起運間隔，才加回出生時刻。</li>
      <li>每柱十年；排運是時間座標，不是人生判決。</li>
    </ul>
  `,
  duration: 24,
};
