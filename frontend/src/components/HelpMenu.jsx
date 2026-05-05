import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    {
      title: 'Ping (Latency)',
      icon: '◉',
      desc: 'The time it takes for data to travel to the server and back.',
      ranges: [
        { label: '0 - 30ms', value: 'Excellent (Gaming/VOIP)', color: 'var(--accent-teal)' },
        { label: '30 - 60ms', value: 'Good (Smooth Browsing)', color: 'var(--accent-cyan)' },
        { label: '60 - 100ms', value: 'Fair (Acceptable)', color: 'var(--accent-amber)' },
        { label: '> 100ms', value: 'Poor (Lag/Delay)', color: 'var(--error-color)' },
      ]
    },
    {
      title: 'Jitter',
      icon: '〰',
      desc: 'The variation in ping time over a period of time.',
      ranges: [
        { label: '< 5ms', value: 'Highly Stable', color: 'var(--accent-teal)' },
        { label: '5 - 15ms', value: 'Stable', color: 'var(--accent-cyan)' },
        { label: '> 20ms', value: 'Unstable Connection', color: 'var(--error-color)' },
      ]
    },
    {
      title: 'Download/Upload',
      icon: '⇵',
      desc: 'The volume of data transferred per second (Mbps).',
      ranges: [
        { label: '100+ Mbps', value: '4K Streaming / Large Files', color: 'var(--accent-cyan)' },
        { label: '25-50 Mbps', value: 'HD Streaming / Work from Home', color: 'var(--accent-teal)' },
        { label: '< 10 Mbps', value: 'Basic Browsing Only', color: 'var(--accent-amber)' },
      ]
    }
  ];

  return (
    <>
      <button 
        className="help-button" 
        onClick={() => setIsOpen(true)}
        aria-label="Help"
      >
        <span>?</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="modal-overlay" onClick={() => setIsOpen(false)}>
            <motion.div 
              className="help-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Network Diagnostics Guide</h2>
                <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
              </div>

              <div className="modal-content">
                {sections.map((s, idx) => (
                  <div key={idx} className="help-section">
                    <div className="section-title">
                      <span className="section-icon">{s.icon}</span>
                      <h3>{s.title}</h3>
                    </div>
                    <p className="section-desc">{s.desc}</p>
                    <div className="range-list">
                      {s.ranges.map((r, i) => (
                        <div key={i} className="range-item">
                          <span className="range-label">{r.label}</span>
                          <span className="range-value" style={{ color: r.color }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="modal-footer">
                <p>Values may vary based on your connection type (Fiber, 5G, Wi-Fi).</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
