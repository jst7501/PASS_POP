"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  NavArrowLeft,
  NavArrowRight,
  Bookmark,
  BookmarkSolid,
  Clock,
  Check,
  EditPencil,
  Xmark,
} from "iconoir-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { submitAttempt } from "@/lib/actions/attempts";
import {
  toggleBookmark,
  saveQuestionNote,
} from "@/lib/actions/user-actions";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 12; // 이 거리 이상 손가락이 움직이면 스크롤로 간주
type Conf = "UNSURE" | "CONFIDENT";

type ExplEntry = {
  wrongChoice: string | null;
  html: string;
  memoryHook: string | null;
};

type QuestionImages = {
  body: string[];
  options: Partial<Record<1 | 2 | 3 | 4, string[]>>;
};

type Question = {
  id: string;
  number: number;
  stem: string;
  choices: { label: string; text: string }[];
  hasMath: boolean;
  subject: { name: string; slug: string };
  images?: QuestionImages | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  // 연습모드 전용 — 실전 CBT에서는 undefined
  correctAnswer?: string;
  explanations?: ExplEntry[];
};

type SubmitPayload = {
  questionId: string;
  userAnswer: string;
  timeSpentSec: number;
  flagged: boolean;
  confidence: "GUESS" | "UNSURE" | "CONFIDENT" | null;
};

type Props = {
  attemptId: string;
  questions: Question[];
  categoryName: string;
  durationMin: number | null;
  /** 초기 북마크된 문제 id 셋 */
  initialBookmarks?: string[];
  /** 초기 노트 (questionId → content) */
  initialNotes?: Record<string, string>;
  /** 로컬(localStorage) 모드 주입 — 없으면 서버 액션 사용 */
  onSubmit?: (attemptId: string, payload: SubmitPayload[]) => Promise<void> | void;
  onToggleBookmark?: (questionId: string) => Promise<{ bookmarked: boolean }>;
  onSaveNote?: (questionId: string, content: string) => Promise<void> | void;
  resultHref?: string;
};

