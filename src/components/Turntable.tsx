"use client";

/* A three-quarter view of a belt-drive deck, drawn as a flat projection rather
   than real 3D. Every circle in the object's top plane becomes an ellipse with
   the same squash factor K, so the platter, record, spindle and feet all sit in
   one consistent plane and the whole thing reads as a single solid.

   Three rules keep it convincing, and breaking any one makes it collapse into
   a decal printed on a black rectangle:

     - anything lying flat on the deck is drawn inside flatten(), anything
       standing up out of it is drawn outside;
     - anything representing a reflection is drawn outside the record's
       spinning group, because a specular is fixed in world space;
     - every solid that meets another solid gets a contact shadow. Objects that
       do not darken what they sit on read as pasted on, however well lit. */

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

/* All four disc artworks draw their centre circle — a paper label on the three
   labelled discs, the black roundel on the anthm picture disc — at the same
   0.4694 of the artwork radius. That was measured off the pixels rather than
   guessed, and because it holds for every disc it can be treated as a real
   material boundary: the gloss layers are masked out inside it, so the centre
   reads as matte against glossy vinyl on the labelled discs and as the
   un-laminated roundel on the picture disc. Nothing here reconstructs the
   artwork; it only lights whatever the PNG supplies. */
const LABEL_R = RECORD_R * 0.4694;

/* Vinyl is thin, but at this elevation the edge is visible, and its absence is
   most of why a record reads as a sticker rather than a pressing. */
const RECORD_H = 5;

/* Direction shadows fall, in the deck's own pre-squash plane: the key light is
   up and to the left, so everything casts down and right. How far is set by
   how high the caster sits, so each one gets its own offset rather than
   sharing a single number — the platter stands 20 units off the plinth, the
   record only 5 off the platter, and using the platter's offset for the record
   swallows the whole visible ring of platter and the two merge into one black
   shape on the shaded side. */
const CAST = { x: 10, y: 12 };
const RECORD_CAST = { x: 5, y: 6 };

/* Where the tonearm pivots, and how far it swings to park. */
const PIVOT = { x: 770, y: 168 };
/* Negative parks it. CSS rotates clockwise, and the arm reaches down-left from
   the pivot, so a positive angle sweeps the headshell further across the
   platter — i.e. it parks in the middle of the record. Negative swings it out
   to the right, clear of the platter, onto the rest below. */
const ARM_PARKED_DEG = -20;
const ARM_PLAYING_DEG = 0;
/* Where the headshell lands at ARM_PARKED_DEG, found by rotating the arm tip
   about the pivot: (x,y) = PIVOT + R(-20 deg) * (ARM_TIP - PIVOT). The rest is
   drawn there so the arm has something to sit on.

   -14 degrees left the rest post standing on the polished rim of the platter,
   which at any real zoom reads as a post growing out of the platter. -20 puts
   both the post and the parked headshell clear of the rim and onto the plinth,
   where an arm rest actually lives, without moving the pivot or the playing
   position. Literal rather than computed, so no trig reaches the DOM. */
const ARM_REST = { x: 643, y: 304 };
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

/* Deterministic 0..1 jitter for the machining rings, so they vary in weight
   the way a turned surface does instead of marching in a perfect sequence.
   Integer multiply-and-modulo rather than Math.random (which would differ
   between the server render and the client) and rather than trig (see above).
   i * 2654435761 stays well under 2^53 for the counts used here, so the
   product is exact and the result is bit-identical on both sides. */
const jitter = (i: number, salt: number) => ((i + salt) * 2654435761) % 1000 / 1000;

/* A point on a circle, rounded to 3dp before it can reach the DOM. Trig is the
   one thing in this file that is not guaranteed identical across engines, so
   every coordinate derived from it is rounded past the point where a last-bit
   difference could change the serialised string. */
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [+(cx + r * Math.cos(a)).toFixed(3), +(cy + r * Math.sin(a)).toFixed(3)] as const;
};

/* An annular wedge: out along the outer radius from a0 to a1, back along the
   inner one. Used to shape where the grooves catch the light. */
function wedge(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number) {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const [x0, y0] = polar(cx, cy, rOut, a0);
  const [x1, y1] = polar(cx, cy, rOut, a1);
  const [x2, y2] = polar(cx, cy, rIn, a1);
  const [x3, y3] = polar(cx, cy, rIn, a0);
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
}

