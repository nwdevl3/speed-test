import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkScanner() {
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/network-scan');
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Scan failed');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <motion.div
      className="scanner-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <span className="scanner-title">🔍 Network Scanner</span>
          {data && (
            <span className="scanner-device-count">
              {data.device_count} device{data.device_count !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <button
          className={`scanner-btn ${scanning ? 'scanning' : ''}`}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <span className="scanner-spinner" />
              Scanning…
            </>
          ) : (
            data ? 'Rescan' : 'Scan Network'
          )}
        </button>
      </div>

      {/* Gateway Info */}
      <AnimatePresence>
        {data && (
          <motion.div
            className="scanner-gateway"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="scanner-gateway-grid">
              <div className="scanner-gw-item">
                <span className="scanner-gw-label">🌐 Router / Gateway</span>
                <span className="scanner-gw-value">{data.gateway}</span>
              </div>
              <div className="scanner-gw-item">
                <span className="scanner-gw-label">💻 Your IP</span>
                <span className="scanner-gw-value">{data.local_ip}</span>
              </div>
              <div className="scanner-gw-item">
                <span className="scanner-gw-label">📡 Interface</span>
                <span className="scanner-gw-value">{data.interface}</span>
              </div>
              <div className="scanner-gw-item">
                <span className="scanner-gw-label">🔢 Subnet</span>
                <span className="scanner-gw-value">/{data.subnet}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning animation */}
      {scanning && (
        <div className="scanner-loading">
          <div className="scanner-pulse-ring" />
          <p>Scanning your local network…</p>
          <p className="scanner-loading-sub">
            Pinging 254 hosts and reading ARP table
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {/* Devices Table */}
      <AnimatePresence>
        {data && data.devices.length > 0 && (
          <motion.div
            className="scanner-devices"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="scanner-table-wrapper">
              <table className="scanner-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>IP Address</th>
                    <th>MAC Address</th>
                    <th>Hostname</th>
                    <th>Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devices.map((device, i) => (
                    <motion.tr
                      key={device.mac + device.ip}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i, duration: 0.3 }}
                      className={device.is_gateway ? 'gateway-row' : ''}
                    >
                      <td className="scanner-type-cell">
                        <span className="scanner-type-badge">
                          {device.type}
                        </span>
                      </td>
                      <td className="scanner-ip-cell">
                        {device.ip}
                        {device.is_gateway && (
                          <span className="scanner-gateway-badge">GATEWAY</span>
                        )}
                      </td>
                      <td className="scanner-mac-cell">{device.mac}</td>
                      <td className="scanner-host-cell">{device.hostname}</td>
                      <td className="scanner-vendor-cell">{device.vendor}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
