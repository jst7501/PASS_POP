/**
 * 회차 이미지 매니페스트 인덱스.
 *
 * Vercel 서버리스에서 `public/` 의 파일은 fs.readFileSync 로 읽을 수 없음
 * (CDN 정적 서빙용으로 분리됨). → 매니페스트 JSON 을 빌드 시점 import 로
 * 가져와 함수 번들에 포함시킨다. PNG 자체는 그대로 public/ 에 두고
 * <img src="/exam-images/..."> 로 CDN 에서 서빙.
 *
 * 새 회차 추가 절차:
 *  1. public/exam-images/<cert>/<date>/manifest.json 생성 (extract 스크립트)
 *  2. 아래 MANIFEST_REGISTRY 에 한 줄 추가
 */

import civilEngineerGisa20220424 from "../public/exam-images/civil-engineer-gisa/20220424/manifest.json";
import hvacRefrigerationGisa20220305 from "../public/exam-images/hvac-refrigeration-gisa/20220305/manifest.json";
import hvacRefrigerationGisa20220424 from "../public/exam-images/hvac-refrigeration-gisa/20220424/manifest.json";

type RawManifestItem = {
  question: number;
  kind: "body" | "option";
  file: string;
  page: number;
  rect: [number, number, number, number] | number[];
  optionIndex?: number | null;
};

type RawManifest = {
  cert: string;
  date: string;
  source?: string;
  items: RawManifestItem[];
};

const MANIFEST_REGISTRY: Record<string, RawManifest> = {
  "civil-engineer-gisa/20220424": civilEngineerGisa20220424 as RawManifest,
  "hvac-refrigeration-gisa/20220305":
    hvacRefrigerationGisa20220305 as RawManifest,
  "hvac-refrigeration-gisa/20220424":
    hvacRefrigerationGisa20220424 as RawManifest,
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

function parsePdfUrl(
  pdfUrl: string | null,
): { cert: string; date: string } | null {
  if (!pdfUrl) return null;
  const m = pdfUrl.match(/\/exam-pdfs\/([^/]+)\/(\d{8})\.pdf$/);
  if (!m) return null;
  return { cert: m[1], date: m[2] };
}

function loadIndex(cert: string, date: string): Index | null {
  const key = `${cert}/${date}`;
  if (indexCache.has(key)) return indexCache.get(key) ?? null;

  const raw = MANIFEST_REGISTRY[key];
  if (!raw) {
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
