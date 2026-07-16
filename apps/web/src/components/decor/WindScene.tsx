// Canopy dots: the tree's foliage reduced to a scatter of emerald marks.
const canopy = [
  { cx: 60, cy: 44, r: 9, fill: "#059669", opacity: 0.95 },
  { cx: 74, cy: 38, r: 6.5, fill: "#10B981", opacity: 0.9 },
  { cx: 48, cy: 54, r: 7, fill: "#10B981", opacity: 0.85 },
  { cx: 88, cy: 48, r: 7.5, fill: "#34D399", opacity: 0.9 },
  { cx: 36, cy: 68, r: 6, fill: "#34D399", opacity: 0.8 },
  { cx: 70, cy: 56, r: 8, fill: "#047857", opacity: 0.9 },
  { cx: 96, cy: 60, r: 5, fill: "#6EE7B7", opacity: 0.9 },
  { cx: 52, cy: 36, r: 4.5, fill: "#6EE7B7", opacity: 0.85 },
  { cx: 82, cy: 66, r: 5.5, fill: "#10B981", opacity: 0.75 },
  { cx: 30, cy: 78, r: 4, fill: "#A7F3D0", opacity: 0.9 },
  { cx: 64, cy: 28, r: 4, fill: "#34D399", opacity: 0.7 },
  { cx: 100, cy: 50, r: 3.5, fill: "#A7F3D0", opacity: 0.8 },
  { cx: 44, cy: 44, r: 6, fill: "#10B981", opacity: 0.8 },
  { cx: 78, cy: 30, r: 5, fill: "#059669", opacity: 0.75 },
  { cx: 56, cy: 66, r: 6.5, fill: "#059669", opacity: 0.8 },
  { cx: 90, cy: 38, r: 4.5, fill: "#6EE7B7", opacity: 0.85 },
  { cx: 42, cy: 60, r: 5, fill: "#34D399", opacity: 0.85 },
  { cx: 72, cy: 44, r: 7, fill: "#10B981", opacity: 0.85 },
] as const;

type LeafConfig = {
  left: string;
  top: string;
  size: number;
  fill: string;
  /** Drift duration across the container. */
  t: string;
  /** Animation delay; negative values start the loop mid-flight. */
  d: string;
  /** Tumble duration. */
  spin: string;
  /** Tumble direction: 1 clockwise, -1 counter. */
  dir: 1 | -1;
  /** Vertical offset gained over the drift. */
  dy: string;
  /** Peak opacity. */
  o: number;
  /** Soft-focus leaves read as depth rather than clutter. */
  blur?: boolean;
};

// Landing footer strip: leaves lift off the canopy and cross the page.
const stripLeaves: LeafConfig[] = [
  { left: "8%", top: "18%", size: 9, fill: "#10B981", t: "13s", d: "0s", spin: "4.6s", dir: 1, dy: "-16px", o: 0.85 },
  { left: "11%", top: "34%", size: 8, fill: "#34D399", t: "16s", d: "-5s", spin: "5.4s", dir: -1, dy: "-6px", o: 0.8 },
  { left: "7%", top: "26%", size: 7, fill: "#059669", t: "19s", d: "-11s", spin: "6.2s", dir: 1, dy: "-24px", o: 0.7 },
  { left: "13%", top: "48%", size: 8, fill: "#6EE7B7", t: "15s", d: "-8s", spin: "5s", dir: -1, dy: "10px", o: 0.9 },
  { left: "9%", top: "40%", size: 6, fill: "#34D399", t: "21s", d: "-14s", spin: "6.8s", dir: 1, dy: "-10px", o: 0.65 },
  { left: "12%", top: "22%", size: 7, fill: "#A7F3D0", t: "17s", d: "-2s", spin: "5.8s", dir: -1, dy: "18px", o: 0.9 },
  { left: "10%", top: "56%", size: 6, fill: "#10B981", t: "23s", d: "-17s", spin: "7.4s", dir: 1, dy: "-20px", o: 0.6 },
];

// Ambience: fewer, paler, slower leaves than the strip, so they read as
// atmosphere behind real content rather than an event.
const ambientLeaves: LeafConfig[] = [
  { left: "-1%", top: "8%", size: 9, fill: "#6EE7B7", t: "19s", d: "-4s", spin: "6s", dir: 1, dy: "24px", o: 0.5 },
  { left: "2%", top: "18%", size: 7, fill: "#A7F3D0", t: "25s", d: "-13s", spin: "7s", dir: -1, dy: "-14px", o: 0.45 },
  { left: "-2%", top: "30%", size: 12, fill: "#34D399", t: "17s", d: "-8s", spin: "5.4s", dir: 1, dy: "18px", o: 0.28, blur: true },
  { left: "1%", top: "44%", size: 8, fill: "#6EE7B7", t: "28s", d: "-20s", spin: "7.6s", dir: -1, dy: "-22px", o: 0.4 },
  { left: "4%", top: "58%", size: 6, fill: "#A7F3D0", t: "31s", d: "-6s", spin: "8s", dir: 1, dy: "12px", o: 0.35 },
  { left: "0%", top: "72%", size: 11, fill: "#D1FAE5", t: "22s", d: "-16s", spin: "6.4s", dir: -1, dy: "-18px", o: 0.5, blur: true },
];

