import fs from 'node:fs';
import path from 'node:path';
import { mockLessons } from '../src/data/mockData';

type QuestionCategory = 'lookup' | 'diagnostic' | 'mixed';

type BucketCounts = {
  lookup: number;
  diagnostic: number;
  mixed: number;
};

const LESSON_ID = 5;
const TARGET_LOOKUP_RATIO = 1 / 3;
const reportPath = path.join(process.cwd(), 'content', 'exports', 'lesson-5-balance-audit.md');

const lookupPattern = /哪(一|個)|是什麼|對應|共有幾|通常在|屬於|哪句|哪個/;
const diagnosticPattern =
  /流程|順序|為什麼|不能|最符合|最穩健|結構|組合|透根|透干|旺衰|互動|承格|制化|判讀|全局|成格|破格|策略/;

const classify = (text: string): QuestionCategory => {
  const normalized = text.trim();
  const isLookup = lookupPattern.test(normalized);
  const isDiagnostic = diagnosticPattern.test(normalized);

  if (isDiagnostic && !isLookup) return 'diagnostic';
  if (isLookup && !isDiagnostic) return 'lookup';
  if (isDiagnostic && isLookup) return 'mixed';

  return 'mixed';
};

const formatPct = (value: number) => `${(value * 100).toFixed(1)}%`;

const run = () => {
  const lesson = mockLessons.find((item) => item.id === LESSON_ID);
  if (!lesson) {
    throw new Error(`Lesson ${LESSON_ID} not found in mockLessons.`);
  }

  const counts: BucketCounts = {
    lookup: 0,
    diagnostic: 0,
    mixed: 0,
  };

  const details: Array<{ bank: string; id: number; prompt: string; category: QuestionCategory }> = [];

  lesson.questionBank.forEach((item) => {
    const category = classify(item.question);
    counts[category] += 1;
    details.push({ bank: 'mcq', id: item.id, prompt: item.question, category });
  });

  lesson.trueFalseBank?.forEach((item) => {
    const category = classify(item.question);
    counts[category] += 1;
    details.push({ bank: 'truefalse', id: item.id, prompt: item.question, category });
  });

  lesson.matchBank?.forEach((item) => {
    const category = classify(item.prompt);
    counts[category] += 1;
    details.push({ bank: 'match', id: item.id, prompt: item.prompt, category });
  });

  const total = details.length;
  const lookupRatio = total > 0 ? counts.lookup / total : 0;
  const diagnosticRatio = total > 0 ? counts.diagnostic / total : 0;
  const mixedRatio = total > 0 ? counts.mixed / total : 0;

  const verdict = lookupRatio <= TARGET_LOOKUP_RATIO ? 'PASS' : 'FAIL';

  const lines = [
    '# Lesson 5 Assessment Balance Audit',
    '',
    `- generatedAt: ${new Date().toISOString()}`,
    `- lessonId: ${LESSON_ID}`,
    `- lessonTitle: ${lesson.title_cn}`,
    `- totalItems: ${total}`,
    `- lookup: ${counts.lookup} (${formatPct(lookupRatio)})`,
    `- diagnostic: ${counts.diagnostic} (${formatPct(diagnosticRatio)})`,
    `- mixed: ${counts.mixed} (${formatPct(mixedRatio)})`,
    `- target: lookup <= ${formatPct(TARGET_LOOKUP_RATIO)}`,
    `- verdict: ${verdict}`,
    '',
    '## Item Classification',
    '',
    '| Bank | ID | Category | Prompt |',
    '| --- | --- | --- | --- |',
    ...details.map((item) => `| ${item.bank} | ${item.id} | ${item.category} | ${item.prompt.replaceAll('|', '\\|')} |`),
    '',
  ];

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log(`Audit report generated: ${reportPath}`);
  console.log(`lookup=${counts.lookup}/${total} (${formatPct(lookupRatio)}), target<=${formatPct(TARGET_LOOKUP_RATIO)}, verdict=${verdict}`);

  if (verdict === 'FAIL') {
    process.exitCode = 1;
  }
};

run();
