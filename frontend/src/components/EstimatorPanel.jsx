import { motion } from 'framer-motion';

export default function EstimatorPanel({ results, visible }) {
  if (!visible || !results) return null;

  const downloadMbps = parseFloat(results.download);
  const uploadMbps = parseFloat(results.upload);

  // Time = (Size in MB * 8) / Speed in Mbps
  const movieTimeSecs = (5000 * 8) / downloadMbps;
  const formatTime = (secs) => {
    if (!isFinite(secs) || secs < 0) return '--';
    if (secs < 60) return `${Math.ceil(secs)}s`;
    const mins = Math.floor(secs / 60);
    const s = Math.ceil(secs % 60);
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m ${s}s`;
  };

  const getGamingQuality = (ping, jitter) => {
    if (ping < 20 && jitter < 5) return { label: 'Excellent', color: '#2dd4bf' };
    if (ping < 60 && jitter < 15) return { label: 'Good', color: '#fbbf24' };
    if (ping < 100 && jitter < 30) return { label: 'Fair', color: '#fb923c' };
    return { label: 'Poor', color: '#ef4444' };
  };

  const getStreamingQuality = (down) => {
    if (down >= 50) return { label: '4K Ultra HD', color: '#2dd4bf' };
    if (down >= 15) return { label: '1080p HD', color: '#fbbf24' };
    if (down >= 5) return { label: '720p', color: '#fb923c' };
    return { label: 'SD / Buffering', color: '#ef4444' };
  };

  const gaming = getGamingQuality(parseFloat(results.ping), parseFloat(results.jitter));
  const streaming = getStreamingQuality(downloadMbps);

  return (
    <motion.div
      className="estimator-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
        borderRadius: '16px',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-secondary, #94a3b8)' }}>Real-World Performance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div className="estimate-card">
          <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🎬</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>5GB 4K Movie</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary, #fff)' }}>
            {formatTime(movieTimeSecs)}
          </div>
        </div>

        <div className="estimate-card">
          <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🎵</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>100MB Playlist</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary, #fff)' }}>
            {formatTime((100 * 8) / downloadMbps)}
          </div>
        </div>

        <div className="estimate-card">
          <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🎮</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>Competitive Gaming</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: gaming.color }}>
            {gaming.label}
          </div>
        </div>

        <div className="estimate-card">
          <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>📺</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>Netflix Streaming</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: streaming.color }}>
            {streaming.label}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
