/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const FORBIDDEN_OPTION_PATTERNS = [/all of the above/i, /none of the above/i];
const VAGUE_PROMPT_PATTERNS = [/choose the correct sentence\.?$/i, /select the correct sentence\.?$/i];

function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:()"]/g, '')
    .replace(/\s+/g, ' ');
}

function loadDiagnosticData() {
  const sourcePath = path.resolve(__dirname, '../apps/mobile/src/data/diagnosticQuestions.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;

  const moduleRef = { exports: {} };
  const evaluator = new Function('module', 'exports', 'require', '__filename', '__dirname', transpiled);
  evaluator(moduleRef, moduleRef.exports, require, sourcePath, path.dirname(sourcePath));

  return moduleRef.exports.diagnosticQuestionsByDifficulty;
}

function checkQuestion(tier, question) {
  const findings = [];
  const id = String(question.id || 'unknown-id');
  const options = Array.isArray(question.options) ? question.options : [];
  const prompt = String(question.prompt || '').trim();
  const domain = String(question.domain || '').toLowerCase();
  const correct = Number(question.correctOption);

  if (!prompt) {
    findings.push({ severity: 'error', tier, questionId: id, message: 'Prompt is missing.' });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    findings.push({
      severity: 'error',
      tier,
      questionId: id,
      message: `Expected exactly 4 options, found ${options.length}.`
    });
  }

  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    findings.push({
      severity: 'error',
      tier,
      questionId: id,
      message: `Invalid correctOption index: ${question.correctOption}.`
    });
  }

  const normalizedOptions = options.map(normalize);
  const unique = new Set(normalizedOptions);
  if (unique.size !== normalizedOptions.length) {
    findings.push({
      severity: 'error',
      tier,
      questionId: id,
      message: 'Duplicate answer options detected.'
    });
  }

  options.forEach((option) => {
    const optionText = String(option || '');
    if (!optionText.trim()) {
      findings.push({
        severity: 'error',
        tier,
        questionId: id,
        message: 'One option is empty.'
      });
    }
    if (FORBIDDEN_OPTION_PATTERNS.some((pattern) => pattern.test(optionText))) {
      findings.push({
        severity: 'warning',
        tier,
        questionId: id,
        message: `Avoid ambiguous option: "${optionText}".`
      });
    }
  });

  if (domain === 'reading' && !String(question.passage || '').trim()) {
    findings.push({
      severity: 'error',
      tier,
      questionId: id,
      message: 'Reading question is missing passage text.'
    });
  }

  if (VAGUE_PROMPT_PATTERNS.some((pattern) => pattern.test(prompt))) {
    findings.push({
      severity: 'warning',
      tier,
      questionId: id,
      message: 'Prompt wording is generic; consider contextual wording to reduce ambiguity.'
    });
  }

  if (prompt.length < 12) {
    findings.push({
      severity: 'warning',
      tier,
      questionId: id,
      message: 'Prompt is very short; verify clarity.'
    });
  }

  return findings;
}

function main() {
  const strict = process.argv.includes('--strict');
  const data = loadDiagnosticData();
  const findings = [];

  Object.entries(data).forEach(([tier, questions]) => {
    questions.forEach((question) => {
      findings.push(...checkQuestion(tier, question));
    });
  });

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');

  if (!findings.length) {
    console.log('Diagnostic quality check: PASS (no findings)');
    process.exit(0);
  }

  console.log(`Diagnostic quality check: ${errors.length} error(s), ${warnings.length} warning(s)`);
  findings.forEach((f) => {
    console.log(`[${f.severity.toUpperCase()}] ${f.tier}/${f.questionId}: ${f.message}`);
  });

  if (errors.length > 0 || (strict && warnings.length > 0)) {
    process.exit(1);
  }

  process.exit(0);
}

main();