/* Groove radii. One shared set drives the pressed grooves (which spin with the
   record) and the glint rings (which do not), so the two stay registered
   instead of beating against each other.

   Dense and very low contrast on purpose. A moderate count at readable
   contrast is what an earlier pass did, and it read as corrugated iron: evenly
   spaced high-contrast rings are a printed pattern, not a surface. At this
   density the rings average into a tone rather than resolving individually,
   which is also what saves them at 375px where the squash bunches them
   four-to-one near the top and bottom of the ellipse — low-contrast sub-pixel
   rings blend, high-contrast ones moiré. The structure the eye actually reads
   at any size comes from TRACK_GAPS and from the glint arc. */
const GROOVE_R = rings(LABEL_R + 4, RECORD_R * 0.972, 64);
/* Track gaps — the smooth lands between bands on a real LP, and the only
   groove feature meant to be individually visible. Fractions of the play
   area, not of the disc. */
const TRACK_GAPS = [0.17, 0.39, 0.58, 0.79];

/* How far the arm's shadow falls from the arm. The tube rides ~18 units above
   the record, and the key light is up and to the left at roughly 45 degrees,
   so the shadow lands that far down-right — squashed vertically like anything
   else lying in the deck's plane. */
const ARM_CAST = { x: 17, y: 8 };

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
      /* The record falls in from above the deck, which means from outside the
         viewBox. An SVG root clips to its viewBox by default, so without this
         the disc would appear at the top edge rather than arriving from off
         it. Nothing sits above the turntable but header padding, so there is
         room for it to fall through. */
      style={{ overflow: "visible" }}
    >
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
        <radialGradient id="tt-platter" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#eef0f3" />
          <stop offset="26%" stopColor="#d3d6db" />
          <stop offset="55%" stopColor="#a4a7ae" />
          <stop offset="80%" stopColor="#84878e" />
          <stop offset="100%" stopColor="#6e7178" />
        </radialGradient>
        {/* The radial above brightens toward the light but does not darken
            enough away from it, and a platter that stays light all the way to
            the lower right reads as painted card. This is the falloff. */}
        <linearGradient id="tt-platter-shade" x1="0.08" y1="0.02" x2="0.94" y2="0.98">
          <stop offset="0%" stopColor="rgba(24,28,38,0)" />
          <stop offset="30%" stopColor="rgba(24,28,38,0.05)" />
          <stop offset="66%" stopColor="rgba(24,28,38,0.26)" />
          <stop offset="100%" stopColor="rgba(24,28,38,0.5)" />
        </linearGradient>
        {/* Turned aluminium is anisotropic: the circular tool path smears the
            source into two opposed lobes along the light axis rather than one
            round pool. This is the bowtie; it is rotated onto that axis where
            it is used. */}
        <radialGradient id="tt-aniso" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.11)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Rim, lit across its width: bright where it faces the light at the
            front-left, falling away to the right. */}
        <linearGradient id="tt-rim-across" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d7077" />
          <stop offset="14%" stopColor="#b8bbc1" />
          <stop offset="26%" stopColor="#e2e5ea" />
          <stop offset="40%" stopColor="#a8abb2" />
          <stop offset="62%" stopColor="#7a7d84" />
          <stop offset="82%" stopColor="#5d6066" />
          <stop offset="100%" stopColor="#3f4248" />
        </linearGradient>
        {/* ...multiplied by a vertical pass for the shadow under the lip and
            the bounce coming back up off the plinth. */}
        <linearGradient id="tt-rim-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.40)" />
          <stop offset="30%" stopColor="rgba(0,0,0,0.04)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.10)" />
          <stop offset="88%" stopColor="rgba(0,0,0,0.34)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
        </linearGradient>
        {/* Top lip: brightest at the front-left, not a uniform white ring. */}
        <linearGradient id="tt-lip" x1="0" y1="0.2" x2="1" y2="0.9">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>

        {/* ---- record ---- */}
        {/* The broad sheen. Vinyl is glossy enough to mirror the softbox, so
            this is much stronger and much more local than a matte surface's
            would be, and it falls off fast enough to leave the far side dark. */}
        <radialGradient id="tt-vinyl-sheen" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.13)" />
          <stop offset="66%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Everything the sheen does not reach goes darker than the artwork,
            which is what stops a pale picture disc reading as flat paper. */}
        <linearGradient id="tt-vinyl-shade" x1="0.12" y1="0.06" x2="0.9" y2="0.96">
          <stop offset="0%" stopColor="rgba(4,5,10,0)" />
          <stop offset="46%" stopColor="rgba(4,5,10,0.06)" />
          <stop offset="78%" stopColor="rgba(4,5,10,0.20)" />
          <stop offset="100%" stopColor="rgba(4,5,10,0.30)" />
        </linearGradient>
        {/* Vinyl rolls off at the edge, so the last few millimetres turn away
            from the light and go dark all the way round. */}
        <radialGradient id="tt-vinyl-edge-ao" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="94%" stopColor="rgba(0,0,0,0)" />
          <stop offset="98.5%" stopColor="rgba(0,0,0,0.26)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
        {/* The label is paper: it takes diffuse shading only, never a
            specular, so this is wide, weak and has no hot centre. */}
        <linearGradient id="tt-label-diffuse" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
          <stop offset="34%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="58%" stopColor="rgba(0,0,0,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.32)" />
        </linearGradient>
        {/* Vinyl edge wall — a few millimetres of cylinder, lit like the
            platter rim but far darker. */}
        <linearGradient id="tt-vinyl-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0a0a0d" />
          <stop offset="22%" stopColor="#3b3d45" />
          <stop offset="45%" stopColor="#1a1b20" />
          <stop offset="100%" stopColor="#050508" />
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
        {/* Knob wall: a cylinder seen side-on returns a bright band where it
            faces the light and darkens fast round both shoulders, which two
            flat fills cannot do. */}
        <linearGradient id="tt-knob-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#63666c" />
          <stop offset="18%" stopColor="#c2c5cb" />
          <stop offset="38%" stopColor="#8e9198" />
          <stop offset="72%" stopColor="#6a6d73" />
          <stop offset="100%" stopColor="#45484d" />
        </linearGradient>
        <linearGradient id="tt-weight" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#4a4a52" />
          <stop offset="45%" stopColor="#2b2b31" />
          <stop offset="100%" stopColor="#151519" />
        </linearGradient>

        {/* Ground shadow. Tight and dark right under the slab, gone by the time
            it is half a plinth away — a wide even haze reads as fog, not
            contact. */}
        <radialGradient id="tt-shadow-soft" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(18,18,24,0.30)" />
          <stop offset="42%" stopColor="rgba(18,18,24,0.13)" />
          <stop offset="74%" stopColor="rgba(18,18,24,0.03)" />
          <stop offset="100%" stopColor="rgba(18,18,24,0)" />
        </radialGradient>

        <filter id="tt-blur-core" x="-30%" y="-120%" width="160%" height="340%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="tt-blur-spec" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        {/* Cast shadows are soft but not formless — a large source at this
            distance gives a penumbra of a few millimetres, not a fog bank. */}
        <filter id="tt-blur-cast" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="tt-blur-contact" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        {/* Feathers the glint wedge so the grooves fade in and out of the lit
            arc instead of switching on at a hard edge. */}
        <filter id="tt-blur-wedge" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="16" />
        </filter>

        <clipPath id="tt-platter-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} />
        </clipPath>
        <clipPath id="tt-record-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} />
        </clipPath>
        <clipPath id="tt-plinth-clip" clipPathUnits="userSpaceOnUse">
          <polygon points={pts(TOP.bl, TOP.br, TOP.fr, TOP.fl)} />
        </clipPath>


        {/* Vinyl gloss goes everywhere on the disc except the label: paper does
            not carry a specular, and letting the sheen run across the label is
            the single thing that most makes a record look printed on. */}
        <mask id="tt-vinyl-mask" maskUnits="userSpaceOnUse"
              x={PLATTER.cx - RECORD_R} y={PLATTER.cy - RECORD_R} width={RECORD_R * 2} height={RECORD_R * 2}>
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} fill="#fff" />
          <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R} fill="#000" />
        </mask>
        {/* Which way a hairline faces the light. A full ring stroked through
            one of these fades out as it turns away, which is what an edge
            highlight actually does. The alternative — an arc spanning only the
            lit sector — stops dead at its endpoints, and at this size those
            bright dashes read as drawing artefacts. Sized to the platter so
            the platter's machined step can share them. */}
        <radialGradient id="tt-side-falloff" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#c8c8c8" />
          <stop offset="78%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <mask id="tt-lightside" maskUnits="userSpaceOnUse"
              x={PLATTER.cx - PLATTER.r - 60} y={PLATTER.cy - PLATTER.r - 60} width={PLATTER.r * 2 + 120} height={PLATTER.r * 2 + 120}>
          <circle cx={PLATTER.cx - 128} cy={PLATTER.cy - 128} r={280} fill="url(#tt-side-falloff)" />
        </mask>
        <mask id="tt-darkside" maskUnits="userSpaceOnUse"
              x={PLATTER.cx - PLATTER.r - 60} y={PLATTER.cy - PLATTER.r - 60} width={PLATTER.r * 2 + 120} height={PLATTER.r * 2 + 120}>
          <circle cx={PLATTER.cx + 128} cy={PLATTER.cy + 128} r={280} fill="url(#tt-side-falloff)" />
        </mask>
        {/* Where the grooves catch. Two wedges: the strong one facing the key
            light at the upper left, and the weak opposed lobe you always get
            back off a circular reflector. */}
        <mask id="tt-glint-mask" maskUnits="userSpaceOnUse"
              x={PLATTER.cx - RECORD_R} y={PLATTER.cy - RECORD_R} width={RECORD_R * 2} height={RECORD_R * 2}>
          <g filter="url(#tt-blur-wedge)">
            {/* Centred on 225 degrees, which is the upper left of the ellipse
                once the squash is applied. Kept to about a hundred degrees:
                a wider wedge lights the grooves most of the way round and the
                disc loses its light direction entirely. */}
            <path d={wedge(PLATTER.cx, PLATTER.cy, LABEL_R + 6, RECORD_R - 4, 176, 276)} fill="#fff" />
            <path d={wedge(PLATTER.cx, PLATTER.cy, LABEL_R + 6, RECORD_R - 4, 18, 72)} fill="#3d3d3d" />
          </g>
        </mask>
      </defs>

      {/* Contact shadow, two layers: a tight dark core following the plinth's
          footprint and a narrower faint halo. A single even ellipse reads as
          fog rather than as a slab standing on a surface. */}
      <ellipse cx={572} cy={382} rx={318} ry={30} fill="url(#tt-shadow-soft)" />
      <polygon
        points={pts(
          [TOP.fl[0] + 14, TOP.fl[1] + PLINTH_H],
          [TOP.fr[0] - 14, TOP.fr[1] + PLINTH_H],
          [TOP.fr[0] - 30, TOP.fr[1] + PLINTH_H + 19],
          [TOP.fl[0] + 30, TOP.fl[1] + PLINTH_H + 19],
        )}
        fill="rgba(14,14,20,0.52)"
        filter="url(#tt-blur-core)"
      />

      {/* feet, behind the plinth body */}
      {[
        [322, 358],
        [816, 358],
      ].map(([x, y]) => (
        <g key={x}>
          {/* the foot's own contact patch, darker and tighter than the slab's */}
          <ellipse cx={x + 4} cy={y + 17} rx={19} ry={7} fill="rgba(10,10,14,0.55)" filter="url(#tt-blur-contact)" />
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

      {/* The platter's shadow on the plinth. Drawn in screen space as an
          already-squashed ellipse rather than inside flatten(), because it has
          to be clipped to the plinth top, which is not in that group. */}
      <g clipPath="url(#tt-plinth-clip)">
        <ellipse
          cx={PLATTER.cx + CAST.x}
          cy={PLATTER.cy + PLATTER_H + CAST.y * K}
          rx={PLATTER.r + 3}
          ry={(PLATTER.r + 3) * K}
          fill="rgba(6,6,10,0.62)"
          filter="url(#tt-blur-cast)"
        />
      </g>

      {/* Light bounced off the polished rim onto the plinth right beside it.
          Only on the light side: the opposite side is where the platter's own
          shadow is, and lighting both would cancel the contact. */}
      <g clipPath="url(#tt-plinth-clip)">
        <ellipse
          cx={PLATTER.cx}
          cy={PLATTER.cy + PLATTER_H + 4}
          rx={PLATTER.r + 16}
          ry={(PLATTER.r + 16) * K}
          fill="none"
          stroke="rgba(206,218,236,0.07)"
          strokeWidth={30}
          filter="url(#tt-blur-cast)"
          mask="url(#tt-lightside)"
        />
      </g>

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
            turned metal rather than painted sheet. Weight and opacity are
            jittered so the surface has grain instead of a printed screen — an
            evenly stepped set reads as a pattern the moment you look at it. */}
        <g clipPath="url(#tt-platter-clip)">
          {rings(PLATTER.r * 0.17, PLATTER.r * 0.995, 128).map((r, i) => {
            const j = jitter(i, 7);
            return (
              <circle
                key={r}
                cx={PLATTER.cx}
                cy={PLATTER.cy}
                r={r}
                fill="none"
                stroke={i % 2 ? `rgba(255,255,255,${(0.02 + j * 0.055).toFixed(3)})` : `rgba(48,52,60,${(0.015 + j * 0.05).toFixed(3)})`}
                strokeWidth={+(0.3 + j * 0.55).toFixed(2)}
              />
            );
          })}
          {/* A sparse second pass of heavier marks. Real turning leaves a fine
              uniform grain with occasional deeper passes; grain alone at this
              scale just averages back to flat grey. */}
          {rings(PLATTER.r * 0.14, PLATTER.r * 0.97, 17).map((r, i) => {
            const j = jitter(i, 23);
            return (
              <circle
                key={`t${r}`}
                cx={PLATTER.cx}
                cy={PLATTER.cy}
                r={r + j * 3}
                fill="none"
                stroke={`rgba(70,76,86,${(0.05 + j * 0.07).toFixed(3)})`}
                strokeWidth={+(0.7 + j * 0.9).toFixed(2)}
              />
            );
          })}
        </g>

        {/* Falloff away from the light, over the grain so the striations dim
            with the surface rather than staying uniformly bright. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r} fill="url(#tt-platter-shade)" />

        {/* The anisotropic sweep: two opposed lobes along the light axis,
            which is what separates turned aluminium from a painted disc. The
            long axis is put on the light direction by rotating the group —
            a transform, so no generated trig reaches the DOM. */}
        <g clipPath="url(#tt-platter-clip)" transform={`rotate(45 ${PLATTER.cx} ${PLATTER.cy})`}>
          {/* Offset back along the light axis rather than centred: a symmetric
              bowtie relights the shaded half and cancels the falloff, which is
              what an earlier pass did and it flattened the disc out again. */}
          <ellipse cx={PLATTER.cx - 44} cy={PLATTER.cy - 44} rx={PLATTER.r * 0.92} ry={PLATTER.r * 0.26} fill="url(#tt-aniso)" />
        </g>

        {/* The prominent machined step from the reference. A step is a small
            wall, so it cannot be an evenly weighted ring: the inner face
            catches the light on one side of the disc and is in shadow on the
            other, which is the difference between a machined edge and a drawn
            circle. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48} fill="none" stroke="rgba(92,97,106,0.30)" strokeWidth={8} />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 - 4.4} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.6} />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 - 4.4} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth={1.6} mask="url(#tt-lightside)" />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 + 4.4} fill="none" stroke="rgba(46,50,58,0.14)" strokeWidth={1.4} />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r * 0.48 + 4.4} fill="none" stroke="rgba(40,44,52,0.5)" strokeWidth={1.4} mask="url(#tt-darkside)" />

        {/* Spindle hub. Concentric rings run out of circumference near the
            centre and start resolving individually, which reads as record
            grooves rather than a turned face — every real platter has a raised
            boss here instead, so draw the boss and stop the rings short of it. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={30} fill="rgba(255,255,255,0.06)" />
        <circle cx={PLATTER.cx + 3} cy={PLATTER.cy + 3} r={31} fill="none" stroke="rgba(36,40,48,0.35)" strokeWidth={2.4}
                filter="url(#tt-blur-contact)" mask="url(#tt-darkside)" />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={29.4} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.4}
                mask="url(#tt-lightside)" />
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={29.4} fill="none" stroke="rgba(40,44,52,0.28)" strokeWidth={1.4}
                mask="url(#tt-darkside)" />

        {/* Specular pool, upper left. Clipped so it cannot spill off the rim. */}
        <g clipPath="url(#tt-platter-clip)">
          <ellipse
            cx={PLATTER.cx - 88}
            cy={PLATTER.cy - 82}
            rx={104}
            ry={80}
            fill="rgba(255,255,255,0.16)"
            filter="url(#tt-blur-spec)"
          />
        </g>

        {playing && (
          /* Keyed on the disc so switching between studies replays the drop:
             `playing` stays true across that change, so without a key the
             group would never remount and the record would simply swap. */
          <g key={disc}>
            {/* The record's own shadow on the platter. Left outside the falling
                group on purpose — a shadow belongs to the platter, not to the
                disc, so it fades in as the record arrives rather than riding
                down with it. */}
            <g
              clipPath="url(#tt-platter-clip)"
              className="motion-safe:animate-[record-shadow-in_150ms_ease-out_400ms_both]"
            >
              <circle
                cx={PLATTER.cx + RECORD_CAST.x}
                cy={PLATTER.cy + RECORD_CAST.y}
                r={RECORD_R + 1}
                fill="rgba(6,7,12,0.55)"
                filter="url(#tt-blur-contact)"
              />
            </g>

            {/* Everything that is the record itself falls together. The
                translate is in unsquashed units because this group sits inside
                flatten(), which multiplies vertical distance by K on the way to
                the screen — see the record-drop keyframes. */}
            <g
              /* 520ms duration, 150ms delay — in the animation shorthand the first
                 time is duration and the second is delay. The delay holds the
                 disc at the 0% frame (invisible, up high) until the page has
                 scrolled the deck into view, so the fall is never spent
                 off-screen. */
              className="motion-safe:animate-[record-drop_520ms_150ms_both]"
              style={{
                transformOrigin: `${PLATTER.cx}px ${PLATTER.cy}px`,
                transformBox: "view-box",
              }}
            >
            {/* Vinyl edge: the same cylinder-wall construction as the platter
                rim, only a few units tall. This is what gives the disc
                thickness instead of letting it lie in the platter's own plane. */}
            <path
              d={`M ${PLATTER.cx - RECORD_R} ${PLATTER.cy}
                  a ${RECORD_R} ${RECORD_R} 0 0 0 ${RECORD_R * 2} 0
                  l 0 ${RECORD_H / K}
                  a ${RECORD_R} ${RECORD_R} 0 0 1 ${-RECORD_R * 2} 0 z`}
              fill="url(#tt-vinyl-wall)"
            />

            {/* The rotation happens here, inside the squash, so the record
                turns in the platter's plane rather than spinning as a flat
                screen-space ellipse. Only things physically pressed into the
                disc belong in this group. */}
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
              {/* Pressed grooves: low contrast, uniform all the way round,
                  and stopping at the label because there is no modulation
                  under paper. The light-catching pass is separate and does
                  not live in this group. */}
              <g clipPath="url(#tt-record-clip)">
                {GROOVE_R.map((r, i) => {
                  const j = jitter(i, 3);
                  return (
                    <circle
                      key={r}
                      cx={PLATTER.cx}
                      cy={PLATTER.cy}
                      r={r}
                      fill="none"
                      stroke={i % 2
                        ? `rgba(255,255,255,${(0.018 + j * 0.03).toFixed(3)})`
                        : `rgba(0,0,0,${(0.05 + j * 0.09).toFixed(3)})`}
                      strokeWidth={+(0.4 + j * 0.5).toFixed(2)}
                    />
                  );
                })}
                {/* Track gaps: the smooth lands between bands. Slightly wider
                    and slightly brighter than the modulated groove either side. */}
                {TRACK_GAPS.map((f) => (
                  <circle
                    key={f}
                    cx={PLATTER.cx}
                    cy={PLATTER.cy}
                    r={LABEL_R + (RECORD_R * 0.972 - LABEL_R) * f}
                    fill="none"
                    stroke="rgba(0,0,0,0.30)"
                    strokeWidth={2.2}
                  />
                ))}
              </g>
            </g>

            {/* --- material response, all of it OUTSIDE the rotating group ---
                A reflection is fixed in world space. Every layer below is a
                light interaction rather than something pressed into the disc,
                so it stays put while the artwork turns underneath. The mask
                keeps all of it off the label, which is paper. */}
            <g mask="url(#tt-vinyl-mask)">
              {/* Grooves catching the light in an arc. Same radii as the
                  pressed grooves so the two register, but far higher contrast
                  and confined to the lit wedges. The pairing of a bright and a
                  dark hairline is what lets this read on both a near-black
                  disc (the white line carries it) and the pale anthm picture
                  disc (the dark one does). */}
              <g mask="url(#tt-glint-mask)" clipPath="url(#tt-record-clip)">
                {GROOVE_R.map((r, i) => {
                  const j = jitter(i, 11);
                  return (
                    <circle
                      key={r}
                      cx={PLATTER.cx}
                      cy={PLATTER.cy}
                      r={r + (i % 2 ? 0 : 1.4)}
                      fill="none"
                      stroke={i % 2
                        ? `rgba(255,255,255,${(0.2 + j * 0.26).toFixed(3)})`
                        : `rgba(0,0,0,${(0.12 + j * 0.16).toFixed(3)})`}
                      strokeWidth={+(0.45 + j * 0.4).toFixed(2)}
                    />
                  );
                })}
              </g>

              {/* The broad sweep itself, sitting over the glinting grooves. */}
              <g clipPath="url(#tt-record-clip)">
                <ellipse cx={PLATTER.cx - 82} cy={PLATTER.cy - 88} rx={190} ry={132} fill="url(#tt-vinyl-sheen)"
                         transform={`rotate(-28 ${PLATTER.cx - 82} ${PLATTER.cy - 88})`} />
                {/* The mirrored core of the source. A pure radial falloff is
                    the tell that a highlight is a gradient rather than a
                    reflection — glossy vinyl returns the softbox with an edge
                    to it, smeared tangentially by the grooves into a band. */}
                <path d={wedge(PLATTER.cx, PLATTER.cy, LABEL_R + 34, RECORD_R - 20, 192, 262)}
                      fill="rgba(255,255,255,0.1)" filter="url(#tt-blur-wedge)" />
                {/* Weak opposed lobe, the far side of the same reflection. */}
                <ellipse cx={PLATTER.cx + 74} cy={PLATTER.cy + 78} rx={140} ry={86} opacity={0.4}
                         fill="url(#tt-vinyl-sheen)"
                         transform={`rotate(-28 ${PLATTER.cx + 74} ${PLATTER.cy + 78})`} />
                {/* ...and the darkness everywhere else. */}
                <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} fill="url(#tt-vinyl-shade)" />
                {/* Fill bounced back off the white sweep the deck is shot on.
                    Without it the shaded side goes to dead black and the disc
                    loses its round edge against the platter. */}
                <path d={wedge(PLATTER.cx, PLATTER.cy, RECORD_R - 26, RECORD_R - 2, 8, 96)}
                      fill="rgba(176,190,214,0.1)" filter="url(#tt-blur-wedge)" />
                <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} fill="url(#tt-vinyl-edge-ao)" />
              </g>
            </g>

            {/* Label: matte paper, so diffuse shading only, and a physical
                edge where it sits proud of the vinyl. Non-rotating for the
                same reason as everything above — this is light, not print. */}
            <g clipPath="url(#tt-record-clip)">
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R} fill="url(#tt-label-diffuse)" />
              {/* Paper thickness. The label is a disc of card lying on the
                  vinyl, so its edge catches light on one side and drops a
                  shadow on the other — a ring of even darkness all the way
                  round would just read as a drawn outline. */}
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R + 2.4} fill="none"
                      stroke="rgba(0,0,0,0.12)" strokeWidth={3.4} filter="url(#tt-blur-contact)" />
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R + 2.4} fill="none"
                      stroke="rgba(0,0,0,0.5)" strokeWidth={4.2} filter="url(#tt-blur-contact)"
                      mask="url(#tt-darkside)" />
              {/* The raised land of vinyl immediately outside the label. */}
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R + 4.6} fill="none"
                      stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} mask="url(#tt-lightside)" />
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R - 0.5} fill="none"
                      stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} mask="url(#tt-lightside)" />
              <circle cx={PLATTER.cx} cy={PLATTER.cy} r={LABEL_R - 0.5} fill="none"
                      stroke="rgba(0,0,0,0.26)" strokeWidth={1.5} mask="url(#tt-darkside)" />
            </g>

            {/* Outer edge of the disc: dark seam under the lip, then a lit
                hairline on the light side only. */}
            <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
            <circle cx={PLATTER.cx} cy={PLATTER.cy} r={RECORD_R - 0.8} fill="none"
                    stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} mask="url(#tt-lightside)" />
            </g>
          </g>
        )}

        {/* A dark seam right under the lip: without it the rim melts into the
            face and the platter loses its thickness. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r - 0.5} fill="none" stroke="rgba(40,44,52,0.35)" strokeWidth={1.2} />

        {/* Bright top lip, graded so it is strongest at the front-left. */}
        <circle cx={PLATTER.cx} cy={PLATTER.cy} r={PLATTER.r - 1.2} fill="none" stroke="url(#tt-lip)" strokeWidth={2.4} />
      </g>

      {/* The tonearm's shadow on whatever is under it. Drawn in screen space
          with the same rotation as the arm so the two stay locked together,
          and clipped to the plinth rather than to the platter: parked, the arm
          hangs over the plinth and a platter-only clip left the headshell with
          no contact shadow at all, floating. One offset serves both surfaces —
          the platter is 20 units higher so its shadow is strictly a little
          short, which a penumbra this soft absorbs. */}
      <g clipPath="url(#tt-plinth-clip)">
        <g
          style={{
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
            transformBox: "view-box",
            rotate: `${playing ? ARM_PLAYING_DEG : ARM_PARKED_DEG}deg`,
          }}
          className="tt-arm"
          data-cued={playing || undefined}
        >
          <line
            x1={PIVOT.x + ARM_CAST.x}
            y1={PIVOT.y + ARM_CAST.y}
            x2={ARM_TIP.x + ARM_CAST.x}
            y2={ARM_TIP.y + ARM_CAST.y}
            stroke="rgba(3,4,9,0.6)"
            strokeWidth={11}
            strokeLinecap="round"
            filter="url(#tt-blur-cast)"
          />
          {/* The headshell is a much bigger block than the tube and drops a
              correspondingly heavier shadow, which is the part that actually
              reads against near-black vinyl. */}
          <ellipse
            cx={ARM_TIP.x + ARM_CAST.x + 4}
            cy={ARM_TIP.y + ARM_CAST.y + 2}
            rx={26}
            ry={13}
            fill="rgba(3,4,9,0.7)"
            filter="url(#tt-blur-cast)"
          />
          {/* The stylus is the one part actually touching, so its shadow has
              almost no offset and almost no penumbra. This tiny hard mark is
              what says the rest of the arm is floating above the disc — the
              soft shadow alone reads as a smudge. */}
          <ellipse
            cx={ARM_TIP.x + 14}
            cy={ARM_TIP.y + 17}
            rx={7}
            ry={3.4}
            fill="rgba(2,3,8,0.75)"
            filter="url(#tt-blur-contact)"
          />
        </g>
      </g>

      {/* The spindle stands up out of the platter, so it is drawn outside the
          squash — vertical things keep their true height — and last, so it
          reads as passing through the record's centre hole. */}
      <g transform={flatten(PLATTER.cy)}>
        <ellipse cx={PLATTER.cx + 3} cy={PLATTER.cy + 5} rx={11} ry={11} fill="rgba(0,0,0,0.34)" filter="url(#tt-blur-contact)" />
      </g>
      <path d={`M ${PLATTER.cx - 3.4} ${PLATTER.cy} L ${PLATTER.cx - 2.2} ${PLATTER.cy - 27} L ${PLATTER.cx + 2.2} ${PLATTER.cy - 27} L ${PLATTER.cx + 3.4} ${PLATTER.cy} Z`} fill="url(#tt-chrome)" />
      <ellipse cx={PLATTER.cx} cy={PLATTER.cy - 27} rx={2.2} ry={1.2} fill="#fafbfc" />

      {/* Speed knob, standing proud of the plinth */}
      <g>
        <ellipse cx={324} cy={306} rx={30} ry={11} fill="rgba(4,4,8,0.6)" filter="url(#tt-blur-contact)" />
        <ellipse cx={318} cy={302} rx={24} ry={10} fill="#5c5f65" />
        <rect x={294} y={288} width={48} height={14} fill="url(#tt-knob-wall)" />
        <rect x={294} y={288} width={48} height={3.5} fill="rgba(0,0,0,0.22)" />
        <ellipse cx={318} cy={288} rx={24} ry={10} fill="url(#tt-chrome)" />
        {/* Turned top: fine concentric marks, same treatment as the platter,
            then a rim that is only bright where it faces the light. */}
        {rings(5, 21, 7).map((r, i) => (
          <ellipse key={r} cx={318} cy={288} rx={r} ry={r * 0.42} fill="none"
                   stroke={i % 2 ? "rgba(255,255,255,0.07)" : "rgba(70,74,82,0.05)"} strokeWidth={0.55} />
        ))}
        {/* Falloff across the top face, so the knob is not a white chip. */}
        <ellipse cx={324} cy={291} rx={22} ry={9} fill="rgba(46,50,58,0.22)" />
        {/* Reusing the platter's lip gradient: same job, same light, and it
            fades round the back instead of ending in a hard bright dash. */}
        <ellipse cx={318} cy={288} rx={24} ry={10} fill="none" stroke="url(#tt-lip)" strokeWidth={1.5} />
        <ellipse cx={311} cy={285.5} rx={10} ry={3.6} fill="rgba(255,255,255,0.2)" />
      </g>

      {/* Tonearm mounting base, flat on the plinth. Without it the pivot
          assembly reads as floating above the deck. */}
      <ellipse cx={PIVOT.x + 6} cy={PIVOT.y + 38} rx={34} ry={14} fill="rgba(4,4,8,0.66)" filter="url(#tt-blur-contact)" />
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
        }}
        className="tt-arm"
        data-cued={playing || undefined}
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
          {/* Finger lift, a thin rod rather than a slab. */}
          <line x1={-20} y1={-6} x2={4} y2={-6} stroke="#7f838a" strokeWidth={4.4} strokeLinecap="round" />
          <line x1={-20} y1={-7.2} x2={4} y2={-7.2} stroke="rgba(255,255,255,0.7)" strokeWidth={1.4} strokeLinecap="round" />
          {/* Where the block meets the tube, occluded on the underside. */}
          <rect x={-14} y={-11} width={42} height={21} rx={4} fill="#3a3a42" stroke="#82858c" strokeWidth={1.3} />
          <rect x={-12} y={-8.5} width={38} height={6} rx={3} fill="rgba(255,255,255,0.24)" />
          <rect x={-12} y={5} width={38} height={4} rx={2} fill="rgba(0,0,0,0.35)" />
          <rect x={6} y={4} width={20} height={9} rx={2} fill="#1d1d22" />
          <rect x={7.5} y={5} width={17} height={2.4} rx={1.2} fill="rgba(255,255,255,0.22)" />
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
