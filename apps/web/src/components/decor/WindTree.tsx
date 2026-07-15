import type { CSSProperties } from "react";

/**
 * Decorative hero scene: a tree in the open space at the left of the landing
 * page, a steady left-to-right wind stripping leaves off its canopy and
 * carrying them down toward the ground on the right. The whole thing loops.
 *
 * It is purely presentational (`aria-hidden`, no pointer events) and renders on
 * the server: every bit of motion is CSS, driven by the keyframes in
 * globals.css and per-element custom properties defined here. That keeps the
 * hero a server component and lets `prefers-reduced-motion` freeze the scene.
 *
 * Colors are drawn from the emerald brand scale so the tree reads as part of
 * the product's material, with a few soft-gold leaves for warmth in the light.
 */

// Emerald brand scale + two warm accents. Flying leaves pick from these so the
// stream stays on-brand while still shimmering with variation.
const LEAF_COLORS = [
  "#34D399", // brand-400
  "#10B981", // brand-500
  "#059669", // brand-600
  "#047857", // brand-700
  "#6EE7B7", // brand-300
  "#8FB4A2", // soft sage
  "#C9A15A", // warm gold
  "#D8B877", // pale gold
] as const;

// A single leaf silhouette, reused for the canopy accents and the flying
// leaves. Drawn in a 24×24 box and tinted via `fill="currentColor"`.
const LEAF_PATH =
  "M6.05 8.05c-2.73 2.73-2.73 7.17-.02 9.9 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z";

type Leaf = {
  /** Start position, anchored to the canopy on the left. */
  top: string;
  left: string;
  size: number;
  color: string;
  /** Landing offset — where the wind carries it to on the right. */
  tx: string;
  ty: string;
  /** Seconds for one full drift, and the negative delay that seeds a leaf
   *  mid-flight so the stream looks continuous from the first frame. */
  duration: number;
  delay: number;
  /** Spin period + direction for the tumble. */
  spin: number;
  dir: 1 | -1;
  opacity: number;
};

// Hand-tuned so leaves are always in flight across the scene: staggered starts
// along the canopy, negative delays spread over the loop, varied arcs.
const LEAVES: Leaf[] = [
  {
    top: "22%",
    left: "17vw",
    size: 17,
    color: LEAF_COLORS[1],
    tx: "72vw",
    ty: "56vh",
    duration: 14,
    delay: -1,
    spin: 3.2,
    dir: 1,
    opacity: 0.95,
  },
  {
    top: "30%",
    left: "13vw",
    size: 14,
    color: LEAF_COLORS[0],
    tx: "78vw",
    ty: "50vh",
    duration: 16,
    delay: -6,
    spin: 2.6,
    dir: -1,
    opacity: 0.9,
  },
  {
    top: "38%",
    left: "16vw",
    size: 19,
    color: LEAF_COLORS[2],
    tx: "68vw",
    ty: "44vh",
    duration: 12.5,
    delay: -3,
    spin: 3.8,
    dir: 1,
    opacity: 0.92,
  },
  {
    top: "26%",
    left: "19vw",
    size: 12,
    color: LEAF_COLORS[4],
    tx: "74vw",
    ty: "58vh",
    duration: 17,
    delay: -9,
    spin: 2.2,
    dir: 1,
    opacity: 0.85,
  },
  {
    top: "44%",
    left: "14vw",
    size: 16,
    color: LEAF_COLORS[3],
    tx: "70vw",
    ty: "40vh",
    duration: 13.5,
    delay: -12,
    spin: 3.0,
    dir: -1,
    opacity: 0.9,
  },
  {
    top: "20%",
    left: "15vw",
    size: 13,
    color: LEAF_COLORS[6],
    tx: "80vw",
    ty: "62vh",
    duration: 18,
    delay: -4,
    spin: 2.8,
    dir: 1,
    opacity: 0.8,
  },
  {
    top: "34%",
    left: "18vw",
    size: 20,
    color: LEAF_COLORS[1],
    tx: "66vw",
    ty: "46vh",
    duration: 11.5,
    delay: -7,
    spin: 4.1,
    dir: -1,
    opacity: 0.95,
  },
  {
    top: "48%",
    left: "12vw",
    size: 15,
    color: LEAF_COLORS[5],
    tx: "76vw",
    ty: "36vh",
    duration: 15,
    delay: -14,
    spin: 2.4,
    dir: 1,
    opacity: 0.82,
  },
  {
    top: "28%",
    left: "20vw",
    size: 11,
    color: LEAF_COLORS[0],
    tx: "72vw",
    ty: "56vh",
    duration: 16.5,
    delay: -2,
    spin: 2.0,
    dir: -1,
    opacity: 0.8,
  },
  {
    top: "40%",
    left: "17vw",
    size: 18,
    color: LEAF_COLORS[2],
    tx: "64vw",
    ty: "42vh",
    duration: 12,
    delay: -10,
    spin: 3.6,
    dir: 1,
    opacity: 0.92,
  },
  {
    top: "24%",
    left: "14vw",
    size: 14,
    color: LEAF_COLORS[7],
    tx: "82vw",
    ty: "60vh",
    duration: 17.5,
    delay: -5,
    spin: 2.7,
    dir: 1,
    opacity: 0.78,
  },
  {
    top: "46%",
    left: "16vw",
    size: 16,
    color: LEAF_COLORS[3],
    tx: "68vw",
    ty: "38vh",
    duration: 13,
    delay: -15,
    spin: 3.3,
    dir: -1,
    opacity: 0.9,
  },
  {
    top: "32%",
    left: "12vw",
    size: 12,
    color: LEAF_COLORS[4],
    tx: "78vw",
    ty: "52vh",
    duration: 15.5,
    delay: -8,
    spin: 2.3,
    dir: 1,
    opacity: 0.84,
  },
  {
    top: "36%",
    left: "19vw",
    size: 21,
    color: LEAF_COLORS[1],
    tx: "62vw",
    ty: "44vh",
    duration: 11,
    delay: -13,
    spin: 4.4,
    dir: -1,
    opacity: 0.95,
  },
  {
    top: "18%",
    left: "16vw",
    size: 13,
    color: LEAF_COLORS[0],
    tx: "84vw",
    ty: "64vh",
    duration: 18.5,
    delay: -11,
    spin: 2.9,
    dir: 1,
    opacity: 0.8,
  },
  {
    top: "42%",
    left: "13vw",
    size: 15,
    color: LEAF_COLORS[6],
    tx: "72vw",
    ty: "40vh",
    duration: 14.5,
    delay: -16,
    spin: 3.1,
    dir: -1,
    opacity: 0.88,
  },
];

