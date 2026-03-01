import fs from 'node:fs';
import path from 'node:path';
import { validateImportQuestions } from '../src/content/importValidation';

const formatIssue = (issue: { index: number; code: string; message: string }) =>
  `[#${issue.index + 1}] ${issue.code} - ${issue.message}`;

const run = () => {
  const inputPathArg = process.argv[2];
  if (!inputPathArg) {
    console.error('Usage: npm run content:validate -- <path-to-json-file>');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputPathArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (error) {
    console.error(`Invalid JSON: ${(error as Error).message}`);
    process.exit(1);
  }

  const result = validateImportQuestions(parsed);

  if (result.warnings.length > 0) {
    console.warn(`Warnings: ${result.warnings.length}`);
    result.warnings.forEach((warning) => console.warn(`  ${formatIssue(warning)}`));
  }

  if (result.errors.length > 0) {
    console.error(`Errors: ${result.errors.length}`);
    result.errors.forEach((error) => console.error(`  ${formatIssue(error)}`));
    process.exit(1);
  }

  console.log(`Validation passed. Questions: ${result.normalizedQuestions.length}`);
};

run();
