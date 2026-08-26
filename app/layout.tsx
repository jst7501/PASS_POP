import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { LogoMark } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
  ORG_INFO,
  GA_MEASUREMENT_ID,
  absoluteUrl,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  classification: "Education / Exam Preparation",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ko-KR": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — 자격증·공무원 시험 올인원 학습 플랫폼`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
    creator: "@passpop",
    site: "@passpop",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  verification: {
    google: "AIRz6AnqF7sf3Hn2E3aurJbjqW0sL2LDjtNnC5qb5NM",
    other: {
      "naver-site-verification": "aaee194d9b66b14ccda4d054e96c68900681557d",
    },
  },
  other: {
    // theme-color 는 아래 viewport.themeColor 가 라이트/다크로 내보낸다.
    // 여기서 또 선언하면 meta 가 두 개 나가고 값도 어긋난다.
    "msapplication-TileColor": "#047857",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFCFD" },
    { media: "(prefers-color-scheme: dark)", color: "#111517" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaEnabled =
    process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);

  // 루트 JSON-LD: Organization + WebSite (SearchAction) + EducationalOrganization
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: ORG_INFO.name,
    legalName: ORG_INFO.legalName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: ORG_INFO.logo,
      width: 512,
      height: 512,
    },
    sameAs: ORG_INFO.sameAs,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: ORG_INFO.contactPoint.contactType,
        email: ORG_INFO.contactPoint.email,
        availableLanguage: ORG_INFO.contactPoint.availableLanguage,
      },
    ],
  } as const;

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  } as const;

  const eduOrgLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#educational-organization`,
    name: ORG_INFO.name,
    url: SITE_URL,
    logo: ORG_INFO.logo,
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
    areaServed: { "@type": "Country", name: "Republic of Korea" },
  } as const;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Search Console 소유권 확인 — 절대 삭제 금지 */}
        <meta
          name="google-site-verification"
          content="AIRz6AnqF7sf3Hn2E3aurJbjqW0sL2LDjtNnC5qb5NM"
        />
        {/* Naver 서치어드바이저 소유권 확인 — 절대 삭제 금지 */}
        <meta
          name="naver-site-verification"
          content="aaee194d9b66b14ccda4d054e96c68900681557d"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {gaEnabled && (
          <link rel="preconnect" href="https://www.googletagmanager.com" />
        )}
        {/* 스크롤 리빌은 JS 로 보이게 만든다. JS 가 죽으면 본문이 통째로
            안 보이므로 여기서 되돌린다 (크롤러는 JS 를 실행하므로 영향 없음). */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-background text-text-high antialiased">
        <JsonLd data={[orgLd, websiteLd, eduOrgLd]} />

        {/* GA4 — afterInteractive 로 두어 첫 렌더를 막지 않는다.
            개발 중에는 넣지 않는다. 로컬 클릭이 운영 지표에 섞이면 안 된다. */}
        {gaEnabled && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
        >
          본문 바로가기
        </a>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <LandingFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}


function LandingFooter() {
  return (
    <footer className="border-t border-border-soft bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7 text-primary" />
            <div>
              <p className="text-sm font-bold tracking-[-0.01em] text-text-high">
                {SITE_NAME}
              </p>
              <p className="text-2xs text-text-muted">
                자격증·공무원 시험 올인원 — 무료 CBT + 프리미엄 해설
              </p>
            </div>
          </div>
          <p className="text-2xs text-text-muted">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
        <p className="mt-6 text-2xs leading-[1.6] text-text-muted">
          {SITE_NAME}은 학습을 돕는 도구예요. 한국산업인력공단·인사혁신처 등
          공식 시험 시행 기관과는 관계가 없어요.
        </p>
      </div>
    </footer>
  );
}
