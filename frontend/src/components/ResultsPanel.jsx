import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const MINI_ARC_PATH = 'M 8 38 A 30 30 0 0 1 68 38';
const MINI_ARC_LEN = 94; // approximate

function AnimatedNumber({ value, duration = 1200 }) {
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = prevValue.current;
    const target = value;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (target - start) * eased;
      el.textContent = current >= 100 ? Math.round(current) : current.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else prevValue.current = target;
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span ref={ref}>--</span>;
}

function getQuality(download) {
  if (download >= 100) return { label: 'Excellent', cls: 'excellent', icon: '🚀' };
  if (download >= 50) return { label: 'Good', cls: 'good', icon: '✓' };
  if (download >= 20) return { label: 'Fair', cls: 'fair', icon: '⚡' };
  return { label: 'Poor', cls: 'poor', icon: '⚠' };
}

export default function ResultsPanel({ results, server, visible }) {
  if (!visible || !results) return null;

  const quality = getQuality(results.download);

  const cards = [
    {
      type: 'download',
      icon: '↓',
      label: 'Download',
      value: results.download,
      unit: 'Mbps',
      color: 'var(--download-color)',
      ratio: Math.min(results.download / 500, 1),
    },
    {
      type: 'upload',
      icon: '↑',
      label: 'Upload',
      value: results.upload,
      unit: 'Mbps',
      color: 'var(--upload-color)',
      ratio: Math.min(results.upload / 500, 1),
    },
    {
      type: 'ping',
      icon: '◉',
      label: 'Ping',
      value: results.ping,
      unit: 'ms',
      color: 'var(--ping-color)',
      ratio: Math.min(results.ping / 200, 1),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Quality badge */}
      <div style={{ textAlign: 'center' }}>
        <motion.div
          className={`quality-badge ${quality.cls}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span>{quality.icon}</span>
          <span>{quality.label} Connection</span>
        </motion.div>
      </div>

      {/* Result cards */}
      <div className="results-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.type}
            className={`result-card ${card.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
          >
            <div className="result-icon">{card.icon}</div>
            <div className="result-label">{card.label}</div>
            <div className="result-value">
              <AnimatedNumber value={card.value} />
            </div>
            <div className="result-unit">{card.unit}</div>

            {/* Mini gauge */}
            <svg className="mini-gauge" viewBox="0 0 76 42">
              <path
                className="mini-gauge-track"
                d={MINI_ARC_PATH}
              />
              <motion.path
                className="mini-gauge-fill"
                d={MINI_ARC_PATH}
                stroke={card.color}
                strokeDasharray={MINI_ARC_LEN}
                initial={{ strokeDashoffset: MINI_ARC_LEN }}
                animate={{ strokeDashoffset: MINI_ARC_LEN * (1 - card.ratio) }}
                transition={{ delay: 0.3 + i * 0.1, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Server info */}
      {server && (
        <motion.div
          className="server-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Server: <span>{server.name}</span> &bull; <span>{server.location}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