export function PracticeSession({
  attemptId,
  questions,
  categoryName,
  durationMin,
  initialBookmarks,
  initialNotes,
  onSubmit,
  onToggleBookmark,
  onSaveNote,
  resultHref,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(
    () => new Set(initialBookmarks ?? []),
  );
  const [bookmarkPending, setBookmarkPending] = useState<Set<string>>(
    () => new Set(),
  );
  const [confidence, setConfidence] = useState<Record<string, Conf>>({});
  const [notes, setNotes] = useState<Record<string, string>>(
    () => initialNotes ?? {},
  );
  const [noteOpen, setNoteOpen] = useState(false);
  const [timeAcc, setTimeAcc] = useState<Record<string, number>>({});
  const [qStart, setQStart] = useState<number>(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  // long-press 추적
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longTriggered = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const moveCancelled = useRef(false);
  // 노트 자동저장 (parent 가 flush 책임)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteDirty = useRef<{ id: string; content: string } | null>(null);
  const noteFocused = useRef(false);
  const [noteFocusedFlag, setNoteFocusedFlag] = useState(false);

  const initialSec = durationMin != null ? durationMin * 60 : 0;
  const [remainingSec, setRemainingSec] = useState(initialSec);

  const current = questions[index];
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim()).length,
    [answers],
  );

  // 연습모드: 첫 문제에 correctAnswer가 내려오면 실시간 채점 모드
  const isPractice =
    questions.length > 0 && questions[0].correctAnswer !== undefined;

  useEffect(() => {
    if (durationMin == null) return;
    const t = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          triggerSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMin]);

  const flushTime = (id: string | undefined) => {
    if (!id) return;
    const now = Date.now();
    const delta = Math.max(0, Math.floor((now - qStart) / 1000));
    setTimeAcc((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + delta }));
    setQStart(now);
  };

  const selectChoice = (value: string, conf: Conf) => {
    if (!current) return;
    flushTime(current.id);
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setConfidence((prev) => ({ ...prev, [current.id]: conf }));
  };

  // long-press / short-tap 통합 핸들러 + 스크롤 제스처 감지
  const onChoicePointerDown = (
    value: string,
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    longTriggered.current = false;
    moveCancelled.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      if (moveCancelled.current) return;
      longTriggered.current = true;
      selectChoice(value, "UNSURE"); // 길게 = 고민
    }, LONG_PRESS_MS);
  };
  const onChoicePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pressStart.current || moveCancelled.current) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      moveCancelled.current = true;
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    }
  };
  const onChoicePointerUp = (value: string) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressStart.current = null;
    // long-press 도 아니고, 스크롤 제스처도 아니면 → short tap = 확신
    if (!longTriggered.current && !moveCancelled.current) {
      selectChoice(value, "CONFIDENT");
    }
  };
  const onChoicePointerCancel = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressStart.current = null;
    moveCancelled.current = true; // cancel 도 selection 안 함
  };

  // 노트 — parent 가 debounce + flush 책임
  const flushNote = () => {
    if (noteTimer.current) {
      clearTimeout(noteTimer.current);
      noteTimer.current = null;
    }
    if (!noteDirty.current) return;
    const { id, content } = noteDirty.current;
    noteDirty.current = null;
    void Promise.resolve((onSaveNote ?? saveQuestionNote)(id, content)).catch(
      () => null,
    );
  };
  const queueSaveNote = (content: string) => {
    if (!current) return;
    const id = current.id;
    setNotes((prev) => ({ ...prev, [id]: content }));
    noteDirty.current = { id, content };
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(flushNote, 600);
  };
  // 언마운트 시 강제 flush
  useEffect(() => {
    return () => {
      flushNote();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onNoteFocus = () => {
    noteFocused.current = true;
    setNoteFocusedFlag(true);
  };
  const onNoteBlur = () => {
    noteFocused.current = false;
    setNoteFocusedFlag(false);
    flushNote();
  };

  const toggleFlag = () => {
    if (!current) return;
    const id = current.id;
    // Optimistic UI
    const wasFlagged = flagged.has(id);
    setFlagged((prev) => {
      const next = new Set(prev);
      if (wasFlagged) next.delete(id);
      else next.add(id);
      return next;
    });
    setBookmarkPending((prev) => new Set(prev).add(id));

    // 저장 반영 (실패 시 롤백)
    void (onToggleBookmark ?? toggleBookmark)(id)
      .then((res) => {
        setFlagged((prev) => {
          const next = new Set(prev);
          if (res.bookmarked) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .catch(() => {
        setFlagged((prev) => {
          const next = new Set(prev);
          if (wasFlagged) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .finally(() => {
        setBookmarkPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  };

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length || i === index) return;
    flushNote(); // 페이지 이동 전 노트 flush
    flushTime(current?.id);
    setIndex(i);
    setNoteOpen(false);
  };

  const triggerSubmit = () => {
    flushNote(); // 제출 전 노트 flush
    flushTime(current?.id);

    const payload = questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id] ?? "",
      timeSpentSec: timeAcc[q.id] ?? 0,
      flagged: flagged.has(q.id),
      confidence: (confidence[q.id] ?? null) as
        | "GUESS"
        | "UNSURE"
        | "CONFIDENT"
        | null,
    }));

    startTransition(async () => {
      if (onSubmit) await onSubmit(attemptId, payload);
      else await submitAttempt(attemptId, payload);
      router.push(resultHref ?? `/practice/${attemptId}/result`);
    });
  };

  if (!current) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <p className="text-text-mid">문제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-text-muted">
              {categoryName}
              {current.subject?.name && <> · {current.subject.name}</>}
            </p>
            <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums">
              <span className="text-text-high">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-text-muted">
                {" "}
                / {String(questions.length).padStart(2, "0")}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {durationMin != null && (
              <TimerBadge remainingSec={remainingSec} total={initialSec} />
            )}
          </div>
        </div>
        <div className="h-[2px] w-full bg-border-soft">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_260px]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] font-semibold tracking-wider text-text-muted">
                Q.{String(current.number).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNoteOpen((v) => !v)}
                  aria-pressed={noteOpen}
                  aria-label="메모"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-text-mid transition-colors hover:text-text-high",
                    notes[current.id] && "border-primary/40 text-primary",
                  )}
                >
                  <EditPencil className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={toggleFlag}
                  aria-pressed={flagged.has(current.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-text-mid transition-colors hover:text-text-high"
                >
                  {flagged.has(current.id) ? (
                    <BookmarkSolid className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" strokeWidth={2} />
                  )}
                  <span className="hidden sm:inline">
                    {flagged.has(current.id) ? "표시됨" : "나중에"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5 whitespace-pre-wrap text-[17px] leading-[1.75] text-text-high md:text-[18px]">
              <MathText text={current.stem} />
            </div>

            {current.imageUrl && (
              <div className="mt-5 overflow-hidden rounded-md border border-border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt={current.imageAlt ?? ""}
                  className="mx-auto max-h-72 w-auto"
                />
              </div>
            )}

            {/* 베타 알림 — 옛 attempt 에 그림 문제가 남아있는 경우 보일 수 있음 */}
            {((current.images?.body?.length ?? 0) > 0 ||
              Object.values(current.images?.options ?? {}).some(
                (a) => (a?.length ?? 0) > 0,
              )) && (
              <div className="mt-5 rounded-md border border-warning/30 bg-warning/[0.05] px-3.5 py-2.5 text-[12.5px] text-text-mid">
                이 문제는 그림이 포함되어 있어요. 베타에서 그림 매칭 정밀도가
                낮아 그림 표시는 잠시 보류 중이에요.
              </div>
            )}

            <ul className="mt-8 space-y-2.5">
              {current.choices.map((c, i) => {
                const value = String(i + 1);
                const userAnswer = answers[current.id];
                const isSelected = userAnswer === value;
                const answered = !!userAnswer;
                // 연습모드 + 답 선택 후 정오 표시
                const showResult = isPractice && answered;
                const isThisCorrect =
                  showResult && value === current.correctAnswer;
                const isThisWrongPick =
                  showResult && isSelected && !isThisCorrect;
                const isMissedCorrect =
                  showResult && value === current.correctAnswer && !isSelected;

                let containerCls =
                  "border-border bg-surface text-text-mid hover:border-primary/30 hover:bg-surface-elev hover:text-text-high";
                let badgeCls = "bg-surface-mute text-text-mid";

                if (showResult) {
                  if (isThisCorrect) {
                    containerCls =
                      "border-accent bg-accent/10 text-text-high";
                    badgeCls = "bg-accent text-white";
                  } else if (isThisWrongPick) {
                    containerCls =
                      "border-danger bg-danger/10 text-text-high";
                    badgeCls = "bg-danger text-white";
                  } else if (isMissedCorrect) {
                    containerCls =
                      "border-accent/50 bg-accent/5 text-text-mid";
                    badgeCls = "bg-accent/70 text-white";
                  } else {
                    containerCls =
                      "border-border bg-surface text-text-muted";
                  }
                } else if (isSelected) {
                  containerCls =
                    "border-primary bg-primary-subtle text-text-high";
                  badgeCls = "bg-primary text-primary-fg";
                }

                const showUnsure =
                  isSelected &&
                  confidence[current.id] === "UNSURE" &&
                  !showResult;
                return (
                  <li key={c.label}>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        onChoicePointerDown(value, e);
                      }}
                      onPointerMove={onChoicePointerMove}
                      onPointerUp={() => {
                        onChoicePointerUp(value);
                      }}
                      onPointerLeave={onChoicePointerCancel}
                      onPointerCancel={onChoicePointerCancel}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ touchAction: "manipulation" }}
                      className={cn(
                        "flex w-full select-none items-start gap-3 rounded-md border px-4 py-3.5 text-left transition-all",
                        containerCls,
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold",
                          badgeCls,
                        )}
                      >
                        {c.label}
                      </span>
                      <span className="flex-1 text-[15px] leading-[1.6]">
                        {c.text && c.text.trim() && (
                          <MathText text={c.text} />
                        )}
                      </span>
                      {isThisCorrect && (
                        <Check
                          className="mt-1 h-4 w-4 shrink-0 text-accent"
                          strokeWidth={2.5}
                        />
                      )}
                      {!showResult && isSelected && (
                        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1">
                          {showUnsure && (
                            <span className="rounded-sm bg-warning/20 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-warning">
                              고민
                            </span>
                          )}
                          <Check
                            className="h-4 w-4 text-primary"
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* 답 한 번 안 골랐을 때 long-press 안내 */}
            {!answers[current.id] && (
              <p className="mt-3 text-[11.5px] text-text-muted">
                <span className="rounded-sm bg-surface-mute px-1.5 py-0 text-[10px] font-medium text-text-mid">
                  Tip
                </span>{" "}
                답에 자신 있으면 짧게 탭, 고민되면 길게 눌러 표시.
              </p>
            )}

            {/* 노트 패널 — 헤더 버튼으로 토글 */}
            <NotePanel
              open={noteOpen}
              value={notes[current.id] ?? ""}
              onChange={queueSaveNote}
              onClose={() => {
                flushNote();
                setNoteOpen(false);
              }}
              onFocus={onNoteFocus}
              onBlur={onNoteBlur}
            />

            {/* 연습모드: 답 선택 즉시 해설 노출 (오답이면 선택한 번호에 맞는 해설, 없으면 general 폴백) */}
            {isPractice && answers[current.id] && (
              <PracticeExplanation
                correct={answers[current.id] === current.correctAnswer}
                correctAnswer={current.correctAnswer!}
                userAnswer={answers[current.id]!}
                explanations={current.explanations ?? []}
              />
            )}

            {/* 모바일에선 sticky bar 가 대신함 — 데스크톱에서만 inline */}
            <div className="mt-10 hidden items-center justify-between gap-3 md:flex">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="inline-flex h-11 items-center gap-1 rounded-md border border-border bg-surface px-4 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high disabled:opacity-40"
              >
                <NavArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                이전
              </button>

              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="inline-flex h-11 items-center gap-1 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
                >
                  다음
                  <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex h-11 items-center gap-1 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
                >
                  제출하기
                </button>
              )}
            </div>

            {/* 모바일 하단 여백 — sticky bar 자리 */}
            <div className="h-20 md:hidden" />
          </div>

          <aside className="order-first md:order-last md:sticky md:top-40 md:self-start">
            <div className="rounded-md border border-border bg-surface p-4 md:p-5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <span>문항 이동</span>
                <span className="font-mono tabular-nums">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-8 gap-1.5 md:grid-cols-5">
                {questions.map((q, i) => {
                  const state = getCellState(
                    i === index,
                    answers[q.id],
                    flagged.has(q.id),
                  );
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-lg font-mono text-[12px] font-semibold tabular-nums transition-colors",
                        state === "current" &&
                          "bg-primary text-primary-fg ring-2 ring-primary/30",
                        state === "answered" &&
                          "bg-primary/15 text-primary hover:bg-primary/25",
                        state === "flagged" &&
                          "bg-surface-elev text-text-mid ring-1 ring-inset ring-primary/40",
                        state === "pending" &&
                          "bg-surface-elev text-text-muted hover:bg-surface-mute",
                      )}
                    >
                      {i + 1}
                      {flagged.has(q.id) && state !== "current" && (
                        <span className="absolute right-1 top-0.5 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-text-muted">
                <LegendDot className="bg-primary" label="현재" />
                <LegendDot className="bg-primary/30" label="답함" />
                <LegendDot
                  className="bg-surface-elev ring-1 ring-inset ring-primary/40"
                  label="표시"
                />
                <LegendDot className="bg-surface-elev" label="미응답" />
              </div>

              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-surface text-[13px] font-semibold text-text-mid transition-colors hover:bg-surface-mute hover:text-text-high"
              >
                제출 확인
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* 모바일 sticky bottom bar — 노트 포커스 시 숨김 (iOS 키보드 충돌 방지) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm md:hidden",
          noteFocusedFlag && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-mid disabled:opacity-40"
            aria-label="이전 문제"
          >
            <NavArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div className="flex-1 text-center text-[11px] font-medium tabular-nums text-text-muted">
            <span className="text-text-high">{index + 1}</span>
            <span> / {questions.length}</span>
          </div>
          {index < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="inline-flex h-11 flex-[2] items-center justify-center gap-1 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg"
            >
              다음
              <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex h-11 flex-[2] items-center justify-center gap-1 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg"
            >
              제출하기
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          total={questions.length}
          answered={answeredCount}
          flaggedCount={flagged.size}
          pending={pending}
          onCancel={() => setConfirming(false)}
          onConfirm={triggerSubmit}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 풀이 중 노트 패널 — controlled by parent (parent 가 debounce·flush 담당)
// ─────────────────────────────────────────────────────────────
function NotePanel({
  open,
  value,
  onChange,
  onClose,
  onFocus,
  onBlur,
}: {
  open: boolean;
  value: string;
  onChange: (s: string) => void;
  onClose: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  // 펼치지 않았고 메모 없으면 — 헤더 버튼이 입구 역할이므로 아무것도 안 그림
  if (!open && !value) return null;

  // 펼치지 않았지만 메모는 있음 → 요약 카드만
  if (!open && value) {
    return (
      <div className="mt-5 rounded-md border border-border bg-surface px-3 py-2.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          내 메모
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.55] text-text-high">
          {value}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          메모
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-muted hover:text-text-high"
          aria-label="닫기"
        >
          <Xmark className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={3}
        placeholder="공식, 함정, 비슷한 문제 번호 — 자유롭게."
        className="mt-1 w-full resize-none rounded-sm bg-background p-2 text-[13.5px] leading-[1.55] text-text-high placeholder:text-text-muted/70 focus:outline-none"
      />
      <p className="mt-1 text-[10.5px] text-text-muted">
        자동 저장 · 다른 문제로 넘어가거나 제출하면 즉시 저장
      </p>
    </div>
  );
}

function getCellState(
  isCurrent: boolean,
  answer: string | undefined,
  isFlagged: boolean,
): "current" | "answered" | "flagged" | "pending" {
  if (isCurrent) return "current";
  if (answer && answer.trim()) return "answered";
  if (isFlagged) return "flagged";
  return "pending";
}

function PracticeExplanation({
  correct,
  correctAnswer,
  userAnswer,
  explanations,
}: {
  correct: boolean;
  correctAnswer: string;
  userAnswer: string;
  explanations: ExplEntry[];
}) {
  // 데이터 구조:
  //  - general(wrongChoice=null): 문제 전체 풀이
  //  - wrongChoice="1"~"4": 선택지별 개별 피드백 (정답 선택지 포함, "정답이에요"/"오답이에요"로 시작)
  // 표시 정책: 사용자가 고른 선택지에 매칭되는 개별 피드백을 우선 표시.
  //  general 풀이는 그 아래에 "전체 풀이 보기" 토글로 함께 제공.
  const general = explanations.find((e) => e.wrongChoice === null) ?? null;
  const userChoiceFeedback =
    explanations.find((e) => e.wrongChoice === userAnswer) ?? null;
  const main = userChoiceFeedback ?? general;
  const hasIndividual = userChoiceFeedback !== null;
  const [showGeneral, setShowGeneral] = useState(false);

  return (
    <div className="mt-6 rounded-md border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
            correct ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger",
          )}
        >
          {correct ? "정답" : "오답"}
        </span>
        <span className="text-[13px] text-text-mid">
          내 답{" "}
          <strong className="font-mono text-text-high">{userAnswer}번</strong>
          {!correct && (
            <>
              {" "}
              · 정답{" "}
              <strong className="font-mono text-accent">
                {correctAnswer}번
              </strong>
            </>
          )}
        </span>
      </div>

      {hasIndividual && !correct && (
        <p className="mt-3 text-[12px] text-text-muted">
          <strong className="text-text-mid">{userAnswer}번을 고른 분께</strong>{" "}
          맞춘 해설이에요.
        </p>
      )}

      {main ? (
        <div
          className="explanation-html mt-4"
          dangerouslySetInnerHTML={{ __html: main.html }}
        />
      ) : (
        <p className="mt-3 text-[13px] text-text-muted">
          이 문제 해설은 아직 준비 중이에요.
        </p>
      )}

      {/* 개별 피드백을 메인으로 보여줬을 때 → general 풀이도 토글로 같이 볼 수 있게 */}
      {hasIndividual && general && (
        <div className="mt-4 border-t border-border-soft pt-4">
          <button
            type="button"
            onClick={() => setShowGeneral((v) => !v)}
            aria-expanded={showGeneral}
            className="inline-flex items-center gap-1 rounded-md text-[12px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {showGeneral ? "전체 풀이 접기" : "전체 풀이 보기"}
            <NavArrowRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showGeneral ? "rotate-90" : "rotate-0",
              )}
              strokeWidth={2.5}
            />
          </button>
          {showGeneral && (
            <div
              className="explanation-html mt-3"
              dangerouslySetInnerHTML={{ __html: general.html }}
            />
          )}
        </div>
      )}

      {/* 암기 팁 — general에 있으면 항상 노출 */}
      {general?.memoryHook && (
        <p className="mt-4 border-t border-border-soft pt-3 text-[13px] leading-[1.6] text-text-mid">
          <span className="font-semibold text-primary">암기 팁 · </span>
          {general.memoryHook}
        </p>
      )}
    </div>
  );
}

function TimerBadge({
  remainingSec,
  total,
}: {
  remainingSec: number;
  total: number;
}) {
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");
  const ratio = total > 0 ? remainingSec / total : 1;
  const warn = ratio < 0.2;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[14px] font-semibold tabular-nums",
        warn
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-border bg-surface text-text-high",
      )}
    >
      <Clock className="h-4 w-4" strokeWidth={2} />
      {mm}:{ss}
    </div>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function ConfirmDialog({
  total,
  answered,
  flaggedCount,
  pending,
  onCancel,
  onConfirm,
}: {
  total: number;
  answered: number;
  flaggedCount: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const unanswered = total - answered;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-pop-lg">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-text-high">
          제출하시겠어요?
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-text-mid">
          제출 후에는 답안을 수정할 수 없어요.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-surface-mute p-4 text-center">
          <DlItem label="응답" value={answered} />
          <DlItem
            label="미응답"
            value={unanswered}
            highlight={unanswered > 0}
          />
          <DlItem label="표시" value={flaggedCount} />
        </dl>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high disabled:opacity-50"
          >
            계속 풀기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "채점 중..." : "제출하고 결과 보기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DlItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-[20px] font-bold tabular-nums",
          highlight ? "text-danger" : "text-text-high",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const math = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={math} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