// The canopy is built from clusters of circles in three depth tones. A
// turbulence-displacement filter (see the SVG defs) then chews their outline
// into an irregular, leafy silhouette — so no single circle reads as a flat
// oval the way the earlier canopy did.
type Blob = { cx: number; cy: number; r: number };
const FOLIAGE_BACK: Blob[] = [
  { cx: 150, cy: 252, r: 84 },
  { cx: 242, cy: 236, r: 90 },
  { cx: 200, cy: 168, r: 92 },
  { cx: 302, cy: 222, r: 72 },
  { cx: 108, cy: 206, r: 68 },
  { cx: 256, cy: 302, r: 66 },
  { cx: 178, cy: 302, r: 62 },
  { cx: 334, cy: 272, r: 54 },
  { cx: 86, cy: 256, r: 52 },
  { cx: 214, cy: 118, r: 58 },
];
const FOLIAGE_MID: Blob[] = [
  { cx: 162, cy: 202, r: 70 },
  { cx: 232, cy: 182, r: 74 },
  { cx: 120, cy: 182, r: 54 },
  { cx: 288, cy: 192, r: 58 },
  { cx: 202, cy: 242, r: 66 },
  { cx: 150, cy: 292, r: 50 },
  { cx: 258, cy: 256, r: 54 },
  { cx: 322, cy: 228, r: 44 },
  { cx: 96, cy: 216, r: 42 },
  { cx: 210, cy: 122, r: 50 },
];
const FOLIAGE_FRONT: Blob[] = [
  { cx: 150, cy: 152, r: 46 },
  { cx: 208, cy: 140, r: 42 },
  { cx: 112, cy: 176, r: 34 },
  { cx: 182, cy: 198, r: 38 },
  { cx: 252, cy: 168, r: 32 },
  { cx: 168, cy: 108, r: 30 },
];

