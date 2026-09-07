"use client";

/* A three-quarter view of a belt-drive deck, drawn as a flat projection rather
   than real 3D. Every circle in the object's top plane becomes an ellipse with
   the same squash factor K, so the platter, record, spindle and feet all sit in
   one consistent plane and the whole thing reads as a single solid.

   Two rules keep it convincing, and breaking either one makes it collapse into
   a decal printed on a black rectangle:

     - anything lying flat on the deck is drawn inside flatten(), anything
       standing up out of it is drawn outside;
     - anything representing a reflection is drawn outside the record's
       spinning group, because a specular is fixed in world space. */

/* The drawing is laid out in a 1100x500 space, but the deck plus its shadow
   only occupy part of that, so the viewBox is cropped to the object's real
   bounds. Without this the SVG carries ~40% empty margin and the deck renders
   small for the width it's given. */
const VIEW = { x: 195, y: 84, w: 752, h: 364 };

/* Vertical squash applied to anything lying flat on the deck. ~25 degrees of
   elevation, matching the reference photo. */
const K = 0.424;

/* Plinth top face. The back edge is inset from the front so the slab recedes;
   the ratio here (~0.79) is measured off the reference. */
const TOP = { bl: [306, 96], br: [830, 96], fr: [884, 330], fl: [254, 330] } as const;
/* Slab thickness. The reference deck is about 4.8% of its own width — thinner
   than it looks, and the thing that most makes a plinth read as chunky. */
const PLINTH_H = 30;

const PLATTER = { cx: 512, cy: 198, r: 212 };
const PLATTER_H = 20;
const RECORD_R = 196;
/* Where the tonearm pivots, and how far it swings to park. */
const PIVOT = { x: 770, y: 168 };
/* Negative parks it. CSS rotates clockwise, and the arm reaches down-left from
   the pivot, so a positive angle sweeps the headshell further across the
   platter — i.e. it parks in the middle of the record. Negative swings it out
   to the right, clear of the platter, onto the rest below. */
const ARM_PARKED_DEG = -14;
const ARM_PLAYING_DEG = 0;
/* Where the headshell lands at ARM_PARKED_DEG, found by rotating the arm tip
   about the pivot. The rest is drawn there so the arm has something to sit on. */
const ARM_REST = { x: 629, y: 290 };
/* Far end of the arm tube, in the playing position. */
const ARM_TIP = { x: 604, y: 252 };

const pts = (...p: readonly (readonly number[])[]) => p.map((q) => q.join(",")).join(" ");
/* Squash about y = cy: y' = K*y + cy*(1 - K). Applied to a group, it turns the
   circles drawn inside it into correctly-seated ellipses. */
const flatten = (cy: number) => `matrix(1,0,0,${K},0,${cy * (1 - K)})`;

/* Concentric rings, used for both the platter's machining and the record's
   grooves. Deliberately built from +-*\/ only: Math.cos/Math.sin are not
   guaranteed bit-identical between Node and the browser, and generated trig
   caused a hydration mismatch on an earlier version of this deck. Basic
   arithmetic is deterministic under IEEE 754, so this is safe to server-render. */
function rings(from: number, to: number, count: number) {
  const step = (to - from) / count;
  return Array.from({ length: count }, (_, i) => from + i * step);
}

export interface TurntableProps {
  /* Record on the platter. null leaves it bare. */
  disc: string | null;
  className?: string;
}

