import fs from "node:fs";
import path from "node:path";

type RawManifestItem = {
  question: number;
  kind: "body" | "option";
  file: string;
  page: number;
  rect: [number, number, number, number];
  optionIndex?: number | null;
};

type RawManifest = {
  cert: string;
  date: string;
  source: string;
  items: RawManifestItem[];
};

export type QuestionImages = {
  body: string[];
  options: Partial<Record<1 | 2 | 3 | 4, string[]>>;
};

type Index = {
  cert: string;
  date: string;
  byQuestion: Map<number, QuestionImages>;
};

const indexCache = new Map<string, Index | null>();

function parsePdfUrl(pdfUrl: string | null): { cert: string; date: string } | null {
  if (!pdfUrl) return null;
  const m = pdfUrl.match(/\/exam-pdfs\/([^/]+)\/(\d{8})\.pdf$/);
  if (!m) return null;
  return { cert: m[1], date: m[2] };
}

function loadIndex(cert: string, date: string): Index | null {
  const key = `${cert}/${date}`;
  if (indexCache.has(key)) return indexCache.get(key) ?? null;

  const manifestPath = path.resolve(
    process.cwd(),
    `public/exam-images/${cert}/${date}/manifest.json`,
  );

  let raw: RawManifest;
  try {
    const txt = fs.readFileSync(manifestPath, "utf8");
    raw = JSON.parse(txt) as RawManifest;
  } catch {
    indexCache.set(key, null);
    return null;
  }

  const byQuestion = new Map<number, QuestionImages>();
  const urlBase = `/exam-images/${cert}/${date}`;

  for (const item of raw.items) {
    const entry =
      byQuestion.get(item.question) ??
      ({ body: [], options: {} } satisfies QuestionImages);

    const url = `${urlBase}/${item.file}`;
    if (item.kind === "body") {
      entry.body.push(url);
    } else if (
      item.kind === "option" &&
      item.optionIndex != null &&
      item.optionIndex >= 1 &&
      item.optionIndex <= 4
    ) {
      const idx = item.optionIndex as 1 | 2 | 3 | 4;
      const existing = entry.options[idx] ?? [];
      existing.push(url);
      entry.options[idx] = existing;
    }

    byQuestion.set(item.question, entry);
  }

  const index: Index = { cert, date, byQuestion };
  indexCache.set(key, index);
  return index;
}

export function getQuestionImages(
  pdfUrl: string | null,
  questionNumber: number,
): QuestionImages | null {
  const parsed = parsePdfUrl(pdfUrl);
  if (!parsed) return null;
  const idx = loadIndex(parsed.cert, parsed.date);
  if (!idx) return null;
  return idx.byQuestion.get(questionNumber) ?? null;
}

export function hasManifest(pdfUrl: string | null): boolean {
  const parsed = parsePdfUrl(pdfUrl);
  if (!parsed) return false;
  return loadIndex(parsed.cert, parsed.date) !== null;
}

export function listAllQuestionImages(
  pdfUrl: string | null,
): Array<{ question: number; images: QuestionImages }> {
  const parsed = parsePdfUrl(pdfUrl);
  if (!parsed) return [];
  const idx = loadIndex(parsed.cert, parsed.date);
  if (!idx) return [];
  return Array.from(idx.byQuestion.entries())
    .sort(([a], [b]) => a - b)
    .map(([question, images]) => ({ question, images }));
}