// Foliage speckle: individual leaves fuzzing the outline (edge ring) and a few
// darker ones inside for depth. Generated deterministically so server renders
// stay stable.
const CANOPY_PALETTE = ["#065F46", "#047857", "#059669", "#10B981", "#34D399", "#6EE7B7"];
const CX = 205;
const CY = 208;
const SPECKLE = Array.from({ length: 56 }, (_, i) => {
  const angle = (i / 56) * Math.PI * 2;
  const noise = (n: number) => (Math.sin(i * n) + 1) / 2; // stable pseudo-random in [0,1]
  const radius = 0.8 + noise(12.9) * 0.28;
  return {
    x: CX + Math.cos(angle) * 205 * radius,
    y: CY + Math.sin(angle) * 152 * radius,
    scale: 0.75 + noise(7.3) * 0.9,
    rot: Math.round(noise(3.1) * 360),
    fill: CANOPY_PALETTE[i % CANOPY_PALETTE.length],
    opacity: 0.5 + noise(5.7) * 0.42,
  };
});
const SPECKLE_INNER = Array.from({ length: 22 }, (_, i) => {
  const angle = (i * 2.39996) % (Math.PI * 2); // golden-angle scatter
  const noise = (n: number) => (Math.sin(i * n) + 1) / 2;
  const radius = 0.2 + noise(9.1) * 0.55;
  return {
    x: CX + Math.cos(angle) * 190 * radius,
    y: CY + Math.sin(angle) * 138 * radius,
    scale: 0.7 + noise(4.7) * 0.6,
    rot: Math.round(noise(6.3) * 360),
    fill: noise(2.2) > 0.5 ? "#065F46" : "#047857",
    opacity: 0.28 + noise(3.9) * 0.24,
  };
});

// Tufts of grass along the ground: each tuft is a small clump of filled,
// tapering blades (not stroked lines, which read as scribble). Three phase
// groups sway out of step so wind ripples across the lawn rather than moving
// it as one block. Deterministic so server renders stay stable.
const GRASS_TONES = ["#047857", "#059669", "#065F46"] as const;
const GRASS_TUFTS = Array.from({ length: 14 }, (_, i) => {
  const noise = (n: number) => (Math.sin((i + 1) * n) + 1) / 2;
  const x = 12 + noise(1.7) * 512;
  const nearBase = Math.abs(x - 240) < 150;
  const baseY = 650 + noise(8.8) * 14;
  const blades = 3 + Math.round(noise(4.2));
  let d = "";
  for (let b = 0; b < blades; b++) {
    const bn = (n: number) => (Math.sin((i * 7 + b + 1) * n) + 1) / 2;
    const bx = x + (b - (blades - 1) / 2) * (4 + bn(2.1) * 2);
    const h = (nearBase ? 15 : 10) + bn(3.3) * (nearBase ? 15 : 9);
    const lean = (bn(5.9) - 0.5) * 24;
    // A blade: two quadratic curves from a ~3.4-unit base meeting at the tip.
    d +=
      `M ${(bx - 1.7).toFixed(1)} ${baseY.toFixed(1)} ` +
      `Q ${(bx - 1.7 + lean * 0.25).toFixed(1)} ${(baseY - h * 0.55).toFixed(1)} ${(bx + lean).toFixed(1)} ${(baseY - h).toFixed(1)} ` +
      `Q ${(bx + 1.7 + lean * 0.45).toFixed(1)} ${(baseY - h * 0.5).toFixed(1)} ${(bx + 1.7).toFixed(1)} ${baseY.toFixed(1)} Z `;
  }
  return { d, tone: GRASS_TONES[i % 3], group: i % 3, opacity: 0.72 + noise(6.1) * 0.28 };
});

// Faint gusts that make the wind itself legible without competing with the text.
const STREAKS = [
  { top: "24vh", width: 200, duration: 9, delay: -1, opacity: 0.28 },
  { top: "38vh", width: 260, duration: 11, delay: -5, opacity: 0.22 },
  { top: "52vh", width: 170, duration: 8, delay: -3, opacity: 0.3 },
  { top: "64vh", width: 230, duration: 12, delay: -8, opacity: 0.18 },
];

// Leaves that have already come to rest on the ground at the right.
const SETTLED = [
  {
    right: "9vw",
    bottom: "9vh",
    size: 15,
    color: LEAF_COLORS[3],
    rot: -18,
    restSpin: "10deg",
    delay: -1,
    opacity: 0.55,
  },
  {
    right: "14vw",
    bottom: "7vh",
    size: 13,
    color: LEAF_COLORS[2],
    rot: 24,
    restSpin: "-8deg",
    delay: -4,
    opacity: 0.5,
  },
  {
    right: "6vw",
    bottom: "6vh",
    size: 17,
    color: LEAF_COLORS[6],
    rot: 8,
    restSpin: "12deg",
    delay: -7,
    opacity: 0.42,
  },
  {
    right: "19vw",
    bottom: "10vh",
    size: 12,
    color: LEAF_COLORS[1],
    rot: -32,
    restSpin: "-6deg",
    delay: -2,
    opacity: 0.48,
  },
  {
    right: "11vw",
    bottom: "11.5vh",
    size: 11,
    color: LEAF_COLORS[7],
    rot: 40,
    restSpin: "9deg",
    delay: -6,
    opacity: 0.4,
  },
];

function LeafGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "block", color }}
    >
      <path d={LEAF_PATH} fill="currentColor" />
      {/* Midrib highlight for a little dimensionality. */}
      <path
        d="M20 4S12 6 8 12s-2.5 8-2.5 8"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WindTree() {
  return (
    <>
      <div
        aria-hidden
        // Only shown at lg+, where the centered hero leaves real open space at the
        // sides; below that the tree would crowd the text, so it is hidden.
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-screen overflow-hidden lg:block"
      >
        {/* Soft ground: a low emerald haze the settled leaves rest on. It peaks
          at the ground line and fades back out before the viewport's bottom
          edge, so no tint band cuts off when the page scrolls past the fold. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[26vh]"
          style={{
            background:
              "linear-gradient(to top, transparent, rgba(6,95,70,0.09) 40%, rgba(16,185,129,0.05) 60%, transparent)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-[13vh] h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(6,95,70,0.16) 22%, rgba(6,95,70,0.16) 82%, transparent)",
          }}
        />

        {/* Wind streaks flowing left → right. */}
        {STREAKS.map((s, i) => (
          <div
            key={`streak-${i}`}
            className="absolute left-0"
            style={
              {
                top: s.top,
                width: s.width,
                height: 2,
                borderRadius: 9999,
                background:
                  "linear-gradient(to right, transparent, rgba(16,185,129,0.5), transparent)",
                filter: "blur(0.5px)",
                animation: `wind-streak ${s.duration}s linear ${s.delay}s infinite`,
                "--wind-o": String(s.opacity),
              } as CSSProperties
            }
          />
        ))}

        {/* The tree, rooted at the bottom-left. */}
        <svg
          className="absolute bottom-0 left-[-3vw] h-[92vh] w-auto sm:left-[-1vw]"
          viewBox="0 0 560 780"
          fill="none"
          preserveAspectRatio="xMinYMax meet"
          style={{ minWidth: 420 }}
        >
          <defs>
            <linearGradient id="wt-trunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#4a3728" />
              <stop offset="0.5" stopColor="#6b5140" />
              <stop offset="1" stopColor="#463327" />
            </linearGradient>
            <linearGradient id="wt-root" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3f2f22" />
              <stop offset="1" stopColor="#5c4634" />
            </linearGradient>
            <linearGradient id="wt-grass" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#047857" />
              <stop offset="1" stopColor="#34D399" />
            </linearGradient>
            <radialGradient id="wt-bush" cx="0.4" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#10B981" />
              <stop offset="1" stopColor="#065F46" />
            </radialGradient>
            <linearGradient id="wt-cat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e7ecea" />
            </linearGradient>
            <radialGradient id="wt-cat-shade" cx="0.5" cy="0.35" r="0.7">
              <stop offset="0" stopColor="rgba(255,255,255,0)" />
              <stop offset="1" stopColor="rgba(120,138,130,0.35)" />
            </radialGradient>
            {/* Chews smooth canopy circles into an irregular, leafy edge. */}
            <filter id="wt-foliage" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.014 0.022"
                numOctaves={3}
                seed={7}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={30}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <radialGradient id="wt-canopy-back" cx="0.4" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#047857" />
              <stop offset="1" stopColor="#065F46" />
            </radialGradient>
            <radialGradient id="wt-canopy-mid" cx="0.42" cy="0.32" r="0.72">
              <stop offset="0" stopColor="#10B981" />
              <stop offset="1" stopColor="#059669" />
            </radialGradient>
            <radialGradient id="wt-canopy-front" cx="0.4" cy="0.3" r="0.7">
              <stop offset="0" stopColor="#6EE7B7" />
              <stop offset="1" stopColor="#10B981" />
            </radialGradient>
            <radialGradient id="wt-shadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(6,95,70,0.22)" />
              <stop offset="1" stopColor="rgba(6,95,70,0)" />
            </radialGradient>
          </defs>

          {/* Ground shadow pooled under the tree. */}
          <ellipse cx="235" cy="666" rx="205" ry="24" fill="url(#wt-shadow)" />

          {/* Root system fanning across the ground and diving off-screen. */}
          <g stroke="url(#wt-root)" strokeLinecap="round" fill="none">
            <path d="M232 646 C 150 654 92 680 14 716" strokeWidth="16" />
            <path d="M228 648 C 120 662 58 686 -8 704" strokeWidth="11" />
            <path d="M232 650 C 198 690 172 728 150 782" strokeWidth="13" />
            <path d="M240 648 C 250 700 262 740 270 784" strokeWidth="14" />
            <path d="M244 648 C 300 664 342 690 374 728" strokeWidth="12" />
            <path d="M248 650 C 336 668 408 692 480 728" strokeWidth="11" />
            <path d="M246 652 C 360 676 460 706 552 744" strokeWidth="8" />
          </g>
          <g stroke="url(#wt-root)" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M64 690 C 44 702 32 716 22 736" strokeWidth="5" />
            <path d="M150 700 C 140 720 136 740 138 764" strokeWidth="5" />
            <path d="M374 728 C 382 744 386 760 386 782" strokeWidth="5" />
            <path d="M420 700 C 436 714 448 730 456 750" strokeWidth="5" />
          </g>

          {/* Trunk, branches, canopy and cat sway together at the root. */}
          <g
            style={{
              transformBox: "view-box",
              transformOrigin: "235px 660px",
              animation: "tree-sway 7s ease-in-out infinite",
            }}
          >
            {/* Trunk with a flared, buttressed base. */}
            <path
              d="M205 664 C 214 590 210 500 222 430 C 226 410 230 400 234 392 L 250 392 C 256 404 262 430 268 500 C 276 585 268 600 276 664 C 252 656 226 656 205 664 Z"
              fill="url(#wt-trunk)"
            />
            {/* Bark crevices for texture. */}
            <g stroke="#33261b" strokeLinecap="round" fill="none" opacity="0.38">
              <path d="M232 640 C 236 560 232 470 240 410" strokeWidth="2.4" />
              <path d="M250 636 C 256 560 258 480 252 420" strokeWidth="1.8" />
              <path d="M220 630 C 222 560 218 500 226 442" strokeWidth="1.5" />
            </g>

            {/* Branch skeleton — major limbs tapering into twigs. */}
            <g stroke="url(#wt-trunk)" strokeLinecap="round" fill="none">
              <path d="M236 404 C 205 372 160 340 120 300" strokeWidth="18" />
              <path d="M160 340 C 150 312 148 292 156 262" strokeWidth="9" />
              <path d="M120 300 C 104 282 96 266 92 244" strokeWidth="8" />
              <path d="M242 398 C 240 344 236 300 240 244" strokeWidth="16" />
              <path d="M240 300 C 256 274 274 256 292 240" strokeWidth="9" />
              <path d="M238 300 C 218 276 200 258 184 242" strokeWidth="9" />
              <path d="M248 404 C 284 372 322 344 356 306" strokeWidth="16" />
              <path d="M322 344 C 340 324 352 310 368 296" strokeWidth="8" />
              <path d="M356 306 C 370 292 380 282 392 272" strokeWidth="7" />
            </g>

            {/* The sturdy low limb the cat sits on — reaching left, where the
              open margin keeps it clear of page content at every width. */}
            <g stroke="url(#wt-trunk)" strokeLinecap="round" fill="none">
              <path d="M232 458 C 180 452 120 456 58 468" strokeWidth="15" />
              <path d="M58 468 C 44 472 32 478 22 488" strokeWidth="9" />
              <path d="M44 470 C 34 456 30 444 28 428" strokeWidth="5" />
            </g>

            {/* Canopy — clustered circles chewed into a leafy silhouette by the
              displacement filter, then dressed with speckle leaves. */}
            <g filter="url(#wt-foliage)">
              {FOLIAGE_BACK.map((b, i) => (
                <circle key={`fb-${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="url(#wt-canopy-back)" />
              ))}
              {FOLIAGE_MID.map((b, i) => (
                <circle key={`fm-${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="url(#wt-canopy-mid)" />
              ))}
              {FOLIAGE_FRONT.map((b, i) => (
                <circle
                  key={`ff-${i}`}
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  fill="url(#wt-canopy-front)"
                  opacity="0.5"
                />
              ))}
            </g>
            {SPECKLE_INNER.map((s, i) => (
              <path
                key={`spin-${i}`}
                d={LEAF_PATH}
                fill={s.fill}
                opacity={s.opacity}
                transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot}) scale(${s.scale.toFixed(2)}) translate(-12 -12)`}
              />
            ))}
            {SPECKLE.map((s, i) => (
              <path
                key={`speck-${i}`}
                d={LEAF_PATH}
                fill={s.fill}
                opacity={s.opacity}
                transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot}) scale(${s.scale.toFixed(2)}) translate(-12 -12)`}
              />
            ))}

            {/* White Persian cat, perched on the low left limb, glancing about
              and flicking its tail as it plays. Drawn in a local 0–104 box. */}
            <g transform="translate(48 360)">
              {/* Soft contact shadow on the branch. */}
              <ellipse cx="50" cy="107" rx="36" ry="6" fill="rgba(40,30,20,0.16)" />
              {/* Tail (behind the body), swishing at its base. */}
              <g
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "18% 88%",
                  animation: "cat-tail 3.4s ease-in-out infinite",
                }}
              >
                <path
                  d="M64 98 C 98 100 118 80 112 52 C 108 34 94 24 82 28 C 98 36 102 54 94 70 C 86 84 72 92 58 92 Z"
                  fill="url(#wt-cat)"
                />
                <path
                  d="M64 98 C 98 100 118 80 112 52 C 108 34 94 24 82 28 C 98 36 102 54 94 70 C 86 84 72 92 58 92 Z"
                  fill="url(#wt-cat-shade)"
                  opacity="0.45"
                />
                <circle cx="110" cy="54" r="6" fill="url(#wt-cat)" />
                <circle cx="99" cy="33" r="5" fill="url(#wt-cat)" />
              </g>

              {/* Body. */}
              <path
                d="M50 108 C 18 108 10 86 14 66 C 18 42 32 30 50 30 C 68 30 82 42 86 66 C 90 86 82 108 50 108 Z"
                fill="url(#wt-cat)"
              />
              <ellipse cx="50" cy="82" rx="38" ry="30" fill="url(#wt-cat-shade)" opacity="0.55" />
              {/* Chest ruff. */}
              <path
                d="M50 106 C 34 106 26 92 30 76 C 36 90 44 94 50 94 C 56 94 64 90 70 76 C 74 92 66 106 50 106 Z"
                fill="#ffffff"
              />
              {/* Fluffy side tufts. */}
              <g fill="url(#wt-cat)">
                <path d="M14 66 L4 60 L15 54 Z" />
                <path d="M14 82 L3 82 L14 74 Z" />
                <path d="M86 66 L96 60 L85 54 Z" />
                <path d="M86 82 L97 82 L86 74 Z" />
              </g>
              {/* Front paws. */}
              <ellipse cx="40" cy="105" rx="9" ry="7" fill="#ffffff" />
              <ellipse cx="60" cy="105" rx="9" ry="7" fill="#ffffff" />
              <path d="M40 100 L40 106 M60 100 L60 106" stroke="#d3d9d6" strokeWidth="1" />

              {/* Head — glances around. Origin at the neck. */}
              <g
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "50% 94%",
                  animation: "cat-look 7s ease-in-out infinite",
                }}
              >
                {/* Ears. */}
                <path d="M28 12 L20 -8 L44 6 Z" fill="url(#wt-cat)" />
                <path d="M72 12 L80 -8 L56 6 Z" fill="url(#wt-cat)" />
                <path d="M30 10 L25 -2 L40 6 Z" fill="#f0c4c4" />
                <path d="M70 10 L75 -2 L60 6 Z" fill="#f0c4c4" />
                {/* Head. */}
                <path
                  d="M50 2 C 24 2 10 20 10 40 C 10 60 28 68 50 68 C 72 68 90 60 90 40 C 90 20 76 2 50 2 Z"
                  fill="url(#wt-cat)"
                />
                {/* Fur tufts around the head. */}
                <g fill="url(#wt-cat)">
                  <path d="M12 34 L2 30 L13 26 Z" />
                  <path d="M14 52 L5 58 L18 56 Z" />
                  <path d="M88 34 L98 30 L87 26 Z" />
                  <path d="M86 52 L95 58 L82 56 Z" />
                  <path d="M40 4 L36 -4 L48 2 Z" />
                  <path d="M60 4 L64 -4 L52 2 Z" />
                </g>
                {/* Cheek puffs. */}
                <circle cx="26" cy="48" r="10" fill="#ffffff" />
                <circle cx="74" cy="48" r="10" fill="#ffffff" />
                {/* Eyes (copper, Persian). */}
                <ellipse cx="37" cy="34" rx="7" ry="8" fill="#C99A3A" />
                <ellipse cx="63" cy="34" rx="7" ry="8" fill="#C99A3A" />
                <ellipse cx="37" cy="35" rx="3" ry="6" fill="#20160a" />
                <ellipse cx="63" cy="35" rx="3" ry="6" fill="#20160a" />
                <circle cx="35" cy="31" r="1.6" fill="#ffffff" />
                <circle cx="61" cy="31" r="1.6" fill="#ffffff" />
                {/* Snub nose + mouth. */}
                <path d="M46 43 L54 43 L50 49 Z" fill="#d98a8a" />
                <path
                  d="M50 49 C 48 53 45 54 42 53 M50 49 C 52 53 55 54 58 53"
                  stroke="#b9877a"
                  strokeWidth="1.3"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Whiskers. */}
                <g stroke="rgba(120,128,124,0.6)" strokeWidth="1" strokeLinecap="round">
                  <path d="M30 44 L4 40" />
                  <path d="M30 47 L4 48" />
                  <path d="M31 50 L6 56" />
                  <path d="M70 44 L96 40" />
                  <path d="M70 47 L96 48" />
                  <path d="M69 50 L94 56" />
                </g>
              </g>
            </g>
          </g>

          {/* Soft turf mounds seating the bushes and grass on the ground. */}
          <ellipse cx="150" cy="662" rx="210" ry="12" fill="rgba(5,150,105,0.09)" />
          <ellipse cx="380" cy="664" rx="200" ry="10" fill="rgba(4,120,87,0.07)" />

          {/* Bushes hugging the base — sculpted lobed silhouettes with layered
            highlights and a few gold blossoms, sitting above the roots. */}
          <g>
            <ellipse cx="116" cy="664" rx="66" ry="8" fill="rgba(6,95,70,0.14)" />
            <g filter="url(#wt-foliage)">
              <path
                d="M44 664 C 38 642 52 628 72 632 C 78 610 106 602 122 616 C 136 600 162 606 166 626 C 184 626 194 644 188 664 Z"
                fill="url(#wt-bush)"
              />
              <path
                d="M66 664 C 64 646 76 636 92 640 C 100 626 122 626 132 638 C 146 632 158 640 158 652 L 158 664 Z"
                fill="#059669"
                opacity="0.75"
              />
              <path
                d="M84 640 C 92 626 112 624 122 634 C 132 626 146 630 150 642 C 138 634 124 636 114 646 C 102 634 92 634 84 640 Z"
                fill="#34D399"
                opacity="0.55"
              />
            </g>
            {/* Right bush, scaled down so the ground stays airy. */}
            <g transform="translate(362 666) scale(0.72) translate(-362 -666)">
              <ellipse cx="356" cy="666" rx="56" ry="7" fill="rgba(6,95,70,0.12)" />
              <g filter="url(#wt-foliage)">
                <path
                  d="M300 666 C 296 648 308 636 324 639 C 330 620 354 614 368 626 C 380 614 402 620 404 638 C 418 640 424 654 420 666 Z"
                  fill="url(#wt-bush)"
                />
                <path
                  d="M322 666 C 322 650 334 642 348 646 C 356 634 374 636 382 646 C 392 642 400 650 400 660 L 398 666 Z"
                  fill="#10B981"
                  opacity="0.6"
                />
              </g>
            </g>
            {/* A few leaves catching light, and tiny gold blossoms. */}
            <g fill="#34D399" opacity="0.75">
              <path transform="translate(104 614) scale(1) rotate(-20)" d={LEAF_PATH} />
              <path transform="translate(140 620) scale(0.9) rotate(15)" d={LEAF_PATH} />
              <path transform="translate(362 636) scale(0.8) rotate(-10)" d={LEAF_PATH} />
            </g>
            <g fill="#D8B877">
              <circle cx="92" cy="636" r="2.4" />
              <circle cx="144" cy="640" r="2.2" />
              <circle cx="368" cy="642" r="2" />
            </g>
            <g fill="#ffffff" opacity="0.85">
              <circle cx="91" cy="635" r="0.9" />
              <circle cx="143" cy="639" r="0.8" />
              <circle cx="367" cy="641" r="0.7" />
            </g>
          </g>

          {/* Grass tufts along the ground, rippling in three out-of-step phases. */}
          {[0, 1, 2].map((g) => (
            <g
              key={`grass-${g}`}
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
                animation: `grass-sway ${4.5 + g}s ease-in-out ${-g}s infinite`,
              }}
            >
              {GRASS_TUFTS.filter((tuft) => tuft.group === g).map((tuft, i) => (
                <path key={i} d={tuft.d} fill={tuft.tone} opacity={tuft.opacity} />
              ))}
            </g>
          ))}
        </svg>

        {/* Leaves in flight, lifted off the canopy and carried to the ground. */}
        {LEAVES.map((leaf, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute"
            style={
              {
                top: leaf.top,
                left: leaf.left,
                animation: `leaf-travel ${leaf.duration}s cubic-bezier(0.37, 0.01, 0.44, 0.98) ${leaf.delay}s infinite`,
                "--tx": leaf.tx,
                "--ty": leaf.ty,
                "--leaf-o": String(leaf.opacity),
                willChange: "transform, opacity",
              } as CSSProperties
            }
          >
            <div
              style={
                {
                  animation: `leaf-tumble ${leaf.spin}s ease-in-out infinite`,
                  "--dir": String(leaf.dir),
                  filter: "drop-shadow(0 1px 1px rgba(6,95,70,0.12))",
                } as CSSProperties
              }
            >
              <LeafGlyph color={leaf.color} size={leaf.size} />
            </div>
          </div>
        ))}

        {/* Leaves settled on the ground at the right, stirring in the gusts. */}
        {SETTLED.map((leaf, i) => (
          <div
            key={`settled-${i}`}
            className="absolute"
            style={
              {
                right: leaf.right,
                bottom: leaf.bottom,
                opacity: leaf.opacity,
                transform: `rotate(${leaf.rot}deg)`,
                animation: `leaf-settle 9s ease-in-out ${leaf.delay}s infinite`,
                "--rest-spin": leaf.restSpin,
              } as CSSProperties
            }
          >
            <LeafGlyph color={leaf.color} size={leaf.size} />
          </div>
        ))}
      </div>

      {/* Below the fold: the two taproots that dive off the hero keep descending
        as the page scrolls, tapering and fading toward the footer, with slow
        emerald sap pulses travelling down them. Sized with the same 66vh-wide
        geometry as the tree SVG so the strands line up with its root tips. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-3vw] top-[100vh] z-0 hidden w-[66vh] min-w-[420px] overflow-hidden sm:left-[-1vw] lg:block"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 560 1000"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            {/* Three gradient windows layered on the same paths fake a taper:
              wide base fades out early, mid takes over, tip fades to nothing. */}
            <linearGradient id="wt-rc-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a3728" stopOpacity="0.85" />
              <stop offset="0.45" stopColor="#4a3728" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wt-rc-mid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.05" stopColor="#54402f" stopOpacity="0" />
              <stop offset="0.4" stopColor="#54402f" stopOpacity="0.7" />
              <stop offset="0.85" stopColor="#54402f" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wt-rc-tip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.6" stopColor="#5c4634" stopOpacity="0" />
              <stop offset="0.85" stopColor="#5c4634" stopOpacity="0.55" />
              <stop offset="1" stopColor="#5c4634" stopOpacity="0" />
            </linearGradient>
          </defs>

          {(
            [
              // Taproots continuing from the tree's two down-diving roots
              // (local x 150 and 270 at the hero's bottom edge). Amplitudes are
              // kept gentle: the page below the fold may be short, and vertical
              // compression would turn big meanders into squiggles.
              "M150 0 C 145 160 157 320 150 480 C 143 640 155 820 149 1000",
              "M270 0 C 276 150 263 320 272 480 C 281 640 267 820 274 1000",
            ] as const
          ).map((d, i) => (
            <g key={`rc-${i}`}>
              <path
                d={d}
                stroke="url(#wt-rc-base)"
                strokeWidth={i === 0 ? 13 : 14}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={d}
                stroke="url(#wt-rc-mid)"
                strokeWidth={8}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={d}
                stroke="url(#wt-rc-tip)"
                strokeWidth={4}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Sap pulse gliding down the strand. */}
              <path
                d={d}
                stroke="#34D399"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="14 146"
                vectorEffect="non-scaling-stroke"
                opacity="0.5"
                style={{ animation: `root-flow ${8 + i * 2.5}s linear ${-i * 4}s infinite` }}
              />
            </g>
          ))}

          {/* Side rootlets branching off as the taproots descend. */}
          <g stroke="url(#wt-rc-mid)" strokeLinecap="round">
            <path
              d="M150 480 C 132 520 120 560 114 620"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M272 480 C 292 520 306 560 312 620"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M149 820 C 132 856 124 890 120 940"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M273 780 C 292 812 302 850 305 910"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g stroke="#5c4634" strokeLinecap="round" opacity="0.3">
            <path
              d="M114 620 C 110 650 108 676 109 706"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M312 620 C 316 648 318 674 318 702"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M155 260 C 172 280 182 300 187 328"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M268 640 C 252 662 244 684 241 712"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
