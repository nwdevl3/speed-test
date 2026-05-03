import { useMemo } from 'react';

const CX = 160;
const CY = 160;
const RADIUS = 130;
const NEEDLE_LEN = 95;

// Angles in standard math: 0° = right, CCW positive
// We'll work in "rotation from 12 o'clock" for the SVG rotate() transform.
// 0 speed → 7 o'clock → -135° from 12 o'clock
// Max speed → 5 o'clock → +135° from 12 o'clock
// Sweep = 270°
const NEEDLE_MIN_DEG = -135;
const NEEDLE_MAX_DEG = 135;
const NEEDLE_SWEEP = NEEDLE_MAX_DEG - NEEDLE_MIN_DEG; // 270

// Arc geometry uses standard math angles (CSS-style: 0=right, CW positive)
const ARC_START = -225; // 7 o'clock in math coords
const ARC_END = 45;     // 5 o'clock in math coords
const ARC_SWEEP = ARC_END - ARC_START; // 270

const MAX_SPEED = 500;

function polarToCart(angleDeg, r) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

function describeArc(startAngle, endAngle, r) {
  const s = polarToCart(startAngle, r);
  const e = polarToCart(endAngle, r);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

function arcLength(r, angleDeg) {
  return (angleDeg / 360) * 2 * Math.PI * r;
}

export default function Speedometer({ speed = 0, phase = 'idle', label = 'ready' }) {
  const ratio = Math.min(speed / MAX_SPEED, 1);
  const totalLen = arcLength(RADIUS, ARC_SWEEP);
  const fillOffset = totalLen * (1 - ratio);

  // Needle rotation in degrees from 12 o'clock
  const needleDeg = NEEDLE_MIN_DEG + NEEDLE_SWEEP * ratio;

  // Choose transition based on phase
  const isFast = phase !== 'idle' && phase !== 'complete';
  const needleTransition = isFast
    ? 'transform 0.08s linear'
    : 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';

  // Tick marks (memoized — never changes)
  const ticks = useMemo(() => {
    const items = [];
    const speeds = [0, 50, 100, 150, 200, 300, 400, 500];
    for (let i = 0; i <= 40; i++) {
      const angle = ARC_START + (ARC_SWEEP * i) / 40;
      const isMajor = i % 5 === 0;
      const outerR = RADIUS - 8;
      const innerR = outerR - (isMajor ? 12 : 6);
      const p1 = polarToCart(angle, innerR);
      const p2 = polarToCart(angle, outerR);

      items.push(
        <line
          key={`tick-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
          strokeWidth={isMajor ? 1.5 : 0.75}
          strokeLinecap="round"
        />
      );

      if (isMajor && speeds[i / 5] !== undefined) {
        const lp = polarToCart(angle, outerR + 14);
        items.push(
          <text
            key={`label-${i}`}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            {speeds[i / 5]}
          </text>
        );
      }
    }
    return items;
  }, []);

  return (
    <div className="speedometer-wrapper">
      <svg className="speedometer-svg" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Subtle center glow */}
        <circle cx={CX} cy={CY} r="80" fill="url(#centerGlow)" />

        {/* Track (background arc) */}
        <path
          d={describeArc(ARC_START, ARC_END, RADIUS)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Fill arc */}
        <path
          d={describeArc(ARC_START, ARC_END, RADIUS)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={totalLen}
          strokeDashoffset={fillOffset}
          filter="url(#arcGlow)"
          style={{
            transition: phase === 'complete'
              ? 'stroke-dashoffset 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'stroke-dashoffset 0.08s linear',
          }}
        />

        {/* Tick marks */}
        {ticks}

        {/*
          Needle — drawn pointing straight UP from center,
          rotated with native SVG transform="rotate(deg, cx, cy)"
          and animated via CSS transition.
        */}
        <g
          transform={`rotate(${needleDeg}, ${CX}, ${CY})`}
          style={{ transition: needleTransition }}
        >
          {/* Needle line: from center upward */}
          <line
            x1={CX}
            y1={CY + 14}
            x2={CX}
            y2={CY - NEEDLE_LEN}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#needleGlow)"
            opacity="0.95"
          />
          {/* Thinner accent overlay for depth */}
          <line
            x1={CX}
            y1={CY + 8}
            x2={CX}
            y2={CY - NEEDLE_LEN + 6}
            stroke="var(--accent-cyan, #06b6d4)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Needle tip glow dot */}
          <circle
            cx={CX}
            cy={CY - NEEDLE_LEN}
            r="3"
            fill="#fff"
            opacity="0.9"
          />
        </g>

        {/* Center hub (not rotated — stays fixed) */}
        <circle cx={CX} cy={CY} r="6" fill="var(--bg-primary, #06090f)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="3" fill="#fff" opacity="0.85" />
        <circle cx={CX} cy={CY} r="1.5" fill="var(--accent-cyan, #06b6d4)" />

        {/* Gradient for needle line */}

      </svg>

      <div className="speed-display">
        <div className="speed-value">
          {phase === 'idle' ? '--' : speed >= 100 ? Math.round(speed) : speed.toFixed(1)}
        </div>
        <div className="speed-unit">Mbps</div>
        <div className="speed-label">{label}</div>
      </div>
    </div>
  );
}
