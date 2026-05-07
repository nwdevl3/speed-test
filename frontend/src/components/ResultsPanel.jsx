import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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

  return (
    <motion.div
      className="results-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bento-grid">
        {/* Main Metric: Download */}
        <motion.div 
          className="bento-item main download"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bento-label">DOWNLOAD</div>
          <div className="bento-value large">
            <AnimatedNumber value={results.download} />
            <span className="bento-unit">Mbps</span>
          </div>
          <div className="bento-footer">PEAK PERFORMANCE</div>
          <div className="bento-glow" style={{ background: 'var(--download-color)' }} />
        </motion.div>

        {/* Main Metric: Upload */}
        <motion.div 
          className="bento-item main upload"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bento-label">UPLOAD</div>
          <div className="bento-value large">
            <AnimatedNumber value={results.upload} />
            <span className="bento-unit">Mbps</span>
          </div>
          <div className="bento-footer">CONTENT STREAMING</div>
          <div className="bento-glow" style={{ background: 'var(--upload-color)' }} />
        </motion.div>

        {/* Quality Badge */}
        <motion.div 
          className="bento-item quality"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="quality-icon">{quality.icon}</div>
          <div className="quality-text">{quality.label}</div>
          <div className="quality-subtext">OVERALL STATUS</div>
        </motion.div>

        {/* Latency: Ping */}
        <motion.div 
          className="bento-item small ping"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bento-label">LATENCY</div>
          <div className="bento-value small">
            <AnimatedNumber value={results.ping} />
            <span className="bento-unit">ms</span>
          </div>
          <div className="ping-dot" />
        </motion.div>

        {/* Latency: Jitter */}
        <motion.div 
          className="bento-item small jitter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bento-label">JITTER</div>
          <div className="bento-value small">
            <AnimatedNumber value={results.jitter} />
            <span className="bento-unit">ms</span>
          </div>
        </motion.div>

        {/* App Estimators Section */}
        <motion.div 
          className="bento-item full estimator"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="estimator-grid">
            <div className="est-item">
              <span className="est-icon">🎬</span>
              <span className="est-label">4K Video</span>
              <span className="est-result">{results.download > 25 ? 'Instant' : 'Smooth'}</span>
            </div>
            <div className="est-item">
              <span className="est-icon">🎮</span>
              <span className="est-label">Gaming</span>
              <span className="est-result">{results.ping < 40 ? 'Pro' : 'Good'}</span>
            </div>
            <div className="est-item">
              <span className="est-icon">🌐</span>
              <span className="est-label">Web Load</span>
              <span className="est-result">{Math.max(0.1, (results.ping / 100) + (2 / results.download)).toFixed(1)}s</span>
            </div>
          </div>
        </motion.div>

        {/* Server Footer */}
        <motion.div 
          className="bento-item full server"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          CONNECTED TO <span>{server.name}</span> &bull; {server.location}
        </motion.div>
      </div>
    </motion.div>
  );
}
