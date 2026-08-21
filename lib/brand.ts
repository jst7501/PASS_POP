/**
 * PASSPOP 브랜드 마크 — 단일 원본.
 *
 * 컨셉: 합격 도장(링) 을 체크가 뚫고 나간다.
 *   - 링   = 통과해야 하는 시험. 우상단 36° 를 비워 체크가 나갈 자리를 만든다.
 *   - 체크 = 합격. 링 안에서 시작해 비워둔 자리로 빠져나간다 (= POP).
 * 링 밖으로 나가는 획이 단 하나뿐이라 16px 파비콘에서도 실루엣이 구분된다.
 *
 * 규칙:
 *   - 단색만. 그라데이션·이모지·반짝이 금지 (globals.css 와 동일 원칙).
 *   - 링과 체크는 항상 같은 두께. 두께를 바꾸면 도장 느낌이 깨진다.
 *   - 이 파일은 edge 런타임(ImageResponse/satori)에서도 import 되므로 JSX 금지.
 */

export const LOGO_VIEWBOX = "0 0 32 32";

/** 링 — -21° 에서 시작해 319° 를 돌아 -62° 에서 끊긴다. 그 사이가 체크가 나갈 틈. */
export const LOGO_RING_D = "M25.34 12.42A10 10 0 1 1 20.69 7.17";

/** 체크 — 링 안(좌하)에서 시작, 비워둔 우상단 틈으로 관통해 밖에서 끝난다. */
export const LOGO_CHECK_D = "M10.5 16.2L14.6 20.6L26.4 5.6";

/** 32 뷰박스 기준 획 두께. 링·체크 공통. */
export const LOGO_STROKE = 4;

/** 브랜드 컬러 — globals.css 의 CSS 변수와 반드시 같은 값. */
export const BRAND = {
  /** 스틸 블루 */
  primary: "#2C5282",
  /** 크림 페이퍼 */
  paper: "#FAF8F4",
  /** 웜 차콜 */
  ink: "#18161A",
  /** 웜 미드 */
  inkMid: "#5E5852",
  /** 딥 제이드 */
  mint: "#0C7256",
  /** 웜 보더 */
  border: "#E8E3DC",
  white: "#FFFFFF",
} as const;
