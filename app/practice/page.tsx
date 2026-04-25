import { redirect } from "next/navigation";
import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";
import { startAttempt } from "@/lib/actions/attempts";

const VALID_MODES = [
  "sequence",
  "random",
  "wrong",
  "cbt",
  "practice",
  "mock",
  "daily",
] as const;

type Mode = (typeof VALID_MODES)[number];

export default async function PracticeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    subject?: string;
    exam?: string;
    mode?: string;
  }>;
}) {
  const sp = await searchParams;

  if (!sp.category) {
    return <ErrorScreen message="시험 종목이 지정되지 않았어요." />;
  }
  if (!sp.mode || !VALID_MODES.includes(sp.mode as Mode)) {
    return <ErrorScreen message="풀이 모드가 올바르지 않아요." />;
  }

  let attemptId: string;
  try {
    const result = await startAttempt({
      categorySlug: sp.category,
      subjectSlug: sp.subject,
      examSlug: sp.exam,
      mode: sp.mode as Mode,
    });
    attemptId = result.attemptId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "세션을 시작할 수 없습니다.";
    return <ErrorScreen message={msg} />;
  }

  redirect(`/practice/${attemptId}`);
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Session error
      </p>
      <h1 className="mt-4 text-[24px] font-bold tracking-[-0.02em] text-text-high">
        {message}
      </h1>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
      >
        <NavArrowLeft className="h-4 w-4" strokeWidth={2} />
        홈으로
      </Link>
    </div>
  );
}