export function Turntable({ disc, className }: TurntableProps) {
  const playing = disc !== null;

  return (
    <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className={className} aria-hidden>
      <defs>
        {/* Light sits up and to the left. Every gradient below agrees with
            that, which is the main thing selling the form. */}
        <linearGradient id="tt-top" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#34343a" />
          <stop offset="45%" stopColor="#232328" />
          <stop offset="100%" stopColor="#191a1d" />
        </linearGradient>
        <linearGradient id="tt-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1b20" />
          <stop offset="45%" stopColor="#111114" />
          <stop offset="100%" stopColor="#08080a" />
        </linearGradient>
        <linearGradient id="tt-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0e0e11" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        {/* Matte sheen across the plinth top — wide and very faint. The
            reference plinth has no reflection, so this must not read as gloss. */}
        <radialGradient id="tt-plinth-sheen" cx="0.35" cy="0.25" r="0.75">
          <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Platter face: radial rather than linear so the falloff radiates
            from the light instead of running corner to corner. */}
        <radialGradient id="tt-platter" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0%" stopColor="#e9ebee" />
          <stop offset="38%" stopColor="#d2d5da" />
          <stop offset="72%" stopColor="#aeb1b8" />
          <stop offset="100%" stopColor="#8f9299" />
        </radialGradient>
        {/* Rim, lit across its width: bright where it faces the light at the
            front-left, falling away to the right. */}
        <linearGradient id="tt-rim-across" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#75787f" />
          <stop offset="22%" stopColor="#cfd2d7" />
          <stop offset="52%" stopColor="#93969d" />
          <stop offset="100%" stopColor="#54575d" />
        </linearGradient>
        {/* ...multiplied by a vertical pass for the shadow under the lip and
            the bounce coming back up off the plinth. */}
        <linearGradient id="tt-rim-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.34)" />
          <stop offset="45%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="85%" stopColor="rgba(0,0,0,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>
        {/* Top lip: brightest at the front-left, not a uniform white ring. */}
        <linearGradient id="tt-lip" x1="0" y1="0.2" x2="1" y2="0.9">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>

        <linearGradient id="tt-arm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f1f3" />
          <stop offset="38%" stopColor="#c6c8cd" />
          <stop offset="100%" stopColor="#7c7f85" />
        </linearGradient>
        <linearGradient id="tt-chrome" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#f8f9fa" />
          <stop offset="45%" stopColor="#c8cad0" />
          <stop offset="100%" stopColor="#83868c" />
        </linearGradient>
        <linearGradient id="tt-weight" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#4a4a52" />
          <stop offset="45%" stopColor="#2b2b31" />
          <stop offset="100%" stopColor="#151519" />
        </linearGradient>

        <radialGradient id="tt-shadow-soft" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(20,20,26,0.22)" />
          <stop offset="60%" stopColor="rgba(20,20,26,0.08)" />
          <stop offset="100%" stopColor="rgba(20,20,26,0)" />
        </radialGradient>

        <filter id="tt-blur-core" x="-30%" y="-120%" width="160%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="tt-blur-spec" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>

        <clipPath id="tt-platter-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} />
        </clipPath>
        <clipPath id="tt-record-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} />
        </clipPath>
      </defs>

      {/* Contact shadow, two layers: a tight dark core following the plinth's
          footprint and a wider faint halo. A single even ellipse reads as fog. */}
      <ellipse cx={572} cy={388} rx={352} ry={40} fill="url(#tt-shadow-soft)" />
      <polygon
        points={pts(
          [TOP.fl[0] + 16, TOP.fl[1] + PLINTH_H],
          [TOP.fr[0] - 16, TOP.fr[1] + PLINTH_H],
          [TOP.fr[0] - 34, TOP.fr[1] + PLINTH_H + 26],
          [TOP.fl[0] + 34, TOP.fl[1] + PLINTH_H + 26],
        )}
        fill="rgba(16,16,22,0.44)"
        filter="url(#tt-blur-core)"
      />

      {/* feet, behind the plinth body */}
      {[
        [322, 358],
        [816, 358],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x - 16} y={y - 6} width={32} height={20} fill="#0a0a0c" />
          <ellipse cx={x} cy={y + 14} rx={16} ry={6.5} fill="#141418" />
          <ellipse cx={x} cy={y + 12} rx={16} ry={6.5} fill="#0d0d10" />
        </g>
      ))}

      {/* plinth: front and right faces first, then the top laid over them */}
      <polygon
        points={pts(TOP.fl, TOP.fr, [TOP.fr[0], TOP.fr[1] + PLINTH_H], [TOP.fl[0], TOP.fl[1] + PLINTH_H])}
        fill="url(#tt-front)"
      />
      <polygon
        points={pts(TOP.br, TOP.fr, [TOP.fr[0], TOP.fr[1] + PLINTH_H], [TOP.br[0], TOP.br[1] + PLINTH_H])}
        fill="url(#tt-side)"
      />
      <polygon points={pts(TOP.bl, TOP.br, TOP.fr, TOP.fl)} fill="url(#tt-top)" />
      <polygon points={pts(TOP.bl, TOP.br, TOP.fr, TOP.fl)} fill="url(#tt-plinth-sheen)" />
      {/* Lit front lip where the top face turns over into the front. */}
      <line
        x1={TOP.fl[0]}
        y1={TOP.fl[1]}
        x2={TOP.fr[0]}
        y2={TOP.fr[1]}
        stroke="rgba(255,255,255,0.26)"
        strokeWidth={1.5}
      />
      {/* The back and right edges turn away from the light, so they darken
          rather than catching it. */}
      <line x1={TOP.bl[0]} y1={TOP.bl[1]} x2={TOP.br[0]} y2={TOP.br[1]} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
      <line x1={TOP.br[0]} y1={TOP.br[1]} x2={TOP.fr[0]} y2={TOP.fr[1]} stroke="rgba(0,0,0,0.45)" strokeWidth={1.5} />

      {/* Everything from here lies flat on the deck, so it shares the squash
          and stays in one plane. */}
      <g transform={flatten(PLATTER.cy)}>
        {/* Platter rim — the cylinder wall, drawn as the top ellipse repeated
            PLATTER_H lower with the gap between filled. Two passes: lit across
            its width, then shaded down its height. */}
        {[["url(#tt-rim-across)", 1], ["url(#tt-rim-down)", 1]].map(([fill, o], i) => (
          <path
            key={i}
            d={`M ${PLATTER.cx - PLATTER.r} ${PLATTER.cy}
                a ${PLATTER.r} ${PLATTER.r} 0 0 0 ${PLATTER.r * 2} 0
                l 0 ${PLATTER_H / K}
                a ${PLATTER.r} ${PLATTER.r} 0 0 1 ${-PLATTER.r * 2} 0 z`}
            fill={fill as string}
            opacity={o as number}
          />
        ))}

        {/* Platter face */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} fill="url(#tt-platter)" />

        {/* Machining rings. Individually invisible; together they read as
            turned metal rather than painted sheet. */}
        <g clipPath="url(#tt-platter-clip)">
          {rings(PLATTER.r * 0.16, PLATTER.r * 0.98, 52).map((r, i) => (
            <circle
              key={r}
              cx={PLATTER.cx}
              cy={PLATTER.cy}
              r={r}
              fill="none"
              stroke={i % 2 ? "rgba(255,255,255,0.055)" : "rgba(60,64,72,0.05)"}
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* The prominent machined step from the reference */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48} fill="none" stroke="rgba(96,100,108,0.34)" strokeWidth={8} />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 - 4.5} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={1.4} />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 + 4.5} fill="none" stroke="rgba(70,74,82,0.22)" strokeWidth={1.2} />

        {/* Specular pool, upper left. Clipped so it cannot spill off the rim. */}
        <g clipPath="url(#tt-platter-clip)">
          <ellipse
            cx={PLATTER.cx - 88}
            cy={PLATTER.cy - 82}
            rx={104}
            ry={80}
            fill="rgba(255,255,255,0.15)"
            filter="url(#tt-blur-spec)"
          />
        </g>

        {playing && (
          <>
            {/* The rotation happens here, inside the squash, so the record
                turns in the platter's plane rather than spinning as a flat
                screen-space ellipse. */}
            <g
              className="motion-safe:animate-[record-spin_26s_linear_infinite]"
              style={{ transformOrigin: `${PLATTER.cx}px ${PLATTER.cy}px`, transformBox: "view-box" }}
            >
              <image
                href={disc}
                x={PLATTER.cx - RECORD_R}
                y={PLATTER.cy - RECORD_R}
                width={RECORD_R * 2}
                height={RECORD_R * 2}
                clipPath="url(#tt-record-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Grooves. Safe to spin with the record — concentric rings look
                  identical at every rotation. */}
              <g clipPath="url(#tt-record-clip)">
                {rings(RECORD_R * 0.34, RECORD_R * 0.97, 44).map((r, i) => (
                  <circle
                    key={r}
                    cx={PLATTER.cx}
                    cy={PLATTER.cy}
                    r={r}
                    fill="none"
                    stroke={i % 2 ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.14)"}
                    strokeWidth={0.8}
                  />
                ))}
              </g>
            </g>

            {/* Sheen, deliberately OUTSIDE the rotating group: a reflection is
                fixed in world space, and one that travels with the label
                destroys the illusion instantly. */}
            <g clipPath="url(#tt-record-clip)">
              <ellipse
                cx={PLATTER.cx - 66}
                cy={PLATTER.cy - 72}
                rx={122}
                ry={92}
                fill="rgba(255,255,255,0.17)"
                filter="url(#tt-blur-spec)"
              />
            </g>
            <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} fill="none" stroke="rgba(0,0,0,0.42)" strokeWidth={2} />
            <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R - 1.5} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          </>
        )}

        {/* A dark seam right under the lip: without it the rim melts into the
            face and the platter loses its thickness. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r - 0.5} fill="none" stroke="rgba(40,44,52,0.35)" strokeWidth={1.2} />

        {/* Bright top lip, graded so it is strongest at the front-left. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r - 1.2} fill="none" stroke="url(#tt-lip)" strokeWidth={2.4} />
      </g>

      {/* The spindle stands up out of the platter, so it is drawn outside the
          squash — vertical things keep their true height — and last, so it
          reads as passing through the record's centre hole. */}
      <g transform={flatten(PLATTER.cy)}>
        <ellipse cx={PLATTER.cx} cy={PLATTER.cy + 4} rx={11} ry={11} fill="rgba(0,0,0,0.28)" />
      </g>
      <path d={`M ${PLATTER.cx - 3.4} ${PLATTER.cy} L ${PLATTER.cx - 2.2} ${PLATTER.cy - 27} L ${PLATTER.cx + 2.2} ${PLATTER.cy - 27} L ${PLATTER.cx + 3.4} ${PLATTER.cy} Z`} fill="url(#tt-chrome)" />
      <ellipse cx={PLATTER.cx} cy={PLATTER.cy - 27} rx={2.2} ry={1.2} fill="#fafbfc" />

      {/* Speed knob, standing proud of the plinth */}
      <g>
        <rect x={294} y={288} width={48} height={14} fill="#9fa2a8" />
        <rect x={294} y={288} width={48} height={5} fill="#c4c7cc" />
        <ellipse cx={318} cy={302} rx={24} ry={10} fill="#7e8187" />
        <ellipse cx={318} cy={288} rx={24} ry={10} fill="url(#tt-chrome)" />
        <ellipse cx={318} cy={288} rx={24} ry={10} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={0.8} />
        <ellipse cx={318} cy={287} rx={13} ry={5} fill="rgba(255,255,255,0.28)" />
      </g>

      {/* Tonearm mounting base, flat on the plinth. Without it the pivot
          assembly reads as floating above the deck. */}
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 34} rx={29} ry={12} fill="#08080a" />
      <rect x={PIVOT.x - 29} y={PIVOT.y + 26} width={58} height={8} fill="#1b1b20" />
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 26} rx={29} ry={12} fill="#33333a" />
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 26} rx={29} ry={12} fill="none" stroke="rgba(255,255,255,0.22)" />
      <ellipse cx={PIVOT.x - 6} cy={PIVOT.y + 23} rx={17} ry={6} fill="rgba(255,255,255,0.07)" />

      {/* Cue lever, beside the base and fixed to the plinth rather than the
          arm, so it stays put while the arm swings. */}
      <g>
        <rect x={PIVOT.x - 52} y={PIVOT.y + 12} width={9} height={17} rx={3} fill="#2a2a30" />
        <rect x={PIVOT.x - 58} y={PIVOT.y + 6} width={21} height={8} rx={4} fill="#3c3c44" stroke="#6e7178" strokeWidth={0.8} />
      </g>

      {/* Gimbal post rising off the base, carrying the bearing yoke. */}
      <rect x={PIVOT.x - 9} y={PIVOT.y} width={18} height={26} fill="#2c2c33" />
      <rect x={PIVOT.x - 9} y={PIVOT.y} width={6} height={26} fill="#43434c" />
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 26} rx={9} ry={4} fill="#1b1b1f" />

      {/* Tonearm */}
      <g
        style={{
          transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
          transformBox: "view-box",
          rotate: `${playing ? ARM_PLAYING_DEG : ARM_PARKED_DEG}deg`,
          transition: "rotate 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Counterweight stub and mass behind the pivot */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x + 44} y2={PIVOT.y - 25} stroke="#9a9da3" strokeWidth={6} strokeLinecap="round" />
        <line x1={PIVOT.x} y1={PIVOT.y - 1.5} x2={PIVOT.x + 44} y2={PIVOT.y - 26.5} stroke="rgba(255,255,255,0.5)" strokeWidth={1.6} strokeLinecap="round" />
        <ellipse cx={PIVOT.x + 54} cy={PIVOT.y - 31} rx={18} ry={15} fill="url(#tt-weight)" stroke="#5c5f65" strokeWidth={1.1} />
        {/* Lit left flank and a chrome band, so the weight reads as a machined
            cylinder rather than a sphere. Arcs rather than offset full
            ellipses — those just stack up as clutter at this size. */}
        <path
          d={`M ${PIVOT.x + 45} ${PIVOT.y - 43} a 18 15 0 0 0 -0.5 24`}
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <path
          d={`M ${PIVOT.x + 54} ${PIVOT.y - 46} a 18 15 0 0 0 0 30`}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={1.2}
        />
        <ellipse cx={PIVOT.x + 63} cy={PIVOT.y - 34} rx={6} ry={9} fill="#101014" />

        {/* Arm tube. The two thin lines along its length are what make it read
            as a chrome tube instead of a flat stroke. */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={ARM_TIP.x} y2={ARM_TIP.y} stroke="url(#tt-arm)" strokeWidth={9} strokeLinecap="round" />
        <line x1={PIVOT.x - 1} y1={PIVOT.y - 2.6} x2={ARM_TIP.x - 1} y2={ARM_TIP.y - 2.6} stroke="rgba(255,255,255,0.72)" strokeWidth={1.8} strokeLinecap="round" />
        <line x1={PIVOT.x + 1} y1={PIVOT.y + 3.2} x2={ARM_TIP.x + 1} y2={ARM_TIP.y + 3.2} stroke="rgba(0,0,0,0.30)" strokeWidth={1.6} strokeLinecap="round" />

        {/* Bearing yoke, over the tube where it meets the pivot */}
        <ellipse cx={PIVOT.x} cy={PIVOT.y} rx={19} ry={16} fill="#2d2d34" stroke="#787b82" strokeWidth={1.3} />
        <ellipse cx={PIVOT.x} cy={PIVOT.y} rx={8} ry={6.5} fill="url(#tt-chrome)" />

        {/* Headshell: finger lift, body, cartridge and stylus */}
        <g transform={`translate(${ARM_TIP.x} ${ARM_TIP.y}) rotate(30)`}>
          <rect x={-20} y={-9} width={26} height={7} rx={3} fill="#b9bcc2" />
          <rect x={-14} y={-11} width={42} height={21} rx={4} fill="#3a3a42" stroke="#82858c" strokeWidth={1.3} />
          <rect x={-12} y={-8.5} width={38} height={6} rx={3} fill="rgba(255,255,255,0.2)" />
          <rect x={6} y={4} width={20} height={9} rx={2} fill="#1d1d22" />
          <rect x={24} y={-3} width={11} height={6} rx={2} fill="#dfe1e5" />
          <line x1={16} y1={13} x2={16} y2={19} stroke="#c9ccd1" strokeWidth={1.4} />
        </g>
      </g>

      {/* Arm rest: post and fork clip, where the parked headshell settles */}
      <g transform={flatten(PLATTER.cy)}>
        <ellipse cx={ARM_REST.x} cy={(ARM_REST.y + 18 - PLATTER.cy * (1 - K)) / K} rx={15} ry={13} fill="#17171b" />
      </g>
      <rect x={ARM_REST.x - 4} y={ARM_REST.y - 2} width={8} height={20} rx={3.5} fill="#2c2c33" />
      <rect x={ARM_REST.x - 4} y={ARM_REST.y - 2} width={3} height={20} rx={1.5} fill="#45454e" />
      <path
        d={`M ${ARM_REST.x - 8} ${ARM_REST.y - 8} L ${ARM_REST.x + 8} ${ARM_REST.y - 8} L ${ARM_REST.x + 5.5} ${ARM_REST.y - 1} L ${ARM_REST.x - 5.5} ${ARM_REST.y - 1} Z`}
        fill="#3a3a43"
        stroke="#75787f"
        strokeWidth={0.8}
      />

      {/* Power light */}
      <circle cx={288} cy={318} r={4.5} fill={playing ? "#63d197" : "#2e2e35"} />
      {playing && <circle cx={288} cy={318} r={8} fill="rgba(99,209,151,0.22)" />}
    </svg>
  );
}
