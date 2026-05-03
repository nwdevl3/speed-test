import { motion } from 'framer-motion';

export default function SpeedHistory({ history, onClear }) {
  if (!history || history.length === 0) {
    return (
      <motion.div
        className="history-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="history-title">
          <span>📊 Test History</span>
        </div>
        <div className="history-empty">
          No tests yet. Click GO to run your first test.
        </div>
      </motion.div>
    );
  }

  const maxSpeed = Math.max(
    ...history.map(h => Math.max(h.download, h.upload)),
    50
  );

  return (
    <motion.div
      className="history-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="history-title">
        <span>📊 Test History</span>
        <button className="history-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="history-bars">
        {history.map((entry, i) => {
          const dlHeight = Math.max((entry.download / maxSpeed) * 55, 3);
          const ulHeight = Math.max((entry.upload / maxSpeed) * 55, 3);
          const time = new Date(entry.timestamp);
          const label = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

          return (
            <motion.div
              key={entry.timestamp}
              className="history-bar-group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              title={`DL: ${entry.download} Mbps / UL: ${entry.upload} Mbps / Ping: ${entry.ping} ms`}
            >
              <div className="history-bar-pair">
                <motion.div
                  className="history-bar dl"
                  initial={{ height: 0 }}
                  animate={{ height: dlHeight }}
                  transition={{ delay: 0.2 + 0.1 * i, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.div
                  className="history-bar ul"
                  initial={{ height: 0 }}
                  animate={{ height: ulHeight }}
                  transition={{ delay: 0.25 + 0.1 * i, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <div className="history-bar-label">{label}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
