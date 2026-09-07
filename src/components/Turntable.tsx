"use client";

/* A three-quarter view of a belt-drive deck, drawn as a flat projection rather
   than real 3D. Every circle in the object's top plane becomes an ellipse with
   the same squash factor K, so the platter, record, spindle and feet all sit in
   one consistent plane and the whole thing reads as a single solid.

   The camera is baked in. Raising ELEVATION flattens the ellipses (a steeper
   look down); the trapezoid below it is what gives the plinth its perspective,
   with the back edge inset from the front. */

/* The drawing is laid out in a 1100x500 space, but the deck plus its shadow
   only occupy part of that, so the viewBox is cropped to the object's real
   bounds. Without this the SVG carries ~40% empty margin and the deck renders
   small for the width it's given. */
const VIEW = { x: 195, y: 84, w: 752, h: 364 };

/* Vertical squash applied to anything lying flat on the deck. ~25 degrees of
   elevation, matching the reference photo. */
const K = 0.424;

/* Plinth top face, front edge wider than the back so it reads as receding. */
const TOP = { bl: [300, 96], br: [838, 96], fr: [884, 330], fl: [254, 330] } as const;
const PLINTH_H = 44;

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

const pts = (...p: readonly (readonly number[])[]) => p.map((q) => q.join(",")).join(" ");
/* Squash about y = cy: y' = K*y + cy*(1 - K). Applied to a group, it turns the
   circles drawn inside it into correctly-seated ellipses. */
const flatten = (cy: number) => `matrix(1,0,0,${K},0,${cy * (1 - K)})`;

export interface TurntableProps {
  /* Record on the platter. null leaves it bare. */
  disc: string | null;
  className?: string;
}

