import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function NetworkInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/network-info');
        const data = await res.json();
        setInfo(data);
      } catch {
        setInfo({ ip: 'Unavailable', isp: 'Unavailable', city: '--', country: '--' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = [
    { label: 'Public IP', value: info?.ip, icon: '🌐' },
    { label: 'ISP', value: info?.isp, icon: '📡' },
    { label: 'City', value: info?.city || '--', icon: '🏙️' },
    { label: 'Country', value: info?.country || '--', icon: '🌍' },
  ];

  return (
    <motion.div
      className="network-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="network-title">Network Details</div>
      <div className="network-grid">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            className="network-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
          >
            <div className="network-item-label">
              {item.icon} {item.label}
            </div>
            <div className="network-item-value">
              {loading ? <span className="skeleton" /> : item.value || '--'}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
