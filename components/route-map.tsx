/**
 * The hero illustration: a job hunt drawn as a transit map. One line runs from
 * Wish List to Offer and takes the colour of the stage it is heading into; a
 * branch leaves for Rejected. Decorative: the "Five stages" section says the
 * same in text. The line draws itself once on load.
 */

const LEGS = [
  { d: "M18,320 H60", color: "var(--stage-wish)", delay: 0, duration: 140 },
  { d: "M60,320 H150 L210,260 H250", color: "var(--stage-applied)", delay: 140, duration: 420 },
  { d: "M250,260 H330 L390,200 H410", color: "var(--stage-interviewing)", delay: 560, duration: 420 },
  { d: "M410,200 H440 L500,140 V96", color: "var(--stage-offer)", delay: 980, duration: 420 },
  { d: "M410,200 L470,260 V300", color: "var(--stage-rejected)", delay: 980, duration: 420 },
];

const STOPS = [
  { name: "Wish List", x: 60, y: 320, lx: 60, ly: 358, anchor: "middle" as const, delay: 140 },
  { name: "Applied", x: 250, y: 260, lx: 250, ly: 236, anchor: "middle" as const, delay: 560 },
  { name: "Interviewing", x: 410, y: 200, lx: 422, ly: 176, anchor: "end" as const, delay: 980 },
  { name: "Offer", x: 500, y: 96, lx: 480, ly: 103, anchor: "end" as const, delay: 1400 },
  { name: "Rejected", x: 470, y: 300, lx: 490, ly: 307, anchor: "start" as const, delay: 1400 },
];

export default function RouteMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 380" className={className} aria-hidden="true" focusable="false">
      {LEGS.map((leg) => (
        <path
          key={leg.d}
          d={leg.d}
          pathLength={1}
          fill="none"
          strokeWidth={10}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="map-line"
          style={{
            stroke: leg.color,
            animationDelay: `${leg.delay}ms`,
            animationDuration: `${leg.duration}ms`,
          }}
        />
      ))}
      {STOPS.map((stop) => (
        <g key={stop.name} className="map-stop" style={{ animationDelay: `${stop.delay}ms` }}>
          <circle cx={stop.x} cy={stop.y} r={10} strokeWidth={5} style={{ fill: "var(--paper)", stroke: "var(--ink)" }} />
          <text
            x={stop.lx}
            y={stop.ly}
            textAnchor={stop.anchor}
            style={{ fill: "var(--ink)", fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}
          >
            {stop.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
