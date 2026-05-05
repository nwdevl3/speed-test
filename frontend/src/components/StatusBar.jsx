import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StatusBar() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/network-info');
        const data = await res.json();
        setInfo(data);
      } catch {
        setInfo({ ip: '...', isp: '...', city: '...', country: '...' });
      }
    }
    load();
  }, []);

  return (
    <motion.div 
      className="status-bar-fixed"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1, duration: 0.8, ease: "circOut" }}
    >
      <div className="status-bar-item">
        IP: <span>{info?.ip || 'Detecting...'}</span>
      </div>
      <div className="status-bar-item">
        ISP: <span>{info?.isp || 'Checking...'}</span>
      </div>
      <div className="status-bar-item">
        Location: <span>{info ? `${info.city}, ${info.country}` : 'Locating...'}</span>
      </div>
    </motion.div>
  );
}
