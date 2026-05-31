// 3D프린터 임시 버전 — 진도/오답/북마크/메모를 브라우저 localStorage 에 저장.
// DB(Prisma) 를 전혀 쓰지 않음. questionId 는 JSON 콘텐츠의 문자열 id.

const K = {
  attempts: "passpop:3dp:attempts:v1",
  bookmarks: "passpop:3dp:bookmarks:v1",
  notes: "passpop:3dp:notes:v1",
} as const;

export type LocalRecord = {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSec: number;
  flagged: boolean;
  confidence: "GUESS" | "UNSURE" | "CONFIDENT" | null;
};

export type LocalAttempt = {
  id: string;
  plannedQuestionIds: string[];
  label: string;
  createdAt: number;
  finishedAt: number | null;
  score: number | null;
  records: LocalRecord[];
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — 무시 */
  }
}

function newId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  const uuid = c?.randomUUID?.();
  return "local-" + (uuid ?? `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`);
}

// ── Attempts ──
export function createLocalAttempt(
  plannedQuestionIds: string[],
  label: string,
): string {
  const id = newId();
  const attempts = read<Record<string, LocalAttempt>>(K.attempts, {});
  attempts[id] = {
    id,
    plannedQuestionIds,
    label,
    createdAt: Date.now(),
    finishedAt: null,
    score: null,
    records: [],
  };
  write(K.attempts, attempts);
  return id;
}

export function getLocalAttempt(id: string): LocalAttempt | null {
  return read<Record<string, LocalAttempt>>(K.attempts, {})[id] ?? null;
}

export function finishLocalAttempt(
  id: string,
  records: LocalRecord[],
): { correctCount: number; total: number; score: number } {
  const attempts = read<Record<string, LocalAttempt>>(K.attempts, {});
  const att = attempts[id];
  const correctCount = records.filter((r) => r.isCorrect).length;
  const total = records.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  if (att) {
    att.records = records;
    att.finishedAt = Date.now();
    att.score = score;
    write(K.attempts, attempts);
  }
  return { correctCount, total, score };
}

// ── Bookmarks ──
export function getLocalBookmarks(): string[] {
  return read<string[]>(K.bookmarks, []);
}
export function toggleLocalBookmark(questionId: string): { bookmarked: boolean } {
  const set = new Set(getLocalBookmarks());
  let bookmarked: boolean;
  if (set.has(questionId)) {
    set.delete(questionId);
    bookmarked = false;
  } else {
    set.add(questionId);
    bookmarked = true;
  }
  write(K.bookmarks, [...set]);
  return { bookmarked };
}

// ── Notes ──
export function getLocalNotes(): Record<string, string> {
  return read<Record<string, string>>(K.notes, {});
}
export function saveLocalNote(questionId: string, content: string): void {
  const notes = getLocalNotes();
  if (content.trim()) notes[questionId] = content;
  else delete notes[questionId];
  write(K.notes, notes);
}

// ── Derived: 오답 문제 id (최근 푼 것 우선, 중복 제거) ──
export function getLocalMistakeIds(): string[] {
  const attempts = read<Record<string, LocalAttempt>>(K.attempts, {});
  const finished = Object.values(attempts)
    .filter((a) => a.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of finished) {
    for (const r of a.records) {
      // 미응답(빈 답)·정답은 오답노트에서 제외
      if (r.isCorrect || r.userAnswer.trim() === "" || seen.has(r.questionId))
        continue;
      seen.add(r.questionId);
      out.push(r.questionId);
    }
  }
  return out;
}
