import { motion, AnimatePresence } from 'framer-motion';

const CX = 160;
const CY = 160;
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Speedometer({ speed = 0, phase = 'idle', label = 'ready' }) {
  const ratio = Math.min(speed / 1000, 1); // Supporting up to 1Gbps visually
  const offset = CIRCUMFERENCE - ratio * CIRCUMFERENCE;

  return (
    <div className="speedometer-wrapper futuristic">
      <div className="aura-container">
        <motion.div 
          className="speed-aura"
          animate={{ 
            scale: [1, 1 + ratio * 0.5, 1],
            opacity: [0.1, 0.2 + ratio * 0.3, 0.1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `var(--download-color)` }}
        />
      </div>

      <svg className="speedometer-svg" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-cyan)" />
            <stop offset="100%" stopColor="var(--accent-teal)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Ring */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-strong)"
          strokeWidth="4"
          opacity="0.2"
        />

        {/* Progress Ring */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          style={{ 
            filter: 'url(#glow)',
            transform: 'rotate(90deg)',
            transformOrigin: 'center'
          }}
        />

        {/* Secondary Inner Pulse Ring */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={RADIUS - 20}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="1"
          opacity="0.3"
          animate={{ 
            scale: [0.95, 1.05, 0.95],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </svg>

      <div className="speed-display">
        <AnimatePresence mode="wait">
          <motion.div 
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="speed-label-top"
          >
            {label.toUpperCase()}
          </motion.div>
        </AnimatePresence>
        
        <div className="speed-value-container">
          <motion.span 
            className="speed-value"
            animate={{ scale: phase === 'idle' ? 1 : [1, 1.02, 1] }}
            transition={{ duration: 0.2 }}
          >
            {phase === 'idle' ? '0' : speed >= 100 ? Math.round(speed) : speed.toFixed(1)}
          </motion.span>
          <span className="speed-unit">Mbps</span>
        </div>

        <div className="speed-stats-mini">
          <div className="mini-stat">
            <span className="dot download"></span>
            LIVE BANDWIDTH
          </div>
        </div>
      </div>
    </div>
  );
}
