"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Xmark } from "iconoir-react";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/dashboard", label: "내 기록" },
  { href: "/mistakes", label: "오답노트" },
];

export function SiteMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-text-mid transition-colors hover:text-primary md:hidden"
      >
        {open ? (
          <Xmark className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2} />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <nav
            className="animate-slide-up border-b border-border bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center rounded-xl px-4 text-[15px] font-medium text-text-high transition-colors hover:bg-surface-mute"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-xl bg-primary text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
                >
                  시험 둘러보기
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
