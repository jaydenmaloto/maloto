"use client";

/* Geometry lives in one place so the plinth, platter, record and tonearm can
   never drift apart. Everything below is in viewBox units. */
const VB = { w: 360, h: 250 };
const PLATTER = { cx: 148, cy: 118, r: 92 };
const RECORD_R = 84;
const PIVOT = { x: 300, y: 52 };

/* The tonearm is drawn once in its playing position, over the record, and
   rotated about its pivot to park it. Cueing between the two is a CSS
   transition on `rotate`.

   The parked angle is negative because CSS rotates clockwise: a positive angle
   swings the headshell further *across* the platter, which parks the arm in
   the middle of the record. Negative swings it out to the right, clear of the
   platter and onto its rest. */
const ARM_PARKED_DEG = -30;
const ARM_PLAYING_DEG = 0;
/* Where the headshell ends up at ARM_PARKED_DEG, so the rest sits under it. */
const ARM_REST = { x: 276, y: 167 };

export interface TurntableProps {
  /* Record on the platter. null leaves the platter bare, which is the
     empty state: nothing selected, nothing playing. */
  disc: string | null;
  className?: string;
}

export function Turntable({ disc, className }: TurntableProps) {
  const playing = disc !== null;

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={className}
      /* Decorative: the heading beside it already names what's on the deck. */
      aria-hidden
      style={{ filter: "drop-shadow(0 18px 28px rgba(15, 15, 20, 0.18))" }}
    >
      <defs>
        <linearGradient id="tt-plinth" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#33333a" />
          <stop offset="55%" stopColor="#212126" />
          <stop offset="100%" stopColor="#141417" />
        </linearGradient>
        {/* Off-centre highlight so the platter reads as spun metal catching a
            light source up and to the left, matching the plinth's gradient. */}
        <radialGradient id="tt-platter" cx="0.36" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#e8e9ec" />
          <stop offset="45%" stopColor="#c3c5ca" />
          <stop offset="100%" stopColor="#94969c" />
        </radialGradient>
        <linearGradient id="tt-arm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d7d8dc" />
          <stop offset="100%" stopColor="#8e9096" />
        </linearGradient>
        <clipPath id="tt-record-clip">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} />
        </clipPath>
      </defs>

      {/* plinth */}
      <rect x={8} y={8} width={VB.w - 16} height={VB.h - 16} rx={13} fill="url(#tt-plinth)" />
      <rect
        x={8.5}
        y={8.5}
        width={VB.w - 17}
        height={VB.h - 17}
        rx={12.5}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
      />

      {/* platter, with a recessed well so it sits *in* the plinth */}
      <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r + 5} fill="#0f0f12" />
      <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} fill="url(#tt-platter)" />
      <circle
        cx={PLATTER.cx}
        cy={PLATTER.cy}
        r={PLATTER.r - 4}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={0.75}
      />
      {/* strobe dots around the rim — the detail that says "turntable" */}
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        /* Rounded to a fixed precision on purpose: raw trig results serialise
           with different trailing digits in Node and in the browser, which
           React reports as a hydration mismatch. */
        const round = (n: number) => Number(n.toFixed(3));
        return (
          <circle
            key={i}
            cx={round(PLATTER.cx + Math.cos(a) * (PLATTER.r - 8))}
            cy={round(PLATTER.cy + Math.sin(a) * (PLATTER.r - 8))}
            r={0.9}
            fill="rgba(40,40,48,0.35)"
          />
        );
      })}

      {/* the record */}
      {disc && (
        <g
          className="motion-safe:animate-[record-spin_24s_linear_infinite]"
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
        </g>
      )}
      <circle
        cx={PLATTER.cx}
        cy={PLATTER.cy}
        r={RECORD_R}
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={0.75}
      />

      {/* spindle — drawn after the record so it pins it down */}
      <circle cx={PLATTER.cx} cy={PLATTER.cy} r={3.6} fill="#e9eaed" />
      <circle cx={PLATTER.cx} cy={PLATTER.cy} r={3.6} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={0.6} />

      {/* arm rest, under where the parked headshell lands */}
      <rect
        x={ARM_REST.x - 4}
        y={ARM_REST.y - 12}
        width={8}
        height={22}
        rx={4}
        fill="#2b2b31"
        stroke="#55565c"
        strokeWidth={0.8}
      />

      {/* tonearm, above the record */}
      <g
        style={{
          transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
          transformBox: "view-box",
          rotate: `${playing ? ARM_PLAYING_DEG : ARM_PARKED_DEG}deg`,
          transition: "rotate 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* counterweight, behind the pivot */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x + 26} y2={PIVOT.y - 24} stroke="#8e9096" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={PIVOT.x + 29} cy={PIVOT.y - 27} r={8} fill="#2b2b31" stroke="#55565c" strokeWidth={1} />
        {/* arm */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={222} y2={140} stroke="url(#tt-arm)" strokeWidth={4.5} strokeLinecap="round" />
        {/* headshell */}
        <g transform="translate(222 140) rotate(45)">
          <rect x={-7} y={-5} width={20} height={10} rx={2} fill="#3a3a41" stroke="#6e7076" strokeWidth={0.8} />
          <rect x={10} y={-1.4} width={5} height={2.8} rx={1} fill="#c9cbd0" />
        </g>
        {/* pivot housing */}
        <circle cx={PIVOT.x} cy={PIVOT.y} r={12} fill="#26262b" stroke="#5c5d63" strokeWidth={1} />
        <circle cx={PIVOT.x} cy={PIVOT.y} r={4} fill="#9a9ca2" />
      </g>

      {/* speed knob + power light */}
      <circle cx={36} cy={210} r={11} fill="#2b2b31" stroke="#55565c" strokeWidth={1} />
      <line x1={36} y1={210} x2={36} y2={203} stroke="#c9cbd0" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={36} cy={178} r={2.4} fill={playing ? "#7dd3a0" : "#4a4b52"} />
    </svg>
  );
}