// Sidebar: a couple of small leaves crossing the narrow strip by the tree.
const sidebarLeaves: LeafConfig[] = [
  { left: "6%", top: "16%", size: 6, fill: "#34D399", t: "11s", d: "0s", spin: "4.8s", dir: 1, dy: "-8px", o: 0.7 },
  { left: "10%", top: "38%", size: 5, fill: "#A7F3D0", t: "15s", d: "-7s", spin: "6s", dir: -1, dy: "8px", o: 0.75 },
  { left: "4%", top: "28%", size: 5, fill: "#6EE7B7", t: "19s", d: "-12s", spin: "6.8s", dir: 1, dy: "-12px", o: 0.6 },
];

function Leaf({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
      <path d="M5 0 C8.5 2 9.5 6 5 10 C0.5 6 1.5 2 5 0 Z" fill={fill} />
    </svg>
  );
}

function DriftingLeaves({ leaves }: { leaves: LeafConfig[] }) {
  return (
    <>
      {leaves.map((leaf, i) => (
        <span
          key={i}
          className={`scene-leaf ${leaf.blur ? "blur-[1.5px]" : ""}`}
          style={
            {
              left: leaf.left,
              top: leaf.top,
              "--t": leaf.t,
              "--d": leaf.d,
              "--spin": leaf.spin,
              "--dir": leaf.dir,
              "--dy": leaf.dy,
              "--leaf-o": leaf.o,
            } as React.CSSProperties
          }
        >
          <Leaf size={leaf.size} fill={leaf.fill} />
        </span>
      ))}
    </>
  );
}

/**
 * The tree, cat, and grass. Drawn against a 240×160 canvas whose bottom edge
 * (y=160) is the ground, so callers bottom-align it on a hairline rule.
 */
function SceneSvg({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} fill="none">
      <g className="scene-sway">
        {/* Trunk and boughs */}
        <path
          d="M72 160 C70 128 66 108 62 84 C60 72 60 64 62 52"
          stroke="#687168"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M63 82 C72 74 82 68 94 62" stroke="#687168" strokeWidth="3" strokeLinecap="round" />
        <path d="M65 96 C54 88 46 84 34 76" stroke="#687168" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 62 C70 54 78 48 86 44" stroke="#687168" strokeWidth="2.5" strokeLinecap="round" />
        {/* Canopy */}
        {canopy.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} opacity={dot.opacity} />
        ))}
      </g>

      {/* Cat, sitting beside the tree, watching the leaves go by */}
      <g fill="#4a564e">
        <path
          className="scene-tail"
          d="M139 156 C149 152 152 143 146 135"
          fill="none"
          stroke="#4a564e"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path d="M112 160 C110 146 114 135 122 133 C130 131 137 139 138 148 C138.5 153 139 157 139 160 Z" />
        <circle cx="116" cy="126" r="8.5" />
        <path d="M110 121 L107 111 L115 116.5 Z" />
        <path d="M122 121 L125 111 L117 116.5 Z" />
      </g>

      {/* Grass and fallen leaves */}
      <path d="M52 160 Q49 152 45 150" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
      <path d="M90 160 Q92 154 96 152" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
      <path d="M160 160 Q162 153 166 151" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="152" cy="157" rx="3.5" ry="2" fill="#A7F3D0" />
      <ellipse cx="178" cy="158" rx="3" ry="1.8" fill="#D1FAE5" />
    </svg>
  );
}

/**
 * A quiet closing scene for the home page: the tree and cat rest on the
 * footer's hairline (the rule doubles as the ground), while the wind loops
 * leaves across the page. Pure CSS animation (keyframes in globals.css), so it
 * renders as a server component and freezes under reduced motion.
 */
export function WindScene() {
  return (
    <div aria-hidden className="relative h-40 overflow-hidden [container-type:inline-size] sm:h-44">
      <SceneSvg className="absolute bottom-0 left-2 h-[85%] w-auto sm:left-6" />

      {/* A distant tuft near the right edge balances the strip. */}
      <svg viewBox="0 0 80 26" className="absolute bottom-0 right-4 h-6 w-auto sm:right-10" fill="none">
        <path d="M18 26 Q15 16 10 13" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 26 Q28 18 33 15" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="52" cy="23" rx="3.5" ry="2" fill="#D1FAE5" />
        <ellipse cx="68" cy="24" rx="3" ry="1.8" fill="#A7F3D0" />
      </svg>

      <DriftingLeaves leaves={stripLeaves} />
    </div>
  );
}

/**
 * A full-bleed ambient leaf layer. Sits behind content (siblings that are
 * positioned or animated form stacking contexts above it) and is inert to
 * pointers, so text and controls stay untouched. Pass positioning through
 * `className` — e.g. `absolute inset-0` inside a hero, or a fixed viewport
 * region inside the app shell.
 */
export function AmbientLeaves({ className = "absolute inset-0" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden [container-type:inline-size] ${className}`}
    >
      <DriftingLeaves leaves={ambientLeaves} />
    </div>
  );
}

/**
 * The compact sidebar edition: the same tree and cat sitting on the account
 * block's top rule, with a few small leaves crossing the strip.
 */
export function SidebarScene() {
  return (
    <div aria-hidden className="relative h-24 overflow-hidden [container-type:inline-size]">
      <SceneSvg className="absolute bottom-0 left-1 h-full w-auto" />
      <DriftingLeaves leaves={sidebarLeaves} />
    </div>
  );
}
