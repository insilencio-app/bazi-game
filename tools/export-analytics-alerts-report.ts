import fs from 'node:fs';
import path from 'node:path';
import { createDatabase, loadAnalyticsAlerts, type AnalyticsAlertRow } from '../server/db';

type CliOptions = {
  userId?: string;
  weakAccuracyThreshold: number;
  weakAttemptsThreshold: number;
  overusedExposureThreshold: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const reportPath = path.join(process.cwd(), 'content', 'exports', 'analytics-alerts.latest.md');

const categoryLabel: Record<AnalyticsAlertRow['category'], string> = {
  'classical-modern-confusion': '古典用神 vs 現代喜用神混淆',
  'ten-god-structure-misread': '十神名稱會但結構誤讀',
  'weak-question': '弱題（低正確率）',
  'overused-question': '過度曝光題',
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const readArg = (name: string): string | undefined => {
    const idx = args.findIndex((arg) => arg === name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const userId = readArg('--userId')?.trim();
  const weakAccuracyThreshold = clamp(Number(readArg('--weakAccuracyThreshold') ?? 60), 0, 100);
  const weakAttemptsThreshold = clamp(Number(readArg('--weakAttemptsThreshold') ?? 8), 1, 10000);
  const overusedExposureThreshold = clamp(Number(readArg('--overusedExposureThreshold') ?? 40), 1, 1000000);

  return {
    userId: userId && userId.length > 0 ? userId : undefined,
    weakAccuracyThreshold,
    weakAttemptsThreshold,
    overusedExposureThreshold,
  };
};

const run = () => {
  const options = parseArgs();
  const db = createDatabase();

  try {
    const alerts = loadAnalyticsAlerts(db, {
      userId: options.userId,
      weakAccuracyThreshold: options.weakAccuracyThreshold,
      weakAttemptsThreshold: options.weakAttemptsThreshold,
      overusedExposureThreshold: options.overusedExposureThreshold,
    });

    const counts = alerts.reduce(
      (acc, alert) => {
        acc[alert.category] += 1;
        return acc;
      },
      {
        'classical-modern-confusion': 0,
        'ten-god-structure-misread': 0,
        'weak-question': 0,
        'overused-question': 0,
      } as Record<AnalyticsAlertRow['category'], number>
    );

    const lines = [
      '# Analytics Alerts Report',
      '',
      `- generatedAt: ${new Date().toISOString()}`,
      `- userId: ${options.userId ?? 'all'}`,
      `- weakAccuracyThreshold: ${options.weakAccuracyThreshold}`,
      `- weakAttemptsThreshold: ${options.weakAttemptsThreshold}`,
      `- overusedExposureThreshold: ${options.overusedExposureThreshold}`,
      `- totalAlerts: ${alerts.length}`,
      '',
      '## Category Summary',
      '',
      `- ${categoryLabel['classical-modern-confusion']}: ${counts['classical-modern-confusion']}`,
      `- ${categoryLabel['ten-god-structure-misread']}: ${counts['ten-god-structure-misread']}`,
      `- ${categoryLabel['weak-question']}: ${counts['weak-question']}`,
      `- ${categoryLabel['overused-question']}: ${counts['overused-question']}`,
      '',
      '## Alerts',
      '',
      '| Category | Lesson | Question ID | Accuracy | Attempts | Exposure |',
      '| --- | --- | --- | --- | --- | --- |',
      ...alerts.map(
        (alert) =>
          `| ${categoryLabel[alert.category]} | ${alert.lessonId} ${alert.lessonTitle.replaceAll('|', '\\|')} | ${alert.questionId} | ${alert.accuracyPercent}% | ${alert.attempts} | ${alert.totalExposure} |`
      ),
      '',
    ];

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

    console.log(`Alerts report generated: ${reportPath}`);
    console.log(`totalAlerts=${alerts.length}`);
  } finally {
    db.close();
  }
};

run();