export function Turntable({ disc, className }: TurntableProps) {
  const playing = disc !== null;

  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      className={className}
      aria-hidden
    >
      <defs>
        {/* Light sits up and to the left, and every gradient below agrees
            with that — it's the main thing selling the form. */}
        <linearGradient id="tt-top" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#3a3a40" />
          <stop offset="45%" stopColor="#26262b" />
          <stop offset="100%" stopColor="#1a1a1e" />
        </linearGradient>
        <linearGradient id="tt-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17171b" />
          <stop offset="60%" stopColor="#101013" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>
        <linearGradient id="tt-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d0d10" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>

        {/* Brushed aluminium: a bright quadrant up-left falling to shadow at
            the lower right, with a slight lift at the far rim for bounce. */}
        <linearGradient id="tt-platter" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#f2f3f5" />
          <stop offset="30%" stopColor="#d5d7db" />
          <stop offset="62%" stopColor="#b3b6bb" />
          <stop offset="100%" stopColor="#cfd1d5" />
        </linearGradient>
        <linearGradient id="tt-platter-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9a9da3" />
          <stop offset="55%" stopColor="#7c7f85" />
          <stop offset="100%" stopColor="#5e6167" />
        </linearGradient>
        <linearGradient id="tt-arm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6e7ea" />
          <stop offset="50%" stopColor="#b9bbc0" />
          <stop offset="100%" stopColor="#85888e" />
        </linearGradient>
        <linearGradient id="tt-chrome" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#f4f5f7" />
          <stop offset="45%" stopColor="#c2c4c9" />
          <stop offset="100%" stopColor="#8b8e94" />
        </linearGradient>

        <radialGradient id="tt-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(18,18,24,0.36)" />
          <stop offset="55%" stopColor="rgba(18,18,24,0.16)" />
          <stop offset="100%" stopColor="rgba(18,18,24,0)" />
        </radialGradient>

        <clipPath id="tt-record-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} />
        </clipPath>
      </defs>

      {/* contact shadow on the ground */}
      <ellipse cx={569} cy={392} rx={366} ry={44} fill="url(#tt-shadow)" />

      {/* feet, behind the plinth body */}
      {[
        [318, 372],
        [820, 372],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x - 17} y={y - 6} width={34} height={22} fill="#0b0b0d" />
          <ellipse cx={x} cy={y + 16} rx={17} ry={7} fill="#121216" />
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
      {/* lit front lip, the edge that catches the key light */}
      <line
        x1={TOP.fl[0]}
        y1={TOP.fl[1]}
        x2={TOP.fr[0]}
        y2={TOP.fr[1]}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={1.5}
      />

      {/* everything from here lies flat on the deck, so it all shares the
          same squash and stays in one plane */}
      <g transform={flatten(PLATTER.cy)}>
        {/* platter edge: the cylinder wall, drawn as the top ellipse repeated
            PLATTER_H lower with the gap between them filled */}
        <path
          d={`M ${PLATTER.cx - PLATTER.r} ${PLATTER.cy}
              a ${PLATTER.r} ${PLATTER.r} 0 0 0 ${PLATTER.r * 2} 0
              l 0 ${PLATTER_H / K}
              a ${PLATTER.r} ${PLATTER.r} 0 0 1 ${-PLATTER.r * 2} 0 z`}
          fill="url(#tt-platter-edge)"
        />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} fill="url(#tt-platter)" />
        <circle
          cx={PLATTER.cx}
          cy={PLATTER.cy}
          r={PLATTER.r - 1.5}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={2}
        />

        {disc ? (
          <>
            {/* The rotation happens here, inside the squash, so the record
                turns in the platter's plane rather than spinning as a flat
                screen-space ellipse. */}
            <g
              className="motion-safe:animate-[record-spin_26s_linear_infinite]"
              style={{
                transformOrigin: `${PLATTER.cx}px ${PLATTER.cy}px`,
                transformBox: "view-box",
              }}
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
            </g>
            <circle
              cx={PLATTER.cx}
              cy={PLATTER.cy}
              r={RECORD_R}
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1.5}
            />
          </>
        ) : (
          /* bare platter: the machined ring from the reference */
          <>
            <circle
              cx={PLATTER.cx}
              cy={PLATTER.cy}
              r={PLATTER.r * 0.52}
              fill="none"
              stroke="rgba(90,94,102,0.5)"
              strokeWidth={7}
            />
            <circle
              cx={PLATTER.cx}
              cy={PLATTER.cy}
              r={PLATTER.r * 0.52}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
          </>
        )}

      </g>

      {/* spindle stands up out of the platter, so it is drawn outside the
          squash — vertical things keep their true height, and drawing it last
          lets it read as passing through the record's centre hole */}
      <rect x={PLATTER.cx - 2.5} y={PLATTER.cy - 26} width={5} height={28} fill="url(#tt-chrome)" />
      <ellipse cx={PLATTER.cx} cy={PLATTER.cy - 26} rx={2.5} ry={1.4} fill="#f0f1f3" />

      {/* knob body, standing proud of the plinth */}
      <g>
        <rect x={292} y={286} width={52} height={16} fill="#c9ccd1" />
        <ellipse cx={318} cy={286} rx={26} ry={11} fill="url(#tt-chrome)" />
      </g>

      {/* the tonearm's mounting base, flat on the plinth. Without it the pivot
          housing reads as floating above the deck. */}
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 20} rx={36} ry={15} fill="#101013" />
      <ellipse cx={PIVOT.x} cy={PIVOT.y + 16} rx={36} ry={15} fill="#25252a" />
      <ellipse
        cx={PIVOT.x}
        cy={PIVOT.y + 16}
        rx={36}
        ry={15}
        fill="none"
        stroke="rgba(255,255,255,0.14)"
      />

      {/* tonearm */}
      <g
        style={{
          transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
          transformBox: "view-box",
          rotate: `${playing ? ARM_PLAYING_DEG : ARM_PARKED_DEG}deg`,
          transition: "rotate 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* counterweight behind the pivot */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x + 46} y2={PIVOT.y - 26} stroke="#9b9ea4" strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={PIVOT.x + 52} cy={PIVOT.y - 30} rx={18} ry={15} fill="#2f2f35" stroke="#6a6d73" strokeWidth={1.5} />
        <ellipse cx={PIVOT.x + 52} cy={PIVOT.y - 30} rx={8} ry={6} fill="#1c1c20" />

        {/* the arm tube */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={604} y2={252} stroke="url(#tt-arm)" strokeWidth={9} strokeLinecap="round" />

        {/* headshell and cartridge at the far end */}
        <g transform="translate(604 252) rotate(30)">
          <rect x={-16} y={-11} width={44} height={22} rx={4} fill="#3c3c43" stroke="#7e8188" strokeWidth={1.5} />
          <rect x={-14} y={-8} width={40} height={7} rx={3} fill="rgba(255,255,255,0.14)" />
          <rect x={24} y={-3} width={12} height={6} rx={2} fill="#d5d7db" />
        </g>

        {/* pivot housing */}
        <ellipse cx={PIVOT.x} cy={PIVOT.y} rx={26} ry={22} fill="#2b2b31" stroke="#6a6d73" strokeWidth={1.5} />
        <ellipse cx={PIVOT.x} cy={PIVOT.y} rx={11} ry={9} fill="url(#tt-chrome)" />
      </g>

      {/* arm rest, under where the parked headshell settles */}
      <g transform={flatten(PLATTER.cy)}>
        <ellipse cx={ARM_REST.x} cy={(ARM_REST.y + 16 - PLATTER.cy * (1 - K)) / K} rx={15} ry={13} fill="#1e1e22" />
      </g>
      <rect x={ARM_REST.x - 6} y={ARM_REST.y - 4} width={12} height={22} rx={5} fill="#2f2f35" stroke="#6a6d73" strokeWidth={1.2} />

      {/* power light */}
      <circle cx={286} cy={318} r={4.5} fill={playing ? "#63d197" : "#33333a"} />
    </svg>
  );
}
